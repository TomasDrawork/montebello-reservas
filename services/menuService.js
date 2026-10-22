/* ==========================================================================
   Almacenamiento de la carta (menu.json)
   - Producción (MENU_BUCKET definido): se guarda en S3 en carta-data/menu.json,
     con una copia de la versión anterior en carta-data/backups/ en cada guardado.
     El deploy NO pisa este archivo (solo sube el menu.json "semilla" a la raíz).
   - Local: se guarda en data/menu.json (+ data/menu-backups/).
   - Si todavía no existe una carta guardada, se usa el menu.json del proyecto como semilla.
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BUCKET = process.env.MENU_BUCKET || '';
const MENU_KEY = 'carta-data/menu.json';
const BACKUP_PREFIX = 'carta-data/backups/';
const MAX_BACKUPS = 50;

const ROOT = path.join(__dirname, '..');
const SEED_FILE = path.join(ROOT, 'menu.json');
const LOCAL_DIR = path.join(ROOT, 'data');
const LOCAL_FILE = path.join(LOCAL_DIR, 'menu.json');
const LOCAL_BACKUP_DIR = path.join(LOCAL_DIR, 'menu-backups');

let s3 = null;
let S3Cmd = null;
function getS3() {
    if (!s3) {
        // El runtime de Lambda (Node 20) ya incluye el AWS SDK v3
        S3Cmd = require('@aws-sdk/client-s3');
        s3 = new S3Cmd.S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
    }
    return s3;
}

const versionOf = (raw) => crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

function readSeed() {
    return fs.readFileSync(SEED_FILE, 'utf8');
}

async function readRaw() {
    if (BUCKET) {
        try {
            const out = await getS3().send(new S3Cmd.GetObjectCommand({ Bucket: BUCKET, Key: MENU_KEY }));
            return await out.Body.transformToString('utf8');
        } catch (err) {
            if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) return readSeed();
            throw err;
        }
    }
    return fs.existsSync(LOCAL_FILE) ? fs.readFileSync(LOCAL_FILE, 'utf8') : readSeed();
}

async function getMenu() {
    const raw = await readRaw();
    return { menu: JSON.parse(raw), version: versionOf(raw) };
}

async function writeBackup(previousRaw) {
    const name = `menu-${stamp()}.json`;
    if (BUCKET) {
        const client = getS3();
        await client.send(new S3Cmd.PutObjectCommand({
            Bucket: BUCKET, Key: BACKUP_PREFIX + name, Body: previousRaw, ContentType: 'application/json',
        }));
        // Mantener solo las últimas MAX_BACKUPS copias
        const list = await client.send(new S3Cmd.ListObjectsV2Command({ Bucket: BUCKET, Prefix: BACKUP_PREFIX }));
        const keys = (list.Contents || []).map((o) => o.Key).sort();
        const extra = keys.slice(0, Math.max(0, keys.length - MAX_BACKUPS));
        if (extra.length) {
            await client.send(new S3Cmd.DeleteObjectsCommand({
                Bucket: BUCKET, Delete: { Objects: extra.map((Key) => ({ Key })) },
            }));
        }
        return;
    }
    fs.mkdirSync(LOCAL_BACKUP_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_BACKUP_DIR, name), previousRaw);
    const files = fs.readdirSync(LOCAL_BACKUP_DIR).filter((f) => f.endsWith('.json')).sort();
    files.slice(0, Math.max(0, files.length - MAX_BACKUPS))
        .forEach((f) => fs.unlinkSync(path.join(LOCAL_BACKUP_DIR, f)));
}

/**
 * Guarda la carta. Si expectedVersion no coincide con la versión actual
 * (otra persona guardó mientras tanto), lanza un error con code = 'CONFLICT'.
 */
async function saveMenu(menu, expectedVersion) {
    const currentRaw = await readRaw();
    if (expectedVersion && expectedVersion !== versionOf(currentRaw)) {
        const err = new Error('La carta fue modificada por otra persona.');
        err.code = 'CONFLICT';
        throw err;
    }

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    const raw = JSON.stringify({ ...menu, actualizado: today }, null, 2);

    await writeBackup(currentRaw);

    if (BUCKET) {
        await getS3().send(new S3Cmd.PutObjectCommand({
            Bucket: BUCKET, Key: MENU_KEY, Body: raw,
            ContentType: 'application/json', CacheControl: 'no-cache',
        }));
    } else {
        fs.mkdirSync(LOCAL_DIR, { recursive: true });
        fs.writeFileSync(LOCAL_FILE, raw);
    }
    return { menu: JSON.parse(raw), version: versionOf(raw) };
}

/* ---------- Validación de la estructura enviada por el editor ---------- */
const isStr = (v, max = 300) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const isOptStr = (v, max = 1000) => v === undefined || (typeof v === 'string' && v.length <= max);
const isPrice = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 100000000;

function validateItem(it, where) {
    if (!it || typeof it !== 'object') return `${where}: producto inválido.`;
    if (!isStr(it.nombre)) return `${where}: hay un producto sin nombre.`;
    if (!isPrice(it.precio)) return `${where}: "${it.nombre}" tiene un precio inválido.`;
    if (!isOptStr(it.desc) || !isOptStr(it.cepa, 100)) return `${where}: "${it.nombre}" tiene un texto demasiado largo.`;
    return null;
}

function validateMenu(menu) {
    if (!menu || typeof menu !== 'object' || !Array.isArray(menu.secciones)) return 'Formato de carta inválido.';
    for (const s of menu.secciones) {
        if (!isStr(s.id, 80) || !isStr(s.nombre, 120) || !Array.isArray(s.categorias)) return 'Hay una sección inválida.';
        const catIds = new Set();
        for (const c of s.categorias) {
            if (!isStr(c.id, 80) || !isStr(c.nombre, 120)) return `${s.nombre}: hay una categoría sin nombre.`;
            if (!/^[a-z0-9-]+$/.test(c.id)) return `${s.nombre}: identificador de categoría inválido (${c.id}).`;
            if (catIds.has(c.id)) return `${s.nombre}: hay dos categorías con el mismo nombre (${c.nombre}).`;
            catIds.add(c.id);
            const where = `${s.nombre} › ${c.nombre}`;
            if (Array.isArray(c.bodegas)) {
                for (const b of c.bodegas) {
                    if (!isStr(b.nombreBodega, 120) || !Array.isArray(b.items)) return `${where}: hay una bodega sin nombre.`;
                    for (const it of b.items) {
                        const e = validateItem(it, `${where} › ${b.nombreBodega}`);
                        if (e) return e;
                    }
                }
            } else if (Array.isArray(c.items)) {
                for (const it of c.items) {
                    const e = validateItem(it, where);
                    if (e) return e;
                }
            } else {
                return `${where}: la categoría no tiene productos.`;
            }
        }
    }
    return null;
}

module.exports = { getMenu, saveMenu, validateMenu };

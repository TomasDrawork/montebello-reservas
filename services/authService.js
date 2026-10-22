/* ==========================================================================
   Autenticación del staff (panel de reservas + editor de carta)
   - Contraseña única en la variable de entorno ADMIN_PASSWORD (sin valor por defecto).
   - Tokens firmados con HMAC-SHA256 (formato tipo JWT) usando JWT_SECRET, con vencimiento.
   - Límite de intentos fallidos de login por IP.
   ========================================================================== */
const crypto = require('crypto');

const IS_LAMBDA = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.LAMBDA_TASK_ROOT;
const TOKEN_TTL_SECONDS = 12 * 60 * 60; // 12 horas

// En local, si no hay JWT_SECRET se genera uno al iniciar (las sesiones se pierden al reiniciar).
// En Lambda es obligatorio: varias instancias deben compartir la misma clave.
let SECRET = process.env.JWT_SECRET;
if (!SECRET && !IS_LAMBDA) {
    SECRET = crypto.randomBytes(32).toString('hex');
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

function sign(data) {
    return crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
}

function safeEqual(a, b) {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}

function isConfigured() {
    return !!process.env.ADMIN_PASSWORD && !!SECRET;
}

function checkPassword(password) {
    if (!isConfigured() || typeof password !== 'string') return false;
    // Comparación en tiempo constante (hash para igualar longitudes)
    const h = (s) => crypto.createHash('sha256').update(s).digest();
    return crypto.timingSafeEqual(h(password), h(process.env.ADMIN_PASSWORD));
}

function createToken() {
    const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const payload = b64url(JSON.stringify({ sub: 'staff', iat: now, exp: now + TOKEN_TTL_SECONDS }));
    return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

function verifyToken(token) {
    if (!SECRET || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payload, signature] = parts;
    if (!safeEqual(signature, sign(`${header}.${payload}`))) return false;
    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return typeof data.exp === 'number' && data.exp > Math.floor(Date.now() / 1000);
    } catch {
        return false;
    }
}

/* ---------- Límite de intentos de login (por IP, en memoria) ---------- */
const MAX_ATTEMPTS = 5;
const LOCK_MS = 10 * 60 * 1000; // 10 minutos
const attempts = new Map(); // ip -> { count, lockedUntil }

function clientIp(req) {
    const fwd = req.headers['x-forwarded-for'];
    return (fwd ? String(fwd).split(',')[0] : req.ip || '').trim();
}

function isLocked(ip) {
    const a = attempts.get(ip);
    return !!(a && a.lockedUntil && a.lockedUntil > Date.now());
}

function registerFailure(ip) {
    const a = attempts.get(ip) || { count: 0, lockedUntil: 0 };
    if (a.lockedUntil && a.lockedUntil <= Date.now()) { a.count = 0; a.lockedUntil = 0; }
    a.count += 1;
    if (a.count >= MAX_ATTEMPTS) a.lockedUntil = Date.now() + LOCK_MS;
    attempts.set(ip, a);
}

function clearFailures(ip) {
    attempts.delete(ip);
}

/* ---------- Middleware: protege todas las rutas /api/admin/* menos el login ---------- */
function requireAdmin(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!verifyToken(token)) {
        return res.status(401).json({ success: false, message: 'Sesión inválida o vencida. Volvé a ingresar.' });
    }
    next();
}

module.exports = {
    isConfigured,
    checkPassword,
    createToken,
    verifyToken,
    requireAdmin,
    clientIp,
    isLocked,
    registerFailure,
    clearFailures,
};

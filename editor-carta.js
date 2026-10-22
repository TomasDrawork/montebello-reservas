/* ==========================================================================
   Club Montebello — Editor de Carta
   - Edita precios, productos, categorías (títulos) y bodegas.
   - Los cambios quedan locales hasta tocar "Guardar cambios".
   - Al guardar, el servidor hace copia de la versión anterior.
   ========================================================================== */
(() => {
    const TOKEN_KEY = 'montebello_admin_token'; // compartido con el panel de reservas

    const $ = (id) => document.getElementById(id);
    const loginScreen = $('loginScreen');
    const loginForm = $('loginForm');
    const loginPassword = $('loginPassword');
    const loginError = $('loginError');
    const app = $('app');
    const sectionTabs = $('sectionTabs');
    const catList = $('catList');
    const editor = $('editor');
    const saveBar = $('saveBar');
    const saveStatus = $('saveStatus');
    const btnSave = $('btnSave');
    const btnDiscard = $('btnDiscard');
    const toastEl = $('toast');

    let token = localStorage.getItem(TOKEN_KEY);
    let menu = null;
    let version = null;
    let dirty = false;
    let secIdx = 0;
    let catIdx = 0;
    let search = '';

    const esc = (s = '') => String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/&/g, ' y ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'categoria';

    const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    /* ---------- Utilidades UI ---------- */
    let toastTimer;
    function toast(msg, type = 'ok') {
        toastEl.textContent = msg;
        toastEl.className = `toast show ${type}`;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, 3500);
    }

    function setDirty(v) {
        dirty = v;
        saveBar.classList.toggle('dirty', v);
        btnSave.disabled = !v;
        btnDiscard.disabled = !v;
        saveStatus.textContent = v ? '● Cambios sin guardar' : 'Sin cambios';
    }

    window.addEventListener('beforeunload', (e) => {
        if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });

    /* ---------- API ---------- */
    async function api(url, options = {}) {
        const res = await fetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}`, ...(options.headers || {}) },
        });
        let data = {};
        try { data = await res.json(); } catch { /* sin cuerpo */ }
        if (res.status === 401) {
            logout('Tu sesión venció. Ingresá de nuevo.');
            throw new Error('401');
        }
        return { res, data };
    }

    /* ---------- Sesión ---------- */
    function showLogin(msg = '') {
        app.hidden = true;
        loginScreen.hidden = false;
        loginError.textContent = msg;
        loginPassword.focus();
    }

    function logout(msg = '') {
        localStorage.removeItem(TOKEN_KEY);
        token = null;
        showLogin(msg);
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: loginPassword.value }),
            });
            const data = await res.json();
            if (data.success && data.token) {
                token = data.token;
                localStorage.setItem(TOKEN_KEY, token);
                loginPassword.value = '';
                await loadMenu();
            } else {
                loginError.textContent = data.message || 'Contraseña incorrecta.';
            }
        } catch {
            loginError.textContent = 'Error de conexión.';
        }
    });

    $('btnLogout').addEventListener('click', () => {
        if (dirty && !confirm('Tenés cambios sin guardar. ¿Salir igual?')) return;
        setDirty(false);
        logout();
    });

    /* ---------- Carga ---------- */
    async function loadMenu() {
        try {
            const { res, data } = await api('/api/admin/menu');
            if (!res.ok || !data.success) throw new Error(data.message || 'Error');
            menu = data.menu;
            version = data.version;
            loginScreen.hidden = true;
            app.hidden = false;
            secIdx = Math.min(secIdx, menu.secciones.length - 1);
            catIdx = 0;
            setDirty(false);
            renderAll();
        } catch (err) {
            if (err.message !== '401') {
                showLogin('No se pudo cargar la carta. Intentá de nuevo.');
            }
        }
    }

    /* ---------- Render ---------- */
    const section = () => menu.secciones[secIdx];
    const category = () => section().categorias[catIdx];
    const countItems = (c) => (c.bodegas ? c.bodegas.reduce((n, b) => n + (b.items || []).length, 0) : (c.items || []).length);

    function renderAll() {
        renderTabs();
        renderCats();
        renderEditor();
    }

    function renderTabs() {
        sectionTabs.innerHTML = menu.secciones.map((s, i) =>
            `<button type="button" class="tab${i === secIdx ? ' active' : ''}" data-sec="${i}" id="tab-${esc(s.id)}">${esc(s.nombre)}</button>`
        ).join('');
    }

    function renderCats() {
        const cats = section().categorias;
        catList.innerHTML = cats.length
            ? cats.map((c, i) => `
                <li><button type="button" class="cat-item${i === catIdx ? ' active' : ''}" data-cat="${i}" id="cat-${esc(c.id)}">
                    <span>${esc(c.nombre || 'Sin título')}</span><span class="cat-count">${countItems(c)}</span>
                </button></li>`).join('')
            : '<li class="note">Sin categorías todavía.</li>';
    }

    function itemRow(it, i, b, isWine) {
        const sub = isWine
            ? `<input type="text" class="item-sub" data-field="cepa" placeholder="Cepa (ej: Malbec)" value="${esc(it.cepa || '')}">`
            : `<textarea class="item-sub" data-field="desc" rows="1" placeholder="Descripción (opcional)">${esc(it.desc || '')}</textarea>`;
        const extra = it.detalle && it.detalle.length
            ? `<p class="note">Incluye ${it.detalle.length} sub-ítems (se conservan).</p>` : '';
        return `
        <li class="item" data-i="${i}" data-b="${b}" data-name="${esc(norm(it.nombre))}">
            <div class="item-main">
                <input type="text" class="item-name" data-field="nombre" placeholder="Nombre del producto" value="${esc(it.nombre)}">
                ${sub}
                ${extra}
            </div>
            <div class="price-wrap">
                <input type="number" data-field="precio" min="0" step="100" inputmode="numeric" placeholder="0" value="${Number.isFinite(it.precio) ? it.precio : ''}" aria-label="Precio">
            </div>
            <button type="button" class="icon-btn" data-action="del-item" title="Eliminar producto" aria-label="Eliminar producto">✕</button>
        </li>`;
    }

    function renderEditor() {
        const sec = section();
        const cat = category();
        if (!cat) {
            editor.innerHTML = `<p class="empty-msg">Esta sección no tiene categorías.<br>Creá una con “+ Nueva”.</p>`;
            return;
        }

        let body = '';
        if (Array.isArray(cat.bodegas)) {
            body = cat.bodegas.map((bod, b) => `
                <div class="bodega" data-b="${b}">
                    <div class="bodega-head">
                        <input type="text" data-field="nombreBodega" placeholder="Nombre de la bodega" value="${esc(bod.nombreBodega)}" aria-label="Nombre de la bodega">
                        <button type="button" class="icon-btn" data-action="del-bodega" title="Eliminar bodega" aria-label="Eliminar bodega">🗑</button>
                    </div>
                    <ul class="items">${(bod.items || []).map((it, i) => itemRow(it, i, b, true)).join('')}</ul>
                    <button type="button" class="btn btn-add btn-small" data-action="add-item" data-b="${b}">+ Agregar vino a ${esc(bod.nombreBodega || 'esta bodega')}</button>
                </div>`).join('');
            body += `<button type="button" class="btn btn-add" data-action="add-bodega" id="btnAddBodega">+ Agregar bodega</button>
                     <p class="note">En la carta las bodegas se muestran en orden alfabético automáticamente.</p>`;
        } else {
            body = `<ul class="items">${(cat.items || []).map((it, i) => itemRow(it, i, '', false)).join('')}</ul>
                    <button type="button" class="btn btn-add" data-action="add-item" data-b="" id="btnAddItem">+ Agregar producto</button>`;
        }

        editor.innerHTML = `
            <div class="editor-head">
                <div class="field">
                    <label class="field-label" for="catTitle">Título de la categoría · ${esc(sec.nombre)}</label>
                    <input type="text" id="catTitle" class="cat-title-input" data-field="catNombre" value="${esc(cat.nombre)}">
                </div>
                <button type="button" class="btn btn-danger-ghost" data-action="del-cat" id="btnDelCategory">Eliminar categoría</button>
            </div>
            <div class="search-row">
                <input type="search" id="itemSearch" placeholder="🔎 Buscar producto en esta categoría..." value="${esc(search)}">
            </div>
            ${body}`;
        applySearch();
        editor.querySelectorAll('textarea').forEach(autoGrow);
    }

    function autoGrow(t) {
        t.style.height = 'auto';
        t.style.height = `${t.scrollHeight + 2}px`;
    }

    function applySearch() {
        const q = norm(search);
        editor.querySelectorAll('.item').forEach((li) => {
            li.hidden = !!q && !li.dataset.name.includes(q);
        });
        editor.querySelectorAll('.bodega').forEach((bd) => {
            const name = norm(bd.querySelector('[data-field="nombreBodega"]').value);
            const anyItem = [...bd.querySelectorAll('.item')].some((li) => !li.hidden);
            bd.hidden = !!q && !anyItem && !name.includes(q);
            if (q && name.includes(q)) bd.querySelectorAll('.item').forEach((li) => { li.hidden = false; });
        });
    }

    /* ---------- Navegación ---------- */
    sectionTabs.addEventListener('click', (e) => {
        const t = e.target.closest('[data-sec]');
        if (!t) return;
        secIdx = Number(t.dataset.sec);
        catIdx = 0;
        search = '';
        renderAll();
    });

    catList.addEventListener('click', (e) => {
        const t = e.target.closest('[data-cat]');
        if (!t) return;
        catIdx = Number(t.dataset.cat);
        search = '';
        renderCats();
        renderEditor();
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    $('btnAddCategory').addEventListener('click', () => {
        const nombre = (prompt('Nombre de la nueva categoría:') || '').trim();
        if (!nombre) return;
        const sec = section();
        const esVinos = confirm('¿Es una categoría con bodegas (como Vinos)?\n\nAceptar = con bodegas · Cancelar = lista común de productos');
        let id = slug(nombre);
        let n = 2;
        while (sec.categorias.some((c) => c.id === id)) id = `${slug(nombre)}-${n++}`;
        sec.categorias.push(esVinos ? { id, nombre, bodegas: [] } : { id, nombre, items: [] });
        catIdx = sec.categorias.length - 1;
        setDirty(true);
        renderCats();
        renderEditor();
    });

    /* ---------- Edición en línea ---------- */
    function targetItem(el) {
        const li = el.closest('.item');
        if (!li) return null;
        const cat = category();
        const list = li.dataset.b !== '' ? cat.bodegas[Number(li.dataset.b)].items : cat.items;
        return list[Number(li.dataset.i)];
    }

    editor.addEventListener('input', (e) => {
        const el = e.target;
        if (el.id === 'itemSearch') { search = el.value; applySearch(); return; }
        const field = el.dataset.field;
        if (!field) return;
        const cat = category();

        if (field === 'catNombre') {
            cat.nombre = el.value;
            const btn = catList.querySelector(`[data-cat="${catIdx}"] span`);
            if (btn) btn.textContent = el.value || 'Sin título';
        } else if (field === 'nombreBodega') {
            cat.bodegas[Number(el.closest('.bodega').dataset.b)].nombreBodega = el.value;
        } else {
            const it = targetItem(el);
            if (!it) return;
            if (field === 'precio') {
                it.precio = el.value === '' ? NaN : Math.round(Number(el.value));
            } else if (field === 'cepa') {
                it.cepa = el.value;
                it.tipoCepa = slug(el.value);
            } else if (field === 'desc') {
                it.desc = el.value;
                autoGrow(el);
            } else {
                it[field] = el.value;
                if (field === 'nombre') el.closest('.item').dataset.name = norm(el.value);
            }
        }
        el.classList.add('changed');
        setDirty(true);
    });

    editor.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const cat = category();
        const action = btn.dataset.action;

        if (action === 'add-item') {
            const b = btn.dataset.b;
            const isWine = b !== '';
            const list = isWine ? cat.bodegas[Number(b)].items : cat.items;
            list.push(isWine ? { nombre: '', cepa: '', tipoCepa: '', precio: NaN } : { nombre: '', desc: '', precio: NaN });
            search = '';
            setDirty(true);
            renderEditor();
            renderCats();
            const sel = isWine ? `.bodega[data-b="${b}"] .item:last-child` : '.item:last-child';
            const row = editor.querySelector(sel);
            if (row) { row.classList.add('is-new'); row.querySelector('.item-name').focus(); }
        } else if (action === 'del-item') {
            const it = targetItem(btn);
            if (!confirm(`¿Eliminar "${it.nombre || 'este producto'}" de la carta?`)) return;
            const li = btn.closest('.item');
            const list = li.dataset.b !== '' ? cat.bodegas[Number(li.dataset.b)].items : cat.items;
            list.splice(Number(li.dataset.i), 1);
            setDirty(true);
            renderEditor();
            renderCats();
        } else if (action === 'add-bodega') {
            const nombre = (prompt('Nombre de la nueva bodega:') || '').trim();
            if (!nombre) return;
            cat.bodegas.push({ nombreBodega: nombre, items: [] });
            setDirty(true);
            renderEditor();
            const last = editor.querySelector('.bodega:last-of-type');
            if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (action === 'del-bodega') {
            const b = Number(btn.closest('.bodega').dataset.b);
            const bod = cat.bodegas[b];
            if (!confirm(`¿Eliminar la bodega "${bod.nombreBodega}" y sus ${bod.items.length} vinos?`)) return;
            cat.bodegas.splice(b, 1);
            setDirty(true);
            renderEditor();
            renderCats();
        } else if (action === 'del-cat') {
            if (!confirm(`¿Eliminar la categoría "${cat.nombre}" y todos sus productos (${countItems(cat)})?`)) return;
            section().categorias.splice(catIdx, 1);
            catIdx = Math.max(0, catIdx - 1);
            setDirty(true);
            renderCats();
            renderEditor();
        }
    });

    /* ---------- Validación y guardado ---------- */
    function findProblem() {
        for (let s = 0; s < menu.secciones.length; s++) {
            const sec = menu.secciones[s];
            for (let c = 0; c < sec.categorias.length; c++) {
                const cat = sec.categorias[c];
                const goto = () => { secIdx = s; catIdx = c; search = ''; renderAll(); };
                if (!String(cat.nombre || '').trim()) return { msg: `Hay una categoría sin título en ${sec.nombre}.`, goto, sel: '#catTitle' };
                const groups = cat.bodegas ? cat.bodegas.map((b, bi) => ({ items: b.items, b: bi, bod: b })) : [{ items: cat.items || [], b: '' }];
                for (const g of groups) {
                    if (g.bod && !String(g.bod.nombreBodega || '').trim()) {
                        return { msg: `Hay una bodega sin nombre en ${cat.nombre}.`, goto, sel: `.bodega[data-b="${g.b}"] [data-field="nombreBodega"]` };
                    }
                    for (let i = 0; i < g.items.length; i++) {
                        const it = g.items[i];
                        const row = `.item[data-b="${g.b}"][data-i="${i}"]`;
                        if (!String(it.nombre || '').trim()) return { msg: `Hay un producto sin nombre en ${cat.nombre}.`, goto, sel: `${row} [data-field="nombre"]` };
                        if (!Number.isFinite(it.precio) || it.precio < 0) return { msg: `"${it.nombre}" (${cat.nombre}) no tiene un precio válido.`, goto, sel: `${row} [data-field="precio"]` };
                    }
                }
            }
        }
        return null;
    }

    // Limpia campos vacíos opcionales para que el JSON quede prolijo
    function cleanMenu(m) {
        const copy = JSON.parse(JSON.stringify(m));
        const tidy = (it) => {
            it.nombre = it.nombre.trim();
            if (typeof it.desc === 'string') { it.desc = it.desc.trim(); if (!it.desc) delete it.desc; }
            if (typeof it.cepa === 'string') { it.cepa = it.cepa.trim(); if (!it.cepa) { delete it.cepa; delete it.tipoCepa; } }
        };
        copy.secciones.forEach((s) => s.categorias.forEach((c) => {
            c.nombre = c.nombre.trim();
            if (c.bodegas) c.bodegas.forEach((b) => { b.nombreBodega = b.nombreBodega.trim(); b.items.forEach(tidy); });
            else (c.items || []).forEach(tidy);
        }));
        return copy;
    }

    btnSave.addEventListener('click', async () => {
        const problem = findProblem();
        if (problem) {
            problem.goto();
            const el = editor.querySelector(problem.sel);
            if (el) { el.focus(); el.classList.add('changed'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            toast(`⚠️ ${problem.msg}`, 'err');
            return;
        }

        btnSave.disabled = true;
        saveStatus.textContent = '⏳ Guardando...';
        try {
            const { res, data } = await api('/api/admin/menu', {
                method: 'PUT',
                body: JSON.stringify({ menu: cleanMenu(menu), version }),
            });
            if (res.ok && data.success) {
                menu = data.menu;
                version = data.version;
                setDirty(false);
                renderAll();
                saveStatus.textContent = '✅ Guardado';
                toast('✅ Carta guardada. Ya se ve actualizada en la carta digital.');
                setTimeout(() => { if (!dirty) saveStatus.textContent = 'Sin cambios'; }, 3000);
            } else if (res.status === 409) {
                setDirty(true);
                toast(data.message, 'err');
                if (confirm(`${data.message}\n\n¿Recargar ahora? (Se pierden tus cambios no guardados)`)) {
                    setDirty(false);
                    await loadMenu();
                }
            } else {
                setDirty(true);
                toast(`❌ ${data.message || 'No se pudo guardar.'}`, 'err');
            }
        } catch (err) {
            if (err.message !== '401') {
                setDirty(true);
                toast('❌ Error de conexión. Los cambios no se guardaron.', 'err');
            }
        }
    });

    btnDiscard.addEventListener('click', async () => {
        if (!confirm('¿Descartar todos los cambios sin guardar?')) return;
        setDirty(false);
        await loadMenu();
        toast('Cambios descartados.');
    });

    /* ---------- Inicio ---------- */
    if (token) loadMenu();
    else showLogin();
})();

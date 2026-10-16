/* ==========================================================================
   Club Montebello — Carta Digital
   Rutas (hash):
     #/                      → Portada: Comidas · Bebidas · Desayunos y Meriendas
     #/comidas               → Categorías de la sección
     #/comidas/carnes        → Platos de la categoría
   Los datos viven en menu.json (editar precios ahí, sin tocar este archivo).
   ========================================================================== */

(() => {
    const view = document.getElementById('view');
    const crumbs = document.getElementById('crumbs');
    const lastUpdate = document.getElementById('lastUpdate');
    const BASE_TITLE = 'Club Montebello';

    let menu = null;

    const ARROW = '<svg class="nav-card-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';

    const priceFmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
    const formatPrice = (n) => `$ ${priceFmt.format(n)}`;

    const esc = (s = '') => String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const visibleItems = (cat) => (cat.items || []).filter((i) => i.disponible !== false);
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

    /* ---------- Render helpers ---------- */

    function setCrumbs(parts) {
        if (!parts.length) { crumbs.innerHTML = ''; return; }
        const all = [{ label: 'Carta', href: '#/' }, ...parts];
        crumbs.innerHTML = all.map((p, i) => {
            const last = i === all.length - 1;
            const node = last
                ? `<span class="current" aria-current="page">${esc(p.label)}</span>`
                : `<a href="${p.href}">${esc(p.label)}</a>`;
            return i ? `<span class="sep">/</span>${node}` : node;
        }).join('');
    }

    function render(html, title) {
        view.classList.remove('view-enter');
        view.innerHTML = html;
        void view.offsetWidth; // reinicia la animación
        view.classList.add('view-enter');
        document.title = title ? `${title} | Carta ${BASE_TITLE}` : `Carta Digital | ${BASE_TITLE}`;
    }

    const delay = (i) => `style="animation-delay:${Math.min(i * 45, 450)}ms"`;

    /* ---------- Vistas ---------- */

    function renderHome() {
        setCrumbs([]);
        const cards = menu.secciones.map((s, i) => {
            const n = s.categorias.length;
            const ready = n > 0;
            return `
            <li>
              <a href="#/${s.id}" class="nav-card large${ready ? '' : ' is-disabled'}" id="btn-${s.id}" ${delay(i)}
                 ${ready ? '' : 'aria-disabled="true" tabindex="-1"'}>
                <span class="nav-card-text">
                  <span class="nav-card-title">${esc(s.nombre)}</span>
                  <span class="nav-card-meta">${ready ? plural(n, 'categoría', 'categorías') : 'Próximamente'}</span>
                </span>
                ${ARROW}
              </a>
            </li>`;
        }).join('');

        render(`
            <h2 class="view-title">Nuestra Carta</h2>
            <hr class="view-rule">
            <ul class="nav-list">${cards}</ul>
        `);
    }

    function renderSection(sec) {
        setCrumbs([{ label: sec.nombre, href: `#/${sec.id}` }]);

        if (!sec.categorias.length) {
            render(`
                <h2 class="view-title">${esc(sec.nombre)}</h2>
                <hr class="view-rule">
                <p class="empty">Estamos preparando esta sección.<br>Muy pronto vas a poder verla acá.</p>
                <a href="#/" class="back-link">← Volver a la carta</a>
            `, sec.nombre);
            return;
        }

        const cards = sec.categorias.map((c, i) => {
            const n = visibleItems(c).length;
            return `
            <li>
              <a href="#/${sec.id}/${c.id}" class="nav-card" id="btn-${sec.id}-${c.id}" ${delay(i)}>
                <span class="nav-card-text">
                  <span class="nav-card-title">${esc(c.nombre)}</span>
                  <span class="nav-card-meta">${plural(n, 'opción', 'opciones')}</span>
                </span>
                ${ARROW}
              </a>
            </li>`;
        }).join('');

        render(`
            <h2 class="view-title">${esc(sec.nombre)}</h2>
            <hr class="view-rule">
            <ul class="nav-list">${cards}</ul>
            <a href="#/" class="back-link">← Volver a la carta</a>
        `, sec.nombre);
    }

    function renderDish(item, i) {
        // Renderiza la cepa debajo del nombre si existe (en minúsculas y sin recuadro)
        const cepaHtml = item.cepa 
            ? '<div class="dish-cepa">' + item.cepa.toLowerCase() + '</div>' 
            : '';

        // Construcción segura de la descripción
        let descHtml = '';
        if (item.desc) {
            descHtml = '<p class="dish-desc">' + esc(item.desc) + '</p>';
        }

        // Construcción segura de los detalles (si los tiene)
        let detailHtml = '';
        if (item.detalle && item.detalle.length > 0) {
            let detailItems = '';
            for (let d of item.detalle) {
                let dDesc = d.desc ? '<span>' + esc(d.desc) + '</span>' : '';
                detailItems += '<li><strong>' + esc(d.nombre) + '</strong>' + dDesc + '</li>';
            }
            detailHtml = '<ul class="dish-detail">' + detailItems + '</ul>';
        }

        return `
        <li class="dish" ${delay(i)}>
          <div class="dish-head">
            <h3 class="dish-name">${esc(item.nombre)}</h3>
            <span class="dish-price">${formatPrice(item.precio)}</span>
          </div>
          ${cepaHtml}
          ${descHtml}
          ${detailHtml}
        </li>`;
    }

    function renderCategory(sec, cat) {
        setCrumbs([
            { label: sec.nombre, href: '#/' + sec.id },
            { label: cat.nombre, href: '#/' + sec.id + '/' + cat.id },
        ]);

        const idx = sec.categorias.indexOf(cat);
        const prev = sec.categorias[idx - 1];
        const next = sec.categorias[idx + 1];

        const chips = sec.categorias.map(function(c) {
            const isActive = c === cat;
            return '<a href="#/' + sec.id + '/' + c.id + '" class="chip' + (isActive ? ' active' : '') + '" id="chip-' + c.id + '"' + (isActive ? ' aria-current="page"' : '') + '>' + esc(c.nombre) + '</a>';
        }).join('');

        // Soporte para listas planas (items) o bodegas agrupadas con títulos
        let list = '';
        if (cat.bodegas && Array.isArray(cat.bodegas)) {
            let bodegasHtml = '';
            cat.bodegas.forEach(bodega => {
                const bodegaItems = (bodega.items || []).filter(i => i.disponible !== false);
                if (bodegaItems.length > 0) {
                    bodegasHtml += `<div class="bodega-group-title" style="margin: 25px 0 12px 0; font-family: 'Outfit', sans-serif; font-size: 1.2rem; font-weight: 600; color: #D4AF37; text-transform: uppercase; letter-spacing: 1px;">${esc(bodega.nombreBodega)}</div>`;
                    bodegasHtml += '<ul class="dish-list">' + bodegaItems.map((item, idxItem) => renderDish(item, idxItem)).join('') + '</ul>';
                }
            });
            list = bodegasHtml || '<p class="empty">No hay opciones disponibles en este momento.</p>';
        } else {
            const items = visibleItems(cat);
            list = items.length
                ? '<ul class="dish-list">' + items.map(renderDish).join('') + '</ul>'
                : '<p class="empty">No hay opciones disponibles en este momento.</p>';
        }

        const prevLink = prev 
            ? '<a href="#/' + sec.id + '/' + prev.id + '" class="prev" id="pagerPrev"><small>← Anterior</small>' + esc(prev.nombre) + '</a>' 
            : '<span></span>';
            
        const nextLink = next 
            ? '<a href="#/' + sec.id + '/' + next.id + '" class="next" id="pagerNext"><small>Siguiente →</small>' + esc(next.nombre) + '</a>' 
            : '<span></span>';

        const pager = '<div class="pager">' + prevLink + nextLink + '</div>';

        const htmlContent = 
            '<div class="chips-wrap"><nav class="chips" aria-label="Categorías de ' + esc(sec.nombre) + '">' + chips + '</nav></div>' +
            '<h2 class="view-title">' + esc(cat.nombre) + '</h2>' +
            '<hr class="view-rule">' +
            list +
            pager +
            '<a href="#/' + sec.id + '" class="back-link">← Volver a ' + esc(sec.nombre) + '</a>';

        render(htmlContent, cat.nombre);

        // Centra el chip activo en la barra deslizable
        const active = view.querySelector('.chip.active');
        if (active) {
            const bar = active.parentElement;
            bar.scrollLeft = active.offsetLeft - (bar.clientWidth - active.offsetWidth) / 2;
        }
    }

    /* ---------- Router ---------- */

    function route() {
        const [secId, catId] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
        const sec = secId && menu.secciones.find((s) => s.id === secId);
        const cat = sec && catId && sec.categorias.find((c) => c.id === catId);

        if (sec && cat) renderCategory(sec, cat);
        else if (sec) renderSection(sec);
        else renderHome();

        window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    }

    /* ---------- Inicio ---------- */

    fetch('menu.json', { cache: 'no-cache' })
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then((data) => {
            menu = data;
            if (data.actualizado) {
                const [y, m, d] = data.actualizado.split('-');
                lastUpdate.textContent = `Precios actualizados al ${d}/${m}/${y}`;
            }
            window.addEventListener('hashchange', route);
            route();
        })
        .catch(() => {
            view.innerHTML = '<p class="empty">No pudimos cargar la carta.<br>Por favor, actualizá la página.</p>';
        });
})();
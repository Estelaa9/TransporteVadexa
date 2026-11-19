// frontend/js/paginacion.js - Paginación y orden por columna para TODAS las tablas .tms-table.
// Se activa una sola vez (iniciarPaginacion) y detecta automáticamente cuando un módulo dibuja o
// vuelve a dibujar una tabla, así que ningún módulo necesita código adicional.
// - Muestra 10 registros por página (se puede elegir 15 o 25) con navegación 1, 2, 3… debajo de la tabla.
// - Clic en un encabezado ordena la columna (ascendente / descendente).
// - Las filas ocultas por la paginación se imprimen y se exportan igual (no se eliminan del DOM).

const TAMANOS = [10, 15, 25];
const estados = new WeakMap(); // tbody -> { pagina, tamano, col, dir, filas:Set }
let tamanoPreferido = 10;
try { tamanoPreferido = Number(localStorage.getItem('vdx-pag-tamano')) || 10; } catch { /* sin almacenamiento */ }

const esFilaDeDatos = tr => !(tr.children.length === 1 && tr.children[0].hasAttribute('colspan'));

function valorOrden(texto) {
  const t = texto.trim();
  let m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(t);
  if (m) return { n: Number(m[3] + m[2] + m[1]) };
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return { n: Number(m[1] + m[2] + m[3]) };
  const num = t.replace(/^(S\/|#)\s*/, '').replace(/,/g, '').replace(/\s*%$/, '');
  if (num !== '' && /^-?\d+(\.\d+)?$/.test(num)) return { n: Number(num) };
  return { s: t.toLocaleLowerCase('es') };
}

function comparar(a, b) {
  if (a.n !== undefined && b.n !== undefined) return a.n - b.n;
  if (a.n !== undefined) return -1;
  if (b.n !== undefined) return 1;
  return a.s.localeCompare(b.s, 'es', { numeric: true });
}

function contenedorDe(table) {
  const p = table.parentElement;
  return p && p.classList.contains('tms-table-container') ? p : table;
}

function pagerDe(table) {
  const ancla = contenedorDe(table);
  let pager = ancla.nextElementSibling;
  if (!pager || !pager.classList.contains('tms-pager')) {
    pager = document.createElement('nav');
    pager.className = 'tms-pager';
    pager.setAttribute('aria-label', 'Paginación de la tabla');
    ancla.after(pager);
  }
  pager._table = table;
  return pager;
}

function ordenar(tbody, st) {
  if (st.col === null) return;
  const filas = [...tbody.children].filter(esFilaDeDatos);
  const factor = st.dir === 'desc' ? -1 : 1;
  const claves = new Map(filas.map(tr => [tr, valorOrden(tr.children[st.col]?.innerText ?? tr.children[st.col]?.textContent ?? '')]));
  filas.sort((a, b) => factor * comparar(claves.get(a), claves.get(b)));
  filas.forEach(tr => tbody.appendChild(tr));
}

function render(table) {
  const tbody = table.tBodies[0];
  if (!tbody) return;
  const st = estados.get(tbody);
  const filas = [...tbody.children].filter(esFilaDeDatos);
  const total = filas.length;
  const paginas = Math.max(1, Math.ceil(total / st.tamano));
  st.pagina = Math.min(Math.max(1, st.pagina), paginas);
  const ini = (st.pagina - 1) * st.tamano;
  filas.forEach((tr, i) => {
    const oculta = i < ini || i >= ini + st.tamano;
    if (oculta) tr.setAttribute('data-pag-oculta', ''); else tr.removeAttribute('data-pag-oculta');
  });

  const pager = pagerDe(table);
  if (total <= TAMANOS[0]) { pager.hidden = true; return; }
  pager.hidden = false;
  const desde = total ? ini + 1 : 0;
  const hasta = Math.min(ini + st.tamano, total);
  // Ventana de hasta 5 páginas alrededor de la actual.
  let a = Math.max(1, st.pagina - 2);
  const b = Math.min(paginas, a + 4);
  a = Math.max(1, b - 4);
  const btn = (p, label, extra = '') => `<button type="button" data-pag="${p}" ${extra}>${label}</button>`;
  let numeros = '';
  if (a > 1) numeros += btn(1, '1') + (a > 2 ? '<span class="tms-pager-sep">…</span>' : '');
  for (let p = a; p <= b; p++) numeros += btn(p, String(p), p === st.pagina ? 'aria-current="page" class="activa"' : '');
  if (b < paginas) numeros += (b < paginas - 1 ? '<span class="tms-pager-sep">…</span>' : '') + btn(paginas, String(paginas));
  pager.innerHTML = `
    <span class="tms-pager-info">Mostrando <strong>${desde}–${hasta}</strong> de <strong>${total}</strong> registros</span>
    <span class="tms-pager-botones">
      ${btn(st.pagina - 1, '‹ Anterior', st.pagina === 1 ? 'disabled' : '')}
      ${numeros}
      ${btn(st.pagina + 1, 'Siguiente ›', st.pagina === paginas ? 'disabled' : '')}
    </span>
    <label class="tms-pager-tamano">Por página
      <select data-pag-tamano>${TAMANOS.map(t => `<option value="${t}" ${t === st.tamano ? 'selected' : ''}>${t}</option>`).join('')}</select>
    </label>`;
}

function procesarTabla(table) {
  const tbody = table.tBodies[0];
  if (!tbody) return;
  const actuales = [...tbody.children];
  let st = estados.get(tbody);
  const mismasFilas = st && st.filas.size === actuales.length && actuales.every(tr => st.filas.has(tr));
  if (!st) {
    st = { pagina: 1, tamano: tamanoPreferido, col: null, dir: 'asc', filas: new Set() };
    estados.set(tbody, st);
  }
  if (!mismasFilas) {
    // Datos nuevos (recarga, filtro o búsqueda): volver a la página 1 y mantener el orden elegido.
    st.pagina = 1;
    const th = st.col !== null ? table.tHead?.rows[0]?.cells[st.col] : null;
    if (st.col !== null && (!th || !th.dataset.orden)) st.col = null;
    ordenar(tbody, st);
    st.filas = new Set(tbody.children);
  }
  marcarEncabezados(table);
  render(table);
}

function marcarEncabezados(table) {
  const fila = table.tHead?.rows[0];
  if (!fila) return;
  [...fila.cells].forEach(th => {
    const ordenable = th.textContent.trim() !== '' && !th.querySelector('input,select,button') && !th.classList.contains('no-sort');
    if (ordenable && !th.classList.contains('ordenable')) {
      th.classList.add('ordenable');
      th.title = th.title || 'Clic para ordenar';
    }
  });
}

function procesarTodo() {
  document.querySelectorAll('table.tms-table').forEach(procesarTabla);
}

let pendiente = false;
function programar() {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(() => { pendiente = false; procesarTodo(); });
}

export function iniciarPaginacion() {
  if (window.__vdxPaginacion) return;
  window.__vdxPaginacion = true;

  new MutationObserver(registros => {
    // Ignorar los cambios que hace la propia paginación (el control de páginas).
    const relevante = registros.some(r => {
      if (r.target.closest?.('.tms-pager')) return false;
      const nodos = [...r.addedNodes, ...r.removedNodes];
      return !nodos.length || nodos.some(n => !(n.nodeType === 1 && n.classList.contains('tms-pager')));
    });
    if (relevante) programar();
  }).observe(document.body, { childList: true, subtree: true });

  document.addEventListener('click', e => {
    const b = e.target.closest('.tms-pager button[data-pag]');
    if (b && !b.disabled) {
      const table = b.closest('.tms-pager')._table;
      estados.get(table.tBodies[0]).pagina = Number(b.dataset.pag);
      render(table);
      contenedorDe(table).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    const th = e.target.closest('table.tms-table thead th.ordenable');
    if (th && !e.target.closest('input,select,button,a')) {
      const table = th.closest('table');
      const tbody = table.tBodies[0];
      const st = estados.get(tbody);
      if (!st) return;
      const col = th.cellIndex;
      st.dir = st.col === col && st.dir === 'asc' ? 'desc' : 'asc';
      st.col = col;
      [...th.parentElement.cells].forEach(c => { if (c !== th) delete c.dataset.orden; });
      th.dataset.orden = st.dir;
      ordenar(tbody, st);
      st.filas = new Set(tbody.children);
      st.pagina = 1;
      render(table);
    }
  });

  document.addEventListener('change', e => {
    const sel = e.target.closest('.tms-pager select[data-pag-tamano]');
    if (!sel) return;
    const table = sel.closest('.tms-pager')._table;
    const st = estados.get(table.tBodies[0]);
    st.tamano = tamanoPreferido = Number(sel.value);
    try { localStorage.setItem('vdx-pag-tamano', String(tamanoPreferido)); } catch { /* sin almacenamiento */ }
    st.pagina = 1;
    render(table);
  });

  procesarTodo();
}

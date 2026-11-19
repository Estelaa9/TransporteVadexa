// frontend/js/modules/analisis.js - Análisis integral de indicadores de gestión (Mejora 3).
// Compara el período con el anterior, clasifica los resultados con reglas configurables (positivo / negativo / crítico)
// y genera un reporte imprimible. El diagnóstico se basa en reglas explícitas, no en inteligencia artificial.
import { api, fmt, showToast, esc, hoyISO, downloadCsv } from '../api.js';
import { auth } from './auth.js';

const PRIORIDAD = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' };
const OPERADORES = ['>', '>=', '<', '<=', '='];

function valor(v, unidad) {
  if (v === null || v === undefined) return '—';
  if (unidad === 'S/') return fmt.moneda(v);
  if (unidad === '%') return `${fmt.numero(v, 2)} %`;
  if (unidad === 'días') return `${fmt.numero(v, 1)} días`;
  return fmt.numero(v, 0);
}

export async function renderAnalisis(container) {
  const d = new Date();
  const desde = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  const puedeEditar = auth.can('analisis', 'editar');
  const puedeExportar = auth.can('analisis', 'exportar');
  let reporte = null, reglas = [], indicadoresCat = [];

  container.innerHTML = `
    <div class="page-title-box"><div class="page-title-main"><i class="bi bi-clipboard-data text-primary"></i> Análisis integral de gestión
      <span class="page-title-sub">Indicadores operativos y financieros comparados, diagnóstico por reglas y recomendaciones</span></div></div>
    <div class="tabs-tms no-print" role="tablist">
      <button role="tab" aria-selected="true" data-tab="rep">Reporte</button>
      <button role="tab" aria-selected="false" data-tab="reg">Reglas del diagnóstico</button>
    </div>
    <section id="tab-rep">
      <form id="an-form" class="gestion-grid no-print">
        <label>Desde<input type="date" name="desde" class="form-control-tms" value="${desde}" required></label>
        <label>Hasta<input type="date" name="hasta" class="form-control-tms" value="${hoyISO()}" required></label>
        <button class="btn-tms btn-tms-primary" id="an-run"><i class="bi bi-play-fill"></i> Generar análisis</button>
        <button type="button" class="btn-tms btn-tms-default" id="an-print"><i class="bi bi-printer"></i> Imprimir / PDF</button>
        ${puedeExportar ? '<button type="button" class="btn-tms btn-tms-default" id="an-csv"><i class="bi bi-download"></i> CSV</button>' : ''}
      </form>
      <div id="an-out"><p class="muted">Seleccione el período y genere el análisis.</p></div>
    </section>
    <section id="tab-reg" hidden>
      <p>Cada regla tiene una <strong>condición</strong> sobre un indicador, una <strong>prioridad</strong> y una <strong>recomendación</strong>.
        Las reglas positivas señalan fortalezas; las negativas con prioridad crítica se muestran como puntos críticos.</p>
      ${puedeEditar ? '<button class="btn-tms btn-tms-primary" id="rg-new"><i class="bi bi-plus"></i> Nueva regla</button>' : ''}
      <div class="tms-table-container" style="margin-top:12px"><table class="tms-table"><thead><tr><th>Regla</th><th>Condición</th><th>Tipo</th><th>Prioridad</th><th>Recomendación</th><th>Activa</th><th></th></tr></thead><tbody id="rg-body"></tbody></table></div>
    </section>
    <dialog id="rg-dialog" class="facturas-dialog wide"><form id="rg-form">
      <h3>Regla del diagnóstico</h3><input type="hidden" name="id">
      <label>Nombre<input name="nombre" class="form-control-tms" required maxlength="120"></label>
      <div class="gestion-grid">
        <label>Indicador<select name="indicador" class="form-control-tms"></select></label>
        <label>Operador<select name="operador" class="form-control-tms">${OPERADORES.map(o => `<option>${esc(o)}</option>`).join('')}</select></label>
        <label>Umbral<input name="umbral" type="number" step="0.01" class="form-control-tms" required></label>
        <label>Tipo<select name="tipo" class="form-control-tms"><option value="negativo">Negativo</option><option value="positivo">Positivo</option></select></label>
        <label>Prioridad<select name="prioridad" class="form-control-tms">${Object.entries(PRIORIDAD).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
        <label><input type="checkbox" name="activo" value="1"> Activa</label>
      </div>
      <label>Recomendación<textarea name="recomendacion" class="form-control-tms" required maxlength="500"></textarea></label>
      <p id="rg-error" role="alert" class="text-danger"></p>
      <div class="toolbar-group-left"><button type="button" class="btn-tms btn-tms-default" data-close>Cancelar</button><button class="btn-tms btn-tms-primary">Guardar</button></div>
    </form></dialog>`;

  const $ = s => container.querySelector(s);
  container.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
  container.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    container.querySelectorAll('[data-tab]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    $('#tab-rep').hidden = b.dataset.tab !== 'rep';
    $('#tab-reg').hidden = b.dataset.tab !== 'reg';
    if (b.dataset.tab === 'reg') cargarReglas();
  });

  const hallazgo = h => `<li>${h.prioridad !== 'baja' || h.tipo ? `<span class="facturas-status fac-prio-${esc(h.prioridad)}">${esc(PRIORIDAD[h.prioridad])}</span> ` : ''}
    <strong>${esc(h.nombre)}</strong>: ${esc(h.etiqueta)} = ${esc(valor(h.valor, h.unidad))} (condición ${esc(h.condicion)}).<br>
    <span class="muted">Recomendación:</span> ${esc(h.recomendacion)}</li>`;

  function render() {
    const r = reporte;
    const grupos = {};
    r.indicadores.forEach(i => (grupos[i.grupo] = grupos[i.grupo] || []).push(i));
    const h = r.hallazgos;
    $('#an-out').innerHTML = `
      <div class="alert-tms info"><strong>Período:</strong> ${esc(fmt.fecha(r.periodo.desde))} – ${esc(fmt.fecha(r.periodo.hasta))} (${esc(r.periodo.dias)} días) ·
        comparado con ${esc(fmt.fecha(r.periodo_anterior.desde))} – ${esc(fmt.fecha(r.periodo_anterior.hasta))} ·
        generado ${esc(r.generado_en)} en ${esc(r.tiempo_ms)} ms. Montos sin IGV salvo indicación.</div>
      <div class="analisis-grid">
        <div class="analisis-card critico"><h3><i class="bi bi-exclamation-octagon"></i> Puntos críticos (${h.critico.length})</h3><ul>${h.critico.map(hallazgo).join('') || '<li>Ninguno.</li>'}</ul></div>
        <div class="analisis-card negativo"><h3><i class="bi bi-exclamation-triangle"></i> Aspectos negativos (${h.negativo.length})</h3><ul>${h.negativo.map(hallazgo).join('') || '<li>Ninguno.</li>'}</ul></div>
        <div class="analisis-card positivo"><h3><i class="bi bi-check2-circle"></i> Aspectos positivos (${h.positivo.length})</h3><ul>${h.positivo.map(hallazgo).join('') || '<li>Ninguno.</li>'}</ul></div>
      </div>
      ${Object.entries(grupos).map(([g, lista]) => `<h3 style="margin-top:20px">${esc(g)}</h3>
        <div class="tms-table-container"><table class="tms-table"><thead><tr><th>Indicador</th><th>Período</th><th>Anterior</th><th>Variación</th></tr></thead><tbody>
        ${lista.map(i => `<tr><td>${esc(i.etiqueta)}</td><td><strong>${esc(valor(i.valor, i.unidad))}</strong></td><td>${esc(valor(i.anterior, i.unidad))}</td>
          <td class="${i.tendencia ? 'tend-' + esc(i.tendencia) : ''}">${i.variacion_pct === null ? '—' : `${i.variacion_pct > 0 ? '▲' : '▼'} ${esc(fmt.numero(Math.abs(i.variacion_pct), 1))} %`}</td></tr>`).join('')}
        </tbody></table></div>`).join('')}
      <div class="analisis-grid">
        <div class="analisis-card"><h3>Clientes con más ingresos</h3><ul>${r.detalle.top_clientes.map(c => `<li>${esc(c.cliente)}: ${fmt.moneda(c.ingresos)} (${esc(c.servicios)} servicios)</li>`).join('') || '<li>Sin servicios finalizados.</li>'}</ul></div>
        <div class="analisis-card"><h3>Mayores deudores</h3><ul>${r.detalle.deudores.map(c => `<li>${esc(c.cliente)}: saldo ${fmt.moneda(c.saldo)}, vencido ${fmt.moneda(c.vencido)}</li>`).join('') || '<li>Sin saldos pendientes.</li>'}</ul></div>
        <div class="analisis-card"><h3>Vehículos sin servicios</h3><ul>${r.detalle.vehiculos_ociosos.slice(0, 15).map(v => `<li>${esc(v.placa)} ${esc(v.modelo || '')}</li>`).join('') || '<li>Todas las unidades activas trabajaron.</li>'}</ul></div>
        <div class="analisis-card"><h3>Documentos vencidos o por vencer</h3><ul>${r.detalle.documentos.slice(0, 15).map(x => `<li>${esc(x.documento)} · ${esc(x.titular)} · ${esc(fmt.fecha(x.vence))}</li>`).join('') || '<li>Sin vencimientos próximos.</li>'}</ul></div>
      </div>`;
  }

  async function generar() {
    $('#an-run').disabled = true;
    try {
      reporte = (await api.get('analisis/index.php', Object.fromEntries(new FormData($('#an-form'))))).data;
      render();
    } catch (e) { showToast(e.message, 'error'); } finally { $('#an-run').disabled = false; }
  }

  async function cargarReglas() {
    try {
      const r = await api.get('analisis/reglas.php');
      reglas = r.data; indicadoresCat = r.indicadores;
      const etiqueta = k => indicadoresCat.find(i => i.clave === k)?.etiqueta || k;
      $('#rg-body').innerHTML = reglas.map(g => `<tr><td><strong>${esc(g.nombre)}</strong><br><small>${esc(g.codigo)}</small></td>
        <td>${esc(etiqueta(g.indicador))} ${esc(g.operador)} ${esc(Number(g.umbral))}</td><td>${esc(g.tipo)}</td>
        <td><span class="facturas-status fac-prio-${esc(g.prioridad)}">${esc(PRIORIDAD[g.prioridad])}</span></td><td>${esc(g.recomendacion)}</td>
        <td>${Number(g.activo) ? 'Sí' : 'No'}</td><td>${puedeEditar ? `<button class="btn-tms btn-tms-default" data-edit="${esc(g.id)}">Editar</button>` : ''}</td></tr>`).join('');
      $('#rg-form').elements.indicador.innerHTML = indicadoresCat.map(i => `<option value="${esc(i.clave)}">${esc(i.etiqueta)} (${esc(i.unidad)})</option>`).join('');
    } catch (e) { showToast(e.message, 'error'); }
  }

  function abrirRegla(g) {
    const f = $('#rg-form');
    f.reset();
    f.elements.id.value = g?.id || '';
    ['nombre', 'indicador', 'operador', 'umbral', 'tipo', 'prioridad', 'recomendacion'].forEach(k => { if (g) f.elements[k].value = g[k]; });
    f.elements.activo.checked = g ? Number(g.activo) === 1 : true;
    $('#rg-error').textContent = '';
    $('#rg-dialog').showModal();
  }
  $('#rg-new')?.addEventListener('click', () => abrirRegla(null));
  $('#rg-body').onclick = e => { const b = e.target.closest('[data-edit]'); if (b) abrirRegla(reglas.find(g => String(g.id) === b.dataset.edit)); };
  $('#rg-form').onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    data.activo = e.currentTarget.elements.activo.checked ? 1 : 0;
    try { await api.post('analisis/reglas.php', data); $('#rg-dialog').close(); showToast('Regla guardada.'); await cargarReglas(); }
    catch (err) { $('#rg-error').textContent = err.message; }
  };

  $('#an-form').onsubmit = e => { e.preventDefault(); generar(); };
  $('#an-print').onclick = () => window.print();
  $('#an-csv')?.addEventListener('click', () => {
    if (!reporte) return showToast('Genere primero el análisis.', 'warning');
    const filas = [['Grupo', 'Indicador', 'Unidad', 'Período', 'Anterior', 'Variación %']];
    reporte.indicadores.forEach(i => filas.push([i.grupo, i.etiqueta, i.unidad, i.valor, i.anterior, i.variacion_pct]));
    filas.push([], ['Clasificación', 'Regla', 'Prioridad', 'Indicador', 'Valor', 'Condición', 'Recomendación']);
    [['Crítico', 'critico'], ['Negativo', 'negativo'], ['Positivo', 'positivo']].forEach(([l, k]) =>
      reporte.hallazgos[k].forEach(h => filas.push([l, h.nombre, PRIORIDAD[h.prioridad], h.etiqueta, h.valor, h.condicion, h.recomendacion])));
    downloadCsv(filas, `analisis_${reporte.periodo.desde}_${reporte.periodo.hasta}.csv`);
  });

  await generar();
}

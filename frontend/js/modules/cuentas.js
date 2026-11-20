// frontend/js/modules/cuentas.js - Cuentas por cobrar (Mejora 2): pagos parciales y totales, saldos, vencimientos,
// antigüedad de la deuda, alertas de cobranza e indicadores (periodo promedio de cobro, % vencido, monto vencido).
import { api, fmt, showToast, esc, hoyISO, isoLocal, downloadCsv } from '../api.js';
import { auth } from './auth.js';

const SITUACION = { por_vencer: 'Por vencer', proxima: 'Próxima a vencer', vencida: 'Vencida' };
const PAGO = { pendiente: 'Pendiente', parcial: 'Pagada parcialmente', pagada: 'Pagada' };
const badge = (c, t) => `<span class="facturas-status fac-${esc(c)}">${esc(t)}</span>`;

export async function renderCuentas(container) {
  let data = { data: [], por_cliente: [], alertas: [], pagos: [], resumen: {} };
  let selected = null;
  const puedePagar = auth.can('cuentas', 'crear');
  const puedeAnular = auth.can('cuentas', 'anular');
  const puedeExportar = auth.can('cuentas', 'exportar');
  const hace90 = (() => { const d = new Date(); d.setDate(d.getDate() - 89); return isoLocal(d); })();

  container.innerHTML = `
    <div class="page-title-box"><div class="page-title-main"><i class="bi bi-wallet2 text-primary"></i> Cuentas por cobrar
      <span class="page-title-sub">Saldos por comprobante, vencimientos y alertas de cobranza</span></div>
      <a href="#facturas" class="btn-tms btn-tms-default">Facturación</a></div>
    <form id="cc-periodo" class="gestion-grid">
      <label>Indicadores desde<input type="date" name="desde" class="form-control-tms" value="${hace90}"></label>
      <label>hasta<input type="date" name="hasta" class="form-control-tms" value="${hoyISO()}"></label>
      <button class="btn-tms btn-tms-primary">Actualizar</button>
    </form>
    <div id="cc-summary" class="facturas-summary"></div>
    <div class="analisis-grid">
      <div class="analisis-card"><h3>Antigüedad de la deuda</h3><div id="cc-aging" class="gestion-chart" style="border:0;padding:0;margin:0"></div></div>
      <div class="analisis-card critico"><h3>Alertas de cobranza</h3><ul id="cc-alertas"></ul></div>
    </div>
    <div class="tabs-tms" role="tablist">
      <button role="tab" aria-selected="true" data-tab="docs">Comprobantes</button>
      <button role="tab" aria-selected="false" data-tab="clientes">Por cliente</button>
      <button role="tab" aria-selected="false" data-tab="pagos">Pagos del período</button>
    </div>
    <section id="tab-docs">
      <div class="gestion-grid">
        <label>Buscar<input id="cc-search" class="form-control-tms" placeholder="Cliente, RUC o comprobante"></label>
        <label>Mostrar<select id="cc-status" class="form-control-tms"><option value="saldo">Con saldo</option><option value="vencida">Vencidas</option><option value="proxima">Próximas a vencer</option><option value="todos">Todos</option></select></label>
        ${puedeExportar ? '<button id="cc-export" type="button" class="btn-tms btn-tms-default"><i class="bi bi-download"></i> CSV</button>' : ''}
      </div>
      <div class="tms-table-container"><table class="tms-table"><thead><tr><th>Comprobante</th><th>Cliente</th><th>Emisión</th><th>Vence</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Situación</th><th>Acción</th></tr></thead><tbody id="cc-body"></tbody></table></div>
    </section>
    <section id="tab-clientes" hidden><div class="tms-table-container"><table class="tms-table"><thead><tr><th>Cliente</th><th>Documento</th><th>Comprobantes</th><th>Saldo</th><th>Vencido</th><th>Máx. días vencido</th></tr></thead><tbody id="cc-clientes"></tbody></table></div></section>
    <section id="tab-pagos" hidden><div class="tms-table-container"><table class="tms-table"><thead><tr><th>Fecha</th><th>Comprobante</th><th>Cliente</th><th>Medio</th><th>Referencia</th><th>Importe</th><th>Estado</th><th>Registró</th><th></th></tr></thead><tbody id="cc-pagos"></tbody></table></div></section>

    <dialog id="cc-dialog" class="facturas-dialog"><form id="cc-form">
      <h3>Registrar pago</h3><p id="cc-selected"></p>
      <label>Fecha<input name="fecha" type="date" class="form-control-tms" required></label>
      <label>Importe S/<input name="monto" type="number" class="form-control-tms" required min="0.01" step="0.01"></label>
      <label>Medio<select name="medio" class="form-control-tms"></select></label>
      <label>Referencia / N.° de operación<input name="referencia" class="form-control-tms" maxlength="255"></label>
      <p id="cc-form-error" role="alert" class="text-danger"></p>
      <div class="toolbar-group-left"><button type="button" class="btn-tms btn-tms-default" data-close>Cancelar</button><button id="cc-save" class="btn-tms btn-tms-primary">Guardar pago</button></div>
    </form></dialog>`;

  const $ = s => container.querySelector(s);
  const form = $('#cc-form');
  container.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
  container.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    container.querySelectorAll('[data-tab]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    ['docs', 'clientes', 'pagos'].forEach(t => { $('#tab-' + t).hidden = b.dataset.tab !== t; });
  });

  const filtrados = () => {
    const q = $('#cc-search').value.trim().toLocaleLowerCase('es');
    const st = $('#cc-status').value;
    return data.data.filter(d => (!q || [d.cliente, d.documento, d.numero_completo].some(v => String(v ?? '').toLocaleLowerCase('es').includes(q))) &&
      (st === 'todos' || (st === 'saldo' ? Number(d.saldo) > 0 : d.situacion === st)));
  };

  function render() {
    const r = data.resumen;
    $('#cc-summary').innerHTML = [
      ['Saldo por cobrar', fmt.moneda(r.saldo)], ['Saldo vencido', fmt.moneda(r.vencido)], ['% del saldo vencido', `${fmt.numero(r.pct_vencido, 2)} %`],
      ['Comprobantes vencidos', `${r.documentos_vencidos ?? 0} de ${r.documentos ?? 0} (${fmt.numero(r.pct_documentos_vencidos, 1)} %)`],
      ['Periodo promedio de cobro', r.ppc_dias === null || r.ppc_dias === undefined ? 'Sin cobros completos' : `${fmt.numero(r.ppc_dias, 1)} días`],
      ['Cobrado en el período', fmt.moneda(r.cobrado_periodo)],
    ].map(([l, v]) => `<div><span>${l}</span><strong>${v}</strong></div>`).join('');
    const ag = r.antiguedad || {};
    const etiquetas = { por_vencer: 'Por vencer', '1_30': '1–30 días', '31_60': '31–60 días', '61_90': '61–90 días', mas_90: 'Más de 90 días' };
    const max = Math.max(1, ...Object.values(ag).map(Number));
    $('#cc-aging').innerHTML = Object.entries(etiquetas).map(([k, l]) =>
      `<div><span>${l}</span><meter min="0" max="${max}" value="${Number(ag[k] || 0)}" class="${k === 'por_vencer' ? 'ingreso' : 'gasto'}"></meter><strong>${fmt.moneda(ag[k])}</strong></div>`).join('');
    $('#cc-alertas').innerHTML = data.alertas.slice(0, 12).map(a => `<li>${badge('prio-' + a.prioridad, a.prioridad)} ${esc(a.texto)}</li>`).join('') || '<li>Sin alertas de cobranza.</li>';

    $('#cc-body').innerHTML = filtrados().map(d => `<tr>
      <td><strong>${esc(d.numero_completo)}</strong><br><small>${esc(d.tipo)}</small></td><td>${esc(d.cliente)}<br><small>${esc(d.documento)}</small></td>
      <td>${esc(fmt.fecha(d.fecha_emision))}</td><td>${esc(fmt.fecha(d.fecha_vencimiento))}${d.situacion === 'vencida' ? `<br><small>${esc(d.dias_vencido)} días</small>` : ''}</td>
      <td>${fmt.moneda(d.total)}</td><td>${fmt.moneda(d.pagado)}</td><td><strong>${fmt.moneda(d.saldo)}</strong></td>
      <td>${badge(d.estado_pago, PAGO[d.estado_pago] || d.estado_pago)}${d.situacion ? '<br>' + badge(d.situacion, SITUACION[d.situacion]) : ''}</td>
      <td>${puedePagar && Number(d.saldo) > 0 ? `<button class="btn-tms btn-tms-primary" data-pagar="${esc(d.id)}">Registrar pago</button>` : ''}</td></tr>`).join('')
      || '<tr><td colspan="9" style="text-align:center;padding:24px">No hay comprobantes para estos filtros.</td></tr>';
    $('#cc-clientes').innerHTML = data.por_cliente.map(c => `<tr><td>${esc(c.cliente)}</td><td>${esc(c.documento)}</td><td>${esc(c.documentos)}</td>
      <td>${fmt.moneda(c.saldo)}</td><td>${fmt.moneda(c.vencido)}</td><td>${esc(c.max_dias_vencido)}</td></tr>`).join('') || '<tr><td colspan="6">Sin saldos pendientes.</td></tr>';
    $('#cc-pagos').innerHTML = data.pagos.map(p => `<tr><td>${esc(fmt.fecha(p.fecha))}</td><td>${esc(p.comprobante)}</td><td>${esc(p.cliente)}</td><td>${esc(p.medio)}</td>
      <td>${esc(p.referencia)}</td><td>${fmt.moneda(p.monto)}</td><td>${esc(p.estado)}${p.motivo_anulacion ? ': ' + esc(p.motivo_anulacion) : ''}</td><td>${esc(p.registrado_por)}</td>
      <td>${puedeAnular && p.estado === 'registrado' ? `<button class="btn-tms btn-tms-default" data-anular-pago="${esc(p.id)}">Anular</button>` : ''}</td></tr>`).join('')
      || '<tr><td colspan="9">Sin pagos en el período.</td></tr>';
  }

  async function load() {
    try {
      data = await api.get('facturas/cuentas.php', Object.fromEntries(new FormData($('#cc-periodo'))));
      form.elements.medio.innerHTML = (data.medios_pago || []).map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
      render();
    } catch (e) { showToast(e.message, 'error'); }
  }

  $('#cc-periodo').onsubmit = e => { e.preventDefault(); load(); };
  $('#cc-search').oninput = render;
  $('#cc-status').onchange = render;
  $('#cc-body').onclick = e => {
    const b = e.target.closest('[data-pagar]');
    if (!b) return;
    selected = data.data.find(d => String(d.id) === b.dataset.pagar);
    form.reset();
    form.elements.fecha.value = hoyISO();
    form.elements.fecha.max = hoyISO();
    form.elements.fecha.min = selected.fecha_emision;
    form.elements.monto.max = selected.saldo;
    form.elements.monto.value = selected.saldo;
    $('#cc-selected').textContent = `${selected.numero_completo} · ${selected.cliente} · Saldo ${fmt.moneda(selected.saldo)}`;
    $('#cc-form-error').textContent = '';
    $('#cc-dialog').showModal();
  };
  form.onsubmit = async e => {
    e.preventDefault();
    $('#cc-save').disabled = true;
    try {
      const res = await api.post('facturas/pago.php', { ...Object.fromEntries(new FormData(form)), comprobante_id: selected.id });
      $('#cc-dialog').close();
      showToast(res.message || 'Pago registrado.');
      await load();
    } catch (err) { $('#cc-form-error').textContent = err.message; } finally { $('#cc-save').disabled = false; }
  };
  $('#cc-pagos').onclick = async e => {
    const b = e.target.closest('[data-anular-pago]');
    if (!b) return;
    const motivo = prompt('Motivo de la anulación del pago:');
    if (!motivo || motivo.trim().length < 3) return;
    try { await api.post('facturas/anular_pago.php', { id: b.dataset.anularPago, motivo: motivo.trim() }); showToast('Pago anulado.'); await load(); }
    catch (err) { showToast(err.message, 'error'); }
  };
  $('#cc-export')?.addEventListener('click', () => downloadCsv([
    ['Comprobante', 'Cliente', 'Documento', 'Emisión', 'Vencimiento', 'Días vencido', 'Total', 'Pagado', 'Saldo', 'Estado de pago', 'Situación'],
    ...filtrados().map(d => [d.numero_completo, d.cliente, d.documento, d.fecha_emision, d.fecha_vencimiento, d.dias_vencido, d.total, d.pagado, d.saldo, PAGO[d.estado_pago], SITUACION[d.situacion] || ''])
  ], `cuentas_por_cobrar_${hoyISO()}.csv`));

  await load();
}

// frontend/js/modules/facturas.js - Facturación (Mejora 2): comprobantes como entidad propia ligados a servicios,
// emisión de uno o varios servicios finalizados, anulación con nota de crédito y consulta del estado de pago.
import { api, fmt, showToast, esc, hoyISO, downloadCsv } from '../api.js';
import { auth } from './auth.js';

const ESTADO_PAGO = { pendiente: 'Pendiente', parcial: 'Pagada parcialmente', pagada: 'Pagada', no_aplica: '—' };
const SITUACION = { por_vencer: 'Por vencer', proxima: 'Próxima a vencer', vencida: 'Vencida' };
const badge = (clase, texto) => `<span class="facturas-status fac-${esc(clase)}">${esc(texto)}</span>`;

export function filtrarComprobantes(rows, f) {
  const q = (f.buscar || '').trim().toLocaleLowerCase('es');
  return rows.filter(r =>
    (!f.tipo || r.tipo === f.tipo) &&
    (!f.estado || r.estado === f.estado) &&
    (!f.pago || r.estado_pago === f.pago) &&
    (!f.desde || r.fecha_emision >= f.desde) &&
    (!f.hasta || r.fecha_emision <= f.hasta) &&
    (!q || [r.numero_completo, r.cliente, r.documento, r.servicios].some(v => String(v ?? '').toLocaleLowerCase('es').includes(q))));
}

export async function renderFacturas(container) {
  let rows = [], porFacturar = [], series = [], visible = [];
  const puedeEmitir = auth.can('facturas', 'crear');
  const puedeAnular = auth.can('facturas', 'anular');
  const puedeExportar = auth.can('facturas', 'exportar');
  container.innerHTML = `
    <div class="page-title-box"><div class="page-title-main"><i class="bi bi-receipt text-primary"></i> Facturación
      <span class="page-title-sub">Comprobantes ligados a servicios finalizados · notas de crédito · estado de pago</span></div>
      <a href="#cuentas" class="btn-tms btn-tms-default"><i class="bi bi-wallet2"></i> Cuentas por cobrar</a></div>
    <div class="alert-tms info"><strong>Registro de control interno.</strong> La numeración F001/B001 corresponde a los comprobantes que la empresa emite
      en SUNAT o en su proveedor de facturación electrónica. Este módulo no reemplaza la emisión electrónica oficial (GRE / CPE).</div>
    <div class="tabs-tms" role="tablist">
      <button role="tab" aria-selected="true" data-tab="comp">Comprobantes</button>
      <button role="tab" aria-selected="false" data-tab="pend">Servicios por facturar <span id="fac-pend-count"></span></button>
    </div>
    <section id="tab-comp">
      <form id="fac-filters" class="gestion-grid">
        <label>Buscar<input name="buscar" class="form-control-tms" placeholder="Número, cliente, RUC o servicio"></label>
        <label>Tipo<select name="tipo" class="form-control-tms"><option value="">Todos</option><option value="FACTURA">Facturas</option><option value="BOLETA">Boletas</option><option value="NOTA_CREDITO">Notas de crédito</option></select></label>
        <label>Estado<select name="estado" class="form-control-tms"><option value="">Todos</option><option value="emitida">Emitidas</option><option value="anulada">Anuladas</option></select></label>
        <label>Pago<select name="pago" class="form-control-tms"><option value="">Todos</option><option value="pendiente">Pendiente</option><option value="parcial">Parcial</option><option value="pagada">Pagada</option></select></label>
        <label>Emitido desde<input type="date" name="desde" class="form-control-tms"></label>
        <label>Emitido hasta<input type="date" name="hasta" class="form-control-tms"></label>
        <div class="toolbar-group-left"><button type="reset" class="btn-tms btn-tms-default">Limpiar</button>
          ${puedeExportar ? '<button type="button" id="fac-export" class="btn-tms btn-tms-default"><i class="bi bi-download"></i> CSV</button>' : ''}</div>
      </form>
      <div id="fac-summary" class="facturas-summary"></div>
      <div class="tms-table-container"><table class="tms-table"><thead><tr>
        <th>Comprobante</th><th>Emisión / vence</th><th>Cliente</th><th>Servicios</th><th>Base</th><th>IGV</th><th>Total</th><th>Pagado / saldo</th><th>Estado</th><th>Acciones</th>
      </tr></thead><tbody id="fac-body"></tbody></table></div>
    </section>
    <section id="tab-pend" hidden>
      <p>Servicios <strong>finalizados</strong> sin comprobante. Seleccione uno o varios del <strong>mismo cliente</strong> para registrar un comprobante.</p>
      <div class="toolbar-group-left" style="margin-bottom:12px">${puedeEmitir ? '<button id="fac-emitir" class="btn-tms btn-tms-primary" disabled><i class="bi bi-receipt"></i> Registrar comprobante</button>' : ''} <span id="fac-sel-info" class="muted"></span></div>
      <div class="tms-table-container"><table class="tms-table"><thead><tr><th></th><th>Servicio</th><th>Fecha</th><th>Cliente</th><th>Preferencia</th><th>Forma de pago</th><th>Ruta</th><th>Total</th></tr></thead><tbody id="pend-body"></tbody></table></div>
    </section>

    <dialog id="dlg-emitir" class="facturas-dialog wide"><form id="form-emitir">
      <h3>Registrar comprobante</h3><p id="emi-resumen"></p>
      <div class="gestion-grid">
        <label>Tipo<select name="tipo" class="form-control-tms"><option value="FACTURA">Factura</option><option value="BOLETA">Boleta</option></select></label>
        <label>Serie<select name="serie" class="form-control-tms"></select></label>
        <label>Número (opcional)<input name="numero" type="number" min="1" class="form-control-tms" placeholder="Siguiente automático"></label>
        <label>Fecha de emisión<input name="fecha_emision" type="date" class="form-control-tms" required></label>
        <label>Días de crédito<input name="dias_credito" type="number" min="0" max="120" class="form-control-tms"></label>
        <label>Detracción (S/)<input name="monto_detraccion" type="number" min="0" step="0.01" value="0" class="form-control-tms"></label>
      </div>
      <label>Observación<input name="observacion" maxlength="255" class="form-control-tms"></label>
      <p class="muted">Deje el número vacío para usar el siguiente correlativo de la serie. Si ya lo emitió en SUNAT, escriba el mismo número.</p>
      <p id="emi-error" role="alert" class="text-danger"></p>
      <div class="toolbar-group-left"><button type="button" class="btn-tms btn-tms-default" data-close>Cancelar</button><button class="btn-tms btn-tms-primary" id="emi-save">Registrar</button></div>
    </form></dialog>

    <dialog id="dlg-anular" class="facturas-dialog"><form id="form-anular">
      <h3>Anular comprobante</h3><p id="anu-resumen"></p>
      <p class="muted">Se registrará una nota de crédito por el total y el número original se conserva. Los servicios quedarán disponibles para facturarse de nuevo o anularse.</p>
      <label>Motivo<textarea name="motivo" required minlength="5" maxlength="255" class="form-control-tms"></textarea></label>
      <p id="anu-error" role="alert" class="text-danger"></p>
      <div class="toolbar-group-left"><button type="button" class="btn-tms btn-tms-default" data-close>Cancelar</button><button class="btn-tms btn-tms-primary" id="anu-save">Anular con nota de crédito</button></div>
    </form></dialog>

    <dialog id="dlg-detalle" class="facturas-dialog wide"><div id="det-body"></div>
      <div class="toolbar-group-left"><button type="button" class="btn-tms btn-tms-default" data-close>Cerrar</button></div></dialog>`;

  const $ = s => container.querySelector(s);
  const filters = $('#fac-filters');
  let selected = null;
  container.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
  container.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    container.querySelectorAll('[data-tab]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    $('#tab-comp').hidden = b.dataset.tab !== 'comp';
    $('#tab-pend').hidden = b.dataset.tab !== 'pend';
  });

  function render() {
    visible = filtrarComprobantes(rows, Object.fromEntries(new FormData(filters)));
    const vig = visible.filter(r => r.estado === 'emitida' && r.tipo !== 'NOTA_CREDITO');
    const sum = (list, k) => list.reduce((a, r) => a + Number(r[k] || 0), 0);
    $('#fac-summary').innerHTML = [
      ['Comprobantes vigentes', vig.length], ['Total emitido', fmt.moneda(sum(vig, 'total'))], ['Base imponible', fmt.moneda(sum(vig, 'base_imponible'))],
      ['IGV', fmt.moneda(sum(vig, 'igv'))], ['Cobrado', fmt.moneda(sum(vig, 'pagado'))], ['Saldo', fmt.moneda(sum(vig, 'saldo'))],
    ].map(([l, v]) => `<div><span>${l}</span><strong>${v}</strong></div>`).join('');
    $('#fac-body').innerHTML = visible.map(r => {
      const nc = r.tipo === 'NOTA_CREDITO';
      return `<tr>
        <td><strong>${esc(r.numero_completo)}</strong><br><small>${esc(nc ? 'Nota de crédito' : r.tipo)}${r.referencia ? ' de ' + esc(r.referencia) : ''}</small></td>
        <td>${esc(fmt.fecha(r.fecha_emision))}<br><small>vence ${esc(fmt.fecha(r.fecha_vencimiento))}</small></td>
        <td>${esc(r.cliente || '—')}<br><small>${esc(r.documento)}</small></td>
        <td>${esc(String(r.servicios || '').split(',').filter(Boolean).map(x => '#' + x).join(' '))}</td>
        <td>${fmt.moneda(r.base_imponible)}</td><td>${fmt.moneda(r.igv)}</td><td><strong>${fmt.moneda(r.total)}</strong></td>
        <td>${nc ? '—' : `${fmt.moneda(r.pagado)}<br><small>saldo ${fmt.moneda(r.saldo)}</small>`}</td>
        <td>${badge(r.estado === 'anulada' ? 'anulada' : r.estado_pago, r.estado === 'anulada' ? 'Anulada' : ESTADO_PAGO[r.estado_pago])}
          ${r.situacion ? '<br>' + badge(r.situacion, SITUACION[r.situacion]) : ''}${r.nota_credito ? `<br><small>NC ${esc(r.nota_credito)}</small>` : ''}</td>
        <td class="no-export"><button class="btn-tms btn-tms-default" data-ver="${esc(r.id)}">Detalle</button>
          ${puedeAnular && !nc && r.estado === 'emitida' ? `<button class="btn-tms btn-tms-default" data-anular="${esc(r.id)}">Anular</button>` : ''}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="10" style="text-align:center;padding:24px">No hay comprobantes para estos filtros.</td></tr>';
  }

  function renderPendientes() {
    $('#fac-pend-count').textContent = porFacturar.length ? `(${porFacturar.length})` : '';
    $('#pend-body').innerHTML = porFacturar.map(s => `<tr>
      <td>${puedeEmitir ? `<input type="checkbox" data-sel="${esc(s.id)}" aria-label="Seleccionar servicio ${esc(s.id)}">` : ''}</td>
      <td>#${esc(s.id)}</td><td>${esc(fmt.fecha(s.fecha_servicio))}</td><td>${esc(s.cliente)}<br><small>${esc(s.documento)}</small></td>
      <td>${esc(s.tipo_comprobante)}</td><td>${esc(s.forma_pago)}</td><td>${esc(s.origen)} → ${esc(s.destino)}</td><td>${fmt.moneda(s.precio_cliente)}</td></tr>`).join('')
      || '<tr><td colspan="8" style="text-align:center;padding:24px">No hay servicios finalizados pendientes de comprobante.</td></tr>';
    actualizarSeleccion();
  }

  function seleccion() {
    const ids = [...container.querySelectorAll('[data-sel]:checked')].map(c => c.dataset.sel);
    return porFacturar.filter(s => ids.includes(String(s.id)));
  }
  function actualizarSeleccion() {
    const sel = seleccion();
    const clientes = new Set(sel.map(s => s.cliente_id));
    const btn = $('#fac-emitir');
    const total = sel.reduce((a, s) => a + Number(s.precio_cliente), 0);
    $('#fac-sel-info').textContent = sel.length ? `${sel.length} servicio(s) · ${fmt.moneda(total)}${clientes.size > 1 ? ' · deben ser del mismo cliente' : ''}` : '';
    if (btn) btn.disabled = !sel.length || clientes.size > 1;
  }

  async function load() {
    const r = await api.get('facturas/index.php');
    rows = r.data || [];
    porFacturar = r.por_facturar || [];
    series = r.series || [];
    render();
    renderPendientes();
  }

  filters.addEventListener('input', render);
  filters.addEventListener('submit', e => e.preventDefault());
  filters.addEventListener('reset', () => setTimeout(render, 0));
  $('#pend-body').addEventListener('change', actualizarSeleccion);

  const formEmitir = $('#form-emitir');
  const llenarSeries = () => {
    const tipo = formEmitir.elements.tipo.value;
    formEmitir.elements.serie.innerHTML = series.filter(s => s.tipo === tipo).map(s => `<option value="${esc(s.serie)}">${esc(s.serie)} (último ${esc(s.ultimo_numero)})</option>`).join('');
  };
  formEmitir.elements.tipo.onchange = llenarSeries;
  $('#fac-emitir')?.addEventListener('click', () => {
    const sel = seleccion();
    if (!sel.length) return;
    const s0 = sel[0];
    formEmitir.reset();
    formEmitir.elements.tipo.value = /^(10|15|16|17|20)\d{9}$/.test(String(s0.documento || '')) && s0.tipo_comprobante !== 'BOLETA' ? 'FACTURA' : 'BOLETA';
    llenarSeries();
    formEmitir.elements.fecha_emision.value = hoyISO();
    formEmitir.elements.fecha_emision.max = hoyISO();
    const m = /(\d+)/.exec(s0.forma_pago || '');
    formEmitir.elements.dias_credito.value = /cr[eé]dito/i.test(s0.forma_pago || '') && m ? m[1] : (s0.dias_credito || 0);
    const total = sel.reduce((a, s) => a + Number(s.precio_cliente), 0);
    $('#emi-resumen').textContent = `${s0.cliente} · servicios ${sel.map(s => '#' + s.id).join(', ')} · total ${fmt.moneda(total)}`;
    $('#emi-error').textContent = '';
    $('#dlg-emitir').showModal();
  });
  formEmitir.onsubmit = async e => {
    e.preventDefault();
    $('#emi-save').disabled = true;
    try {
      const data = Object.fromEntries(new FormData(formEmitir));
      const res = await api.post('facturas/emitir.php', { ...data, servicio_ids: seleccion().map(s => s.id) });
      $('#dlg-emitir').close();
      showToast(res.message || 'Comprobante registrado.');
      await load();
    } catch (err) { $('#emi-error').textContent = err.message; } finally { $('#emi-save').disabled = false; }
  };

  $('#fac-body').addEventListener('click', async e => {
    const anular = e.target.closest('[data-anular]');
    const ver = e.target.closest('[data-ver]');
    if (anular) {
      selected = rows.find(r => String(r.id) === anular.dataset.anular);
      $('#form-anular').reset();
      $('#anu-resumen').textContent = `${selected.numero_completo} · ${selected.cliente} · ${fmt.moneda(selected.total)}`;
      $('#anu-error').textContent = '';
      $('#dlg-anular').showModal();
    }
    if (ver) {
      try {
        const { data: c } = await api.get('facturas/index.php', { id: ver.dataset.ver });
        $('#det-body').innerHTML = `<h3>${esc(c.numero_completo)} <small>${esc(c.tipo)}</small></h3>
          <p>${esc(c.cliente)} · ${esc(c.documento)}<br>Emitido ${esc(fmt.fecha(c.fecha_emision))} · vence ${esc(fmt.fecha(c.fecha_vencimiento))} · ${esc(c.dias_credito)} días de crédito</p>
          ${c.estado === 'anulada' ? `<div class="alert-tms warning">Anulado el ${esc(fmt.fecha(c.fecha_anulacion))}: ${esc(c.motivo_anulacion)} ${c.nota_credito ? '· NC ' + esc(c.nota_credito) : ''}</div>` : ''}
          <table class="tms-table"><thead><tr><th>Servicio</th><th>Fecha</th><th>Ruta</th><th>Base</th><th>IGV</th><th>Total</th></tr></thead><tbody>
          ${c.detalle.map(d => `<tr><td>#${esc(d.servicio_id)}</td><td>${esc(fmt.fecha(d.fecha_servicio))}</td><td>${esc(d.origen)} → ${esc(d.destino)}</td><td>${fmt.moneda(d.base_imponible)}</td><td>${fmt.moneda(d.igv)}</td><td>${fmt.moneda(d.total)}</td></tr>`).join('')}
          </tbody></table>
          <h4 style="margin-top:16px">Pagos</h4>
          <table class="tms-table"><thead><tr><th>Fecha</th><th>Medio</th><th>Referencia</th><th>Importe</th><th>Estado</th><th>Registró</th></tr></thead><tbody>
          ${c.pagos.map(p => `<tr><td>${esc(fmt.fecha(p.fecha))}</td><td>${esc(p.medio)}</td><td>${esc(p.referencia)}</td><td>${fmt.moneda(p.monto)}</td><td>${esc(p.estado)}${p.motivo_anulacion ? ': ' + esc(p.motivo_anulacion) : ''}</td><td>${esc(p.registrado_por)}</td></tr>`).join('') || '<tr><td colspan="6">Sin pagos.</td></tr>'}
          </tbody></table>
          <p><strong>Total ${fmt.moneda(c.total)} · Pagado ${fmt.moneda(c.pagado)} · Saldo ${fmt.moneda(c.saldo)}</strong></p>`;
        $('#dlg-detalle').showModal();
      } catch (err) { showToast(err.message, 'error'); }
    }
  });
  $('#form-anular').onsubmit = async e => {
    e.preventDefault();
    $('#anu-save').disabled = true;
    try {
      const res = await api.post('facturas/anular.php', { id: selected.id, motivo: $('#form-anular').elements.motivo.value });
      $('#dlg-anular').close();
      showToast(res.message);
      await load();
    } catch (err) { $('#anu-error').textContent = err.message; } finally { $('#anu-save').disabled = false; }
  };

  $('#fac-export')?.addEventListener('click', () => {
    downloadCsv([
      ['Comprobante', 'Tipo', 'Referencia', 'Emisión', 'Vencimiento', 'Cliente', 'Documento', 'Servicios', 'Base', 'IGV', 'Total', 'Pagado', 'Saldo', 'Estado', 'Pago', 'Situación'],
      ...visible.map(r => [r.numero_completo, r.tipo, r.referencia, r.fecha_emision, r.fecha_vencimiento, r.cliente, r.documento, r.servicios,
        r.base_imponible, r.igv, r.total, r.pagado, r.saldo, r.estado, ESTADO_PAGO[r.estado_pago], SITUACION[r.situacion] || ''])
    ], `comprobantes_${hoyISO()}.csv`);
  });

  await load();
}

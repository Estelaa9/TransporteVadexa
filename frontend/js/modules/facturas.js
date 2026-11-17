import { api, fmt, showToast } from '../api.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const labels = { pagada: 'Pagada', parcial: 'Pago parcial', por_pagar: 'Por pagar / cobrar', sin_registrar: 'Sin registrar' };
const emitida = row => Boolean(String(row.numero_factura || '').trim());
const centimos = value => Math.round((Number(value) || 0) * 100);

export function resumirFacturas(rows) {
  const issued = rows.filter(emitida);
  const sum = (list, value) => list.reduce((total, row) => total + centimos(value(row)), 0);
  return {
    servicios: rows.length,
    emitidas: issued.length,
    totalEmitido: sum(issued, row => row.precio_cliente),
    cobrado: sum(issued, row => Number(row.precio_cliente) - Number(row.saldo)),
    saldo: sum(issued, row => row.saldo),
    pendientesEmision: rows.length - issued.length,
    totalPendienteEmision: sum(rows.filter(row => !emitida(row)), row => row.precio_cliente)
  };
}

export function filtrarFacturas(rows, filters) {
  const query = (filters.buscar || '').trim().toLocaleLowerCase('es');
  return rows.filter(row =>
    (!filters.tipo || row.tipo_comprobante === filters.tipo) &&
    (!filters.emision || (filters.emision === 'emitida' ? emitida(row) : !emitida(row))) &&
    (!filters.pago || row.estado_pago === filters.pago) &&
    (!filters.desde || row.fecha_servicio >= filters.desde) &&
    (!filters.hasta || row.fecha_servicio <= filters.hasta) &&
    (!filters.emisionDesde || (row.fecha_emision && row.fecha_emision >= filters.emisionDesde)) &&
    (!filters.emisionHasta || (row.fecha_emision && row.fecha_emision <= filters.emisionHasta)) &&
    (!query || [row.numero_factura, row.cliente, row.documento, row.id].some(value =>
      String(value ?? '').toLocaleLowerCase('es').includes(query)))
  );
}

export async function renderFacturas(container) {
  let rows = [], visible = [], csrf = '', gestionCsrf = '', selected = null;
  container.innerHTML = `
    <div class="page-title-box"><div class="page-title-main"><i class="bi bi-receipt text-primary"></i> Facturas
      <span class="page-title-sub">Comprobantes de servicios y control de cobros a clientes</span></div></div>
    <p>Emitida indica que el comprobante tiene número registrado. El estado de pago se registra por separado.</p>
    <div class="tms-toolbar"><div class="toolbar-group-left">
      <button id="fac-refresh" class="btn-tms btn-tms-default"><i class="bi bi-arrow-clockwise"></i> Actualizar</button>
      <button id="fac-export" class="btn-tms btn-tms-default" disabled><i class="bi bi-download"></i> Exportar CSV</button>
    </div></div>
    <form id="fac-filters" class="form-grid" style="margin-bottom:16px">
      <label class="col-4 form-group">Buscar<input name="buscar" class="form-control-tms" placeholder="Número, cliente, documento o servicio"></label>
      <label class="col-2 form-group">Comprobante<select name="tipo" class="form-control-tms"><option value="">Todos</option><option value="FACTURA">Facturas</option><option value="BOLETA">Boletas</option><option value="SIN_COMPROBANTE">Sin comprobante</option></select></label>
      <label class="col-3 form-group">Emisión<select name="emision" class="form-control-tms"><option value="">Todas</option><option value="emitida">Emitidas</option><option value="pendiente">Por emitir</option></select></label>
      <label class="col-3 form-group">Pago<select name="pago" class="form-control-tms"><option value="">Todos</option><option value="pagada">Pagadas</option><option value="por_pagar">Por pagar / cobrar</option><option value="sin_registrar">Sin registrar</option></select></label>
      <label class="col-3 form-group">Servicio desde<input type="date" name="desde" class="form-control-tms"></label>
      <label class="col-3 form-group">Servicio hasta<input type="date" name="hasta" class="form-control-tms"></label>
      <label class="col-3 form-group">Emisión desde<input type="date" name="emisionDesde" class="form-control-tms"></label>
      <label class="col-3 form-group">Emisión hasta<input type="date" name="emisionHasta" class="form-control-tms"></label>
      <div class="col-3 form-group"><button type="reset" class="btn-tms btn-tms-default">Limpiar filtros</button></div>
    </form>
    <div id="fac-message" role="status" aria-live="polite"></div>
    <div id="fac-summary" class="facturas-summary" aria-live="polite"></div>
    <div class="tms-table-container"><table class="tms-table"><thead><tr>
      <th>Comprobante</th><th>Fecha del servicio</th><th>Fecha de emisión</th><th>Cliente / documento</th><th>Servicio</th><th>Base</th><th>IGV</th><th>Total</th><th>Emisión</th><th>Pago</th><th>Fecha de pago</th><th>Acciones</th>
    </tr></thead><tbody id="fac-body"></tbody></table></div>
    <dialog id="fac-issue-dialog" class="facturas-dialog"><form id="fac-issue"><h3>Registrar comprobante del servicio</h3><p>Ingrese los datos del comprobante emitido en su sistema de facturación. Este registro no realiza emisión electrónica.</p><label>Tipo<select name="tipo_comprobante" class="form-control-tms"><option value="FACTURA">Factura</option><option value="BOLETA">Boleta</option></select></label><label>Número<input name="numero_factura" class="form-control-tms" required pattern="[FBfb][A-Za-z0-9]{3}-[0-9]{1,8}" placeholder="F001-000001"></label><label>Fecha de emisión<input name="fecha_emision" type="date" class="form-control-tms" required></label><p id="fac-issue-error" role="alert"></p><button class="btn-tms btn-tms-primary" id="fac-issue-save">Registrar</button><button type="button" id="fac-issue-close" class="btn-tms btn-tms-default">Cancelar</button></form></dialog>
    <dialog id="fac-dialog" class="facturas-dialog" aria-labelledby="fac-title">
      <form id="fac-payment"><h3 id="fac-title">Registrar estado de pago</h3><p id="fac-selected"></p>
        <label class="form-group">Estado<select name="estado_pago" class="form-control-tms"><option value="por_pagar">Por pagar / cobrar</option><option value="pagada">Pagada</option></select></label>
        <label class="form-group">Fecha de pago<input name="fecha_pago" type="date" class="form-control-tms"></label>
        <p id="fac-payment-error" role="alert" class="text-danger"></p>
        <div class="toolbar-group-left"><button type="button" id="fac-cancel" class="btn-tms btn-tms-default">Cancelar</button><button id="fac-save" class="btn-tms btn-tms-primary">Guardar</button></div>
      </form>
    </dialog>`;
  const find = selector => container.querySelector(selector);
  const filters = find('#fac-filters');
  filters.elements.pago.add(new Option('Pago parcial', 'parcial'));
  const body = find('#fac-body');
  const issueForm = find('#fac-issue');
  const message = find('#fac-message');
  const dialog = find('#fac-dialog');
  const payment = find('#fac-payment');
  find('#fac-issue-error').insertAdjacentHTML('beforebegin', '<label>Detracción registrada (S/)<input name="monto_detraccion" type="number" class="form-control-tms" min="0" step="0.01" value="0"></label>');
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  issueForm.elements.fecha_emision.max = localDate;
  payment.elements.fecha_pago.max = localDate;

  function render() {
    const values = Object.fromEntries(new FormData(filters));
    const invalid = values.desde && values.hasta && values.desde > values.hasta;
    visible = invalid ? [] : filtrarFacturas(rows, values);
    message.textContent = invalid ? 'La fecha desde no puede ser posterior a la fecha hasta.' : '';
    const summary = resumirFacturas(visible);
    find('#fac-summary').innerHTML = [
      ['Servicios filtrados', summary.servicios],
      ['Comprobantes emitidos', summary.emitidas],
      ['Total emitido', fmt.moneda(summary.totalEmitido / 100)],
      ['Cobrado de emitidos', fmt.moneda(summary.cobrado / 100)],
      ['Saldo por cobrar', fmt.moneda(summary.saldo / 100)],
      ['Por emitir', `${summary.pendientesEmision} · ${fmt.moneda(summary.totalPendienteEmision / 100)}`]
    ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');
    body.innerHTML = visible.length ? visible.map(row => `<tr>
      <td>${escapeHtml(row.numero_factura || 'Sin número')}<br><small>${escapeHtml(row.tipo_comprobante)}</small></td>
      <td>${escapeHtml(fmt.fecha(row.fecha_servicio))}</td><td>${escapeHtml(fmt.fecha(row.fecha_emision))}</td><td>${escapeHtml(row.cliente || 'Sin cliente')}<br><small>${escapeHtml(row.documento)}</small></td>
      <td>#${escapeHtml(row.id)}<br>${escapeHtml(row.origen)} → ${escapeHtml(row.destino)}<br><small>${escapeHtml(row.estado_servicio)}</small></td>
      <td>${fmt.moneda(row.base_imponible)}</td><td>${fmt.moneda(row.igv)}</td><td>${fmt.moneda(row.precio_cliente)}<br><small>Detracción: ${fmt.moneda(row.monto_detraccion)}</small></td>
      <td>${emitida(row) ? 'Emitida' : 'Por emitir'}</td><td><span class="facturas-status fac-${escapeHtml(row.estado_pago)}">${escapeHtml(labels[row.estado_pago] || 'Sin registrar')}</span></td>
      <td>${escapeHtml(fmt.fecha(row.fecha_pago))}</td><td>${emitida(row) ? `<button class="btn-tms btn-tms-default" data-id="${escapeHtml(row.id)}">Registrar pago</button>` : `<button class="btn-tms btn-tms-default" data-issue="${escapeHtml(row.id)}">Registrar comprobante</button>`}</td>
    </tr>`).join('') : '<tr><td colspan="12" style="text-align:center;padding:24px">No hay comprobantes para estos filtros.</td></tr>';
    find('#fac-export').disabled = !visible.length;
  }

  async function load() {
    find('#fac-refresh').disabled = true;
    find('#fac-export').disabled = true;
    body.innerHTML = '<tr><td colspan="12">Cargando comprobantes...</td></tr>';
    message.textContent = '';
    try {
      const response = await api.get('facturas/index.php');
      if (!response.success) throw new Error(response.error || 'No se pudieron cargar las facturas.');
      rows = response.data;
      csrf = response.csrf_token;
      gestionCsrf = response.gestion_csrf;
      render();
    } catch (error) {
      rows = []; visible = []; csrf = '';
      find('#fac-summary').innerHTML = '';
      body.innerHTML = '';
      message.textContent = error.message;
    } finally { find('#fac-refresh').disabled = false; }
  }
  filters.addEventListener('submit', event => event.preventDefault());
  filters.addEventListener('input', render);
  filters.addEventListener('reset', () => setTimeout(render, 0));
  find('#fac-refresh').addEventListener('click', load);
  function toggleDate() {
    payment.elements.fecha_pago.disabled = payment.elements.estado_pago.value !== 'pagada';
    payment.elements.fecha_pago.required = !payment.elements.fecha_pago.disabled;
  }
  payment.elements.estado_pago.addEventListener('change', toggleDate);
  body.addEventListener('click', event => {
    const issue = event.target.closest('[data-issue]');
    if (issue) {
      selected = rows.find(row => String(row.id) === issue.dataset.issue);
      issueForm.reset(); issueForm.elements.fecha_emision.value = localDate; find('#fac-issue-error').textContent = '';
      find('#fac-issue-dialog').showModal(); return;
    }
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    selected = rows.find(row => String(row.id) === button.dataset.id);
    if (!selected) return;
    find('#fac-selected').textContent = `${selected.numero_factura} · ${selected.cliente || 'Sin cliente'} · ${fmt.moneda(selected.precio_cliente)}`;
    payment.elements.estado_pago.value = selected.estado_pago === 'pagada' ? 'pagada' : 'por_pagar';
    payment.elements.fecha_pago.value = selected.fecha_pago || localDate;
    find('#fac-payment-error').textContent = '';
    toggleDate();
    dialog.showModal();
  });
  find('#fac-cancel').addEventListener('click', () => dialog.close());
  find('#fac-issue-close').onclick = () => find('#fac-issue-dialog').close();
  find('#fac-issue-dialog').addEventListener('cancel', e => { if(find('#fac-issue-save').disabled)e.preventDefault(); });
  find('#fac-issue').onsubmit = async e => {
    e.preventDefault(); find('#fac-issue-save').disabled = true; find('#fac-issue-close').disabled = true;
    try { await api.post('facturas/registrar.php', {...Object.fromEntries(new FormData(e.currentTarget)), id:selected.id, csrf_token:gestionCsrf}); find('#fac-issue-dialog').close(); await load(); }
    catch(err) { find('#fac-issue-error').textContent = err.message; }
    finally { find('#fac-issue-save').disabled = false; find('#fac-issue-close').disabled = false; }
  };
  payment.addEventListener('submit', async event => {
    event.preventDefault();
    find('#fac-save').disabled = true;
    find('#fac-cancel').disabled = true;
    try {
      const response = await api.post('facturas/actualizar_pago.php', {
        ...Object.fromEntries(new FormData(payment)), id: selected.id,
        numero_factura: selected.numero_factura, csrf_token: csrf
      });
      if (!response.success) throw new Error(response.error || 'No se pudo guardar el pago.');
      dialog.close();
      showToast('Estado de pago actualizado.');
      await load();
    } catch (error) { find('#fac-payment-error').textContent = error.message; }
    finally { find('#fac-save').disabled = false; find('#fac-cancel').disabled = false; }
  });
  dialog.addEventListener('cancel', event => { if (find('#fac-save').disabled) event.preventDefault(); });
  find('#fac-export').addEventListener('click', () => {
    const cell = value => {
      let text = String(value ?? '');
      if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const data = [['Comprobante', 'Tipo', 'Fecha del servicio', 'Fecha de emisión', 'Cliente', 'Documento', 'Servicio', 'Base', 'IGV', 'Total', 'Abonado', 'Saldo', 'Emisión', 'Pago', 'Fecha de pago'],
      ...visible.map(r => [r.numero_factura, r.tipo_comprobante, r.fecha_servicio, r.fecha_emision, r.cliente, r.documento, r.id,
        r.base_imponible, r.igv, r.precio_cliente, r.abonado, r.saldo, emitida(r) ? 'Emitida' : 'Por emitir', labels[r.estado_pago], r.fecha_pago])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + data.map(row => row.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `facturas_${localDate}.csv`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  await load();
}

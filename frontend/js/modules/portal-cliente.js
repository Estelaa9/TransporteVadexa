// frontend/js/modules/portal-cliente.js - Portal del cliente con datos reales (SEG-09, BD-08).
// El servidor filtra todo por el cliente vinculado a la sesión; este módulo solo muestra lo que recibe.
// El seguimiento es por estado del servicio (UX-02): no hay rastreo GPS.
import { api, showToast, fmt, esc, downloadCsv, hoyISO } from '../api.js';
import { iniciarPaginacion } from '../paginacion.js';

const ESTADOS = [
  ['programado', 'Programado', 'bi-calendar-check'],
  ['en_ruta', 'En ruta', 'bi-truck'],
  ['finalizado', 'Entregado', 'bi-check2-circle'],
];
const PAGO = { pendiente: 'Pendiente', parcial: 'Pagada parcialmente', pagada: 'Pagada', no_aplica: '—' };
const SITUACION = { por_vencer: 'Por vencer', proxima: 'Próxima a vencer', vencida: 'Vencida' };

function seguimiento(estado) {
  if (estado === 'cancelado') return '<span class="facturas-status fac-anulada">Anulado</span>';
  const idx = ESTADOS.findIndex(([k]) => k === estado);
  return `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap" aria-label="Seguimiento por estado">${ESTADOS.map(([, label, icon], i) =>
    `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:3px 8px;border-radius:12px;${i <= idx ? 'background:#dbeafe;color:#1e40af;font-weight:600' : 'background:#f1f5f9;color:#94a3b8'}"><i class="bi ${icon}"></i>${label}</span>`).join('<span style="color:#cbd5e1">›</span>')}</div>`;
}

export async function renderPortal(container) {
  let data;
  try {
    data = await api.get('portal/datos.php');
  } catch (err) {
    container.innerHTML = `<div class="alert-tms danger" style="margin:40px auto;max-width:560px"><h5>No se pudo abrir el portal</h5><p>${esc(err.message)}</p>
      <a class="btn-tms btn-tms-primary" href="index.html#login">Iniciar sesión</a></div>`;
    return;
  }
  const { cliente, resumen } = data;
  container.innerHTML = `
    <header style="background:#111827;color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:12px"><img src="../assets/img/logo.png" alt="VADEXSA" style="height:36px;background:#fff;padding:3px 6px;border-radius:6px">
        <div><strong>Portal del cliente</strong><div style="font-size:12px;color:#94a3b8">${esc(cliente.nombre)} · ${esc(cliente.documento)}</div></div></div>
      <div style="display:flex;gap:8px"><a href="index.html#mi-cuenta" class="btn-tms btn-tms-default" style="color:#111">Cambiar contraseña</a>
        <button id="pt-logout" class="btn-tms btn-tms-default" style="color:#b91c1c"><i class="bi bi-power"></i> Salir</button></div>
    </header>
    <main style="max-width:1200px;margin:0 auto;padding:24px 16px">
      <div class="facturas-summary">
        <div><span>Servicios en curso</span><strong>${esc(resumen.servicios_activos)}</strong></div>
        <div><span>Servicios entregados</span><strong>${esc(resumen.servicios_finalizados)}</strong></div>
        <div><span>Saldo pendiente</span><strong>${fmt.moneda(resumen.saldo)}</strong></div>
        <div><span>Saldo vencido</span><strong style="color:${Number(resumen.vencido) > 0 ? '#b91c1c' : 'inherit'}">${fmt.moneda(resumen.vencido)}</strong></div>
      </div>
      <div class="tabs-tms" role="tablist">
        <button role="tab" aria-selected="true" data-tab="srv">Mis servicios</button>
        <button role="tab" aria-selected="false" data-tab="cmp">Comprobantes y pagos</button>
      </div>
      <section id="tab-srv">
        <div class="gestion-grid">
          <label>Buscar<input id="pt-q" class="form-control-tms" placeholder="Guía, origen o destino"></label>
          <label>Estado<select id="pt-estado" class="form-control-tms"><option value="">Todos</option><option value="programado">Programado</option><option value="en_ruta">En ruta</option><option value="finalizado">Entregado</option><option value="cancelado">Anulado</option></select></label>
          <button id="pt-csv-srv" class="btn-tms btn-tms-default" type="button"><i class="bi bi-download"></i> CSV</button>
        </div>
        <div class="tms-table-container"><table class="tms-table"><thead><tr><th>Fecha</th><th>Guía</th><th>Ruta</th><th>Servicio</th><th>Seguimiento</th><th>Comprobante</th><th>Importe</th></tr></thead><tbody id="pt-srv"></tbody></table></div>
        <p class="muted">El seguimiento muestra el estado registrado por VADEXSA (programado, en ruta, entregado); no es una ubicación GPS en tiempo real.</p>
      </section>
      <section id="tab-cmp" hidden>
        <div class="tms-table-container"><table class="tms-table"><thead><tr><th>Comprobante</th><th>Emisión</th><th>Vence</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th></tr></thead><tbody id="pt-cmp"></tbody></table></div>
        <p class="muted">Los comprobantes electrónicos oficiales se envían por SUNAT o el proveedor de facturación de VADEXSA. Aquí se muestra su estado de pago.</p>
      </section>
      <p class="muted" style="margin-top:24px">Sus datos personales se tratan conforme a la Ley N.° 29733 de Protección de Datos Personales.</p>
    </main>`;

  const $ = s => container.querySelector(s);
  container.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    container.querySelectorAll('[data-tab]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    $('#tab-srv').hidden = b.dataset.tab !== 'srv';
    $('#tab-cmp').hidden = b.dataset.tab !== 'cmp';
  });
  const filtrar = () => {
    const q = $('#pt-q').value.trim().toLowerCase();
    const st = $('#pt-estado').value;
    return data.servicios.filter(s => (!st || s.estado_servicio === st) && (!q || [s.guia_transportista, s.guia_remitente, s.origen, s.destino, s.comprobante].some(v => String(v ?? '').toLowerCase().includes(q))));
  };
  const renderSrv = () => {
    $('#pt-srv').innerHTML = filtrar().map(s => `<tr>
      <td>${esc(fmt.fecha(s.fecha_servicio))}<br><small>${esc(fmt.hora(s.hora_servicio))}–${esc(fmt.hora(s.hora_fin_estimada))}</small></td>
      <td><code>${esc(s.guia_transportista)}</code>${s.guia_remitente ? `<br><small>GR ${esc(s.guia_remitente)}</small>` : ''}</td>
      <td>${esc(s.origen)} → ${esc(s.destino)}</td>
      <td>${esc(s.tipo_servicio)}<br><small>${esc(s.tipo_carga || '')}${s.peso_kg ? ' · ' + esc(fmt.numero(s.peso_kg, 0)) + ' kg' : ''}${s.placa ? ' · ' + esc(s.placa) : ''}</small></td>
      <td>${seguimiento(s.estado_servicio)}</td>
      <td>${esc(s.comprobante || (s.estado_servicio === 'finalizado' ? 'En proceso' : '—'))}</td>
      <td>${fmt.moneda(s.precio_cliente)}</td></tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:24px">No hay servicios para estos filtros.</td></tr>';
  };
  $('#pt-cmp').innerHTML = data.comprobantes.map(c => `<tr>
    <td><strong>${esc(c.numero_completo)}</strong><br><small>${esc(c.tipo === 'NOTA_CREDITO' ? 'Nota de crédito' + (c.referencia ? ' de ' + c.referencia : '') : c.tipo)}</small></td>
    <td>${esc(fmt.fecha(c.fecha_emision))}</td><td>${esc(fmt.fecha(c.fecha_vencimiento))}</td><td>${fmt.moneda(c.total)}</td>
    <td>${c.tipo === 'NOTA_CREDITO' ? '—' : fmt.moneda(c.pagado)}</td><td>${c.tipo === 'NOTA_CREDITO' ? '—' : fmt.moneda(c.saldo)}</td>
    <td>${c.estado === 'anulada' ? '<span class="facturas-status fac-anulada">Anulado</span>' : `<span class="facturas-status fac-${esc(c.estado_pago)}">${esc(PAGO[c.estado_pago])}</span>`}
      ${c.situacion ? `<br><span class="facturas-status fac-${esc(c.situacion)}">${esc(SITUACION[c.situacion])}</span>` : ''}</td></tr>`).join('')
    || '<tr><td colspan="7" style="text-align:center;padding:24px">Aún no hay comprobantes.</td></tr>';

  $('#pt-q').oninput = renderSrv;
  $('#pt-estado').onchange = renderSrv;
  $('#pt-csv-srv').onclick = () => downloadCsv([['Fecha', 'Hora', 'Guía', 'Origen', 'Destino', 'Servicio', 'Estado', 'Comprobante', 'Importe'],
    ...filtrar().map(s => [s.fecha_servicio, s.hora_servicio, s.guia_transportista, s.origen, s.destino, s.tipo_servicio, s.estado_servicio, s.comprobante, s.precio_cliente])], `mis_servicios_${hoyISO()}.csv`);
  $('#pt-logout').onclick = async () => {
    try { await api.post('login/logout.php'); } catch (e) { /* sin sesión */ }
    window.location.href = 'index.html#login';
  };
  renderSrv();
}

export async function iniciarPortal() {
  const container = document.getElementById('tms-content-container');
  try {
    const me = await api.get('login/validar.php', { action: 'me' });
    if (!me.logged_in) { window.location.href = 'index.html#login'; return; }
    if (me.user.rol !== 'cliente') { window.location.href = 'index.html'; return; }
    if (me.user.debe_cambiar_password) { window.location.href = 'index.html#mi-cuenta'; return; }
  } catch (err) {
    if (err.status === 401) { window.location.href = 'index.html#login'; return; }
    showToast(err.message, 'error');
    return;
  }
  iniciarPaginacion();
  await renderPortal(container);
}

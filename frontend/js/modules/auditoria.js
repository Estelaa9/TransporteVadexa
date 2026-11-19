// frontend/js/modules/auditoria.js - Consulta del registro de auditoría (SEG-24): quién hizo qué, cuándo y desde dónde.
import { api, showToast, esc, hoyISO, isoLocal, downloadCsv } from '../api.js';
import { auth } from './auth.js';

export async function renderAuditoria(container) {
  let rows = [];
  const d = new Date(); d.setDate(d.getDate() - 7);
  container.innerHTML = `
    <div class="page-title-box"><div class="page-title-main"><i class="bi bi-shield-check text-primary"></i> Auditoría
      <span class="page-title-sub">Registro de creación, modificación, anulación e inicios de sesión</span></div></div>
    <form id="au-form" class="gestion-grid">
      <label>Desde<input type="date" name="desde" class="form-control-tms" value="${isoLocal(d)}"></label>
      <label>Hasta<input type="date" name="hasta" class="form-control-tms" value="${hoyISO()}"></label>
      <label>Tabla<select name="tabla" class="form-control-tms"><option value="">Todas</option></select></label>
      <label>Acción<select name="accion" class="form-control-tms"><option value="">Todas</option>
        ${['crear', 'editar', 'anular', 'eliminar', 'cambiar_estado', 'login', 'logout', 'bloqueo_cuenta', 'cambiar_password', 'consultar'].map(a => `<option>${a}</option>`).join('')}</select></label>
      <label>Usuario<input name="usuario" class="form-control-tms"></label>
      <label>Id del registro<input name="registro_id" class="form-control-tms"></label>
      <button class="btn-tms btn-tms-primary">Consultar</button>
      ${auth.can('auditoria', 'exportar') ? '<button type="button" id="au-csv" class="btn-tms btn-tms-default"><i class="bi bi-download"></i> CSV</button>' : ''}
    </form>
    <div class="tms-table-container"><table class="tms-table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Tabla / id</th><th>Antes</th><th>Después</th><th>IP</th></tr></thead><tbody id="au-body"></tbody></table></div>`;
  const $ = s => container.querySelector(s);
  const json = v => {
    if (!v) return '';
    try { const o = JSON.parse(v); return Object.entries(o || {}).map(([k, x]) => `${k}: ${typeof x === 'object' ? JSON.stringify(x) : x}`).join('\n'); } catch { return v; }
  };
  async function load() {
    try {
      const params = Object.fromEntries([...new FormData($('#au-form'))].filter(([, v]) => v !== ''));
      const r = await api.get('auditoria/index.php', { ...params, limit: 500 });
      rows = r.data;
      const sel = $('#au-form').elements.tabla;
      const actual = sel.value;
      sel.innerHTML = '<option value="">Todas</option>' + r.tablas.map(t => `<option ${t === actual ? 'selected' : ''}>${esc(t)}</option>`).join('');
      $('#au-body').innerHTML = rows.map(a => `<tr><td>${esc(a.fecha)}</td><td>${esc(a.usuario)}</td><td>${esc(a.accion)}</td><td>${esc(a.tabla)} ${a.registro_id ? '#' + esc(a.registro_id) : ''}</td>
        <td style="white-space:pre-line;font-size:11px;max-width:280px">${esc(json(a.valores_antes))}</td><td style="white-space:pre-line;font-size:11px;max-width:280px">${esc(json(a.valores_despues))}</td><td>${esc(a.ip)}</td></tr>`).join('')
        || '<tr><td colspan="7" style="text-align:center;padding:24px">Sin registros para estos filtros.</td></tr>';
    } catch (e) { showToast(e.message, 'error'); }
  }
  $('#au-form').onsubmit = e => { e.preventDefault(); load(); };
  $('#au-csv')?.addEventListener('click', () => downloadCsv([['Fecha', 'Usuario', 'Acción', 'Tabla', 'Registro', 'Antes', 'Después', 'IP'],
    ...rows.map(a => [a.fecha, a.usuario, a.accion, a.tabla, a.registro_id, a.valores_antes, a.valores_despues, a.ip])], `auditoria_${hoyISO()}.csv`));
  await load();
}

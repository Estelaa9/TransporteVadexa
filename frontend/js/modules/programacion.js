// frontend/js/modules/programacion.js - Programación y Despacho Diario
import { api, showToast, fmt, esc, hoyISO } from '../api.js';
import { auth } from './auth.js';

export async function renderProgramacion(container) {
  let selectedDate = hoyISO();
  let conductoresDia = [];

  container.innerHTML = `
    <div class="page-title-box">
      <div class="page-title-main">
        <i class="bi bi-calendar-check text-primary"></i> Programación Diaria
        <span class="page-title-sub">Gestión de despachos y estado de rutas en tiempo real</span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button id="btn-prog-alertas" class="btn-tms btn-tms-default" type="button"><i class="bi bi-bell"></i> Activar avisos de salida</button>
        <label class="form-label mb-0" style="font-weight: 600;">Fecha:</label>
        <input type="date" id="prog-fecha-filtro" class="form-control-tms" value="${selectedDate}" style="width: 160px;">
        <button id="btn-prog-hoy" class="btn-tms btn-tms-default">Hoy</button>
        <button id="btn-prog-refresh" class="btn-tms btn-tms-default"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
    </div>

    <!-- Banner resumen de despachos -->
    <div class="kpi-grid" style="margin-bottom: 16px;">
      <div class="kpi-card blue">
        <div class="kpi-icon-wrap"><i class="bi bi-calendar-event"></i></div>
        <div>
          <div class="kpi-title">Viajes del Día</div>
          <div class="kpi-value" id="prog-total-viajes">0</div>
        </div>
      </div>

      <div class="kpi-card amber">
        <div class="kpi-icon-wrap"><i class="bi bi-clock"></i></div>
        <div>
          <div class="kpi-title">Programados</div>
          <div class="kpi-value" id="prog-total-prog">0</div>
        </div>
      </div>

      <div class="kpi-card blue">
        <div class="kpi-icon-wrap"><i class="bi bi-truck-flatbed"></i></div>
        <div>
          <div class="kpi-title">En Ruta</div>
          <div class="kpi-value" id="prog-total-ruta">0</div>
        </div>
      </div>

      <div class="kpi-card green">
        <div class="kpi-icon-wrap"><i class="bi bi-check-circle"></i></div>
        <div>
          <div class="kpi-title">Finalizados</div>
          <div class="kpi-value" id="prog-total-fin">0</div>
        </div>
      </div>
    </div>

    <!-- Tabla de despachos diarios -->
    <div class="tms-table-container">
      <table class="tms-table" id="tabla-programacion">
        <thead>
          <tr>
            <th>Hora</th>
            <th>ID</th>
            <th>Cliente</th>
            <th>Vehículo</th>
            <th>Conductor</th>
            <th>Ruta (Origen → Destino)</th>
            <th>Tipo Carga</th>
            <th>Guía Transportista</th>
            <th>Estado Actual</th>
            <th style="text-align: center;">Cambiar Estado</th>
          </tr>
        </thead>
        <tbody id="tbody-programacion">
          <tr><td colspan="10" style="text-align: center; padding: 25px; color: #94a3b8;">Cargando despachos...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Disponibilidad de conductores para la fecha -->
    <section class="disp-panel" aria-labelledby="disp-titulo">
      <div class="disp-head">
        <h6 id="disp-titulo"><i class="bi bi-person-check-fill text-success"></i> Disponibilidad de conductores <span id="disp-fecha" class="muted"></span></h6>
        <div class="disp-filtros">
          <select id="disp-filtro" class="form-control-tms" aria-label="Filtrar conductores">
            <option value="libre">Libres todo el día</option>
            <option value="con_viajes">Con viajes asignados</option>
            <option value="no_habilitado">No habilitados</option>
            <option value="">Todos</option>
          </select>
          <input id="disp-buscar" type="search" class="form-control-tms" placeholder="Buscar conductor o licencia" aria-label="Buscar conductor">
        </div>
      </div>
      <div class="disp-resumen" id="disp-resumen"></div>
      <div class="tms-table-container">
        <table class="tms-table" id="tabla-disponibles">
          <thead><tr><th>Conductor</th><th>Licencia</th><th>Vence</th><th>Teléfono</th><th>Situación del día</th></tr></thead>
          <tbody id="disp-body"><tr><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;">Consultando disponibilidad...</td></tr></tbody>
        </table>
      </div>
    </section>
  `;

  const dateInput = document.getElementById('prog-fecha-filtro');
  const tbody = document.getElementById('tbody-programacion');

  async function avisarSalidas() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const currentDate = new Date();
      const today = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const response = await api.get('servicios/programacion.php', { json: 1, fecha: today });
      const now = new Date();
      for (const service of response.data || []) {
        if (service.estado_servicio !== 'programado' || !service.hora_servicio) continue;
        const [hour, minute] = service.hora_servicio.split(':').map(Number);
        const departure = new Date(); departure.setHours(hour, minute, 0, 0);
        const key = `vadexa-salida-${departure.toDateString()}-${service.id}`;
        if (departure <= now && departure >= new Date(now.getTime() - 60000) && !localStorage.getItem(key)) {
          new Notification(`Hora de salida · Servicio #${service.id}`, { body: `${service.cliente || 'Cliente'} · ${service.placa || 'Vehículo'} · ${service.origen} → ${service.destino}` });
          localStorage.setItem(key, '1');
        }
      }
    } catch (error) { console.warn('No se pudo revisar la hora de salida', error); }
  }
  document.getElementById('btn-prog-alertas').addEventListener('click', async () => {
    if (!('Notification' in window)) { showToast('Este navegador no permite notificaciones.', 'warning'); return; }
    const permission = await Notification.requestPermission();
    showToast(permission === 'granted' ? 'Avisos de salida activados mientras esta pantalla esté abierta.' : 'No se habilitaron los avisos.', permission === 'granted' ? 'success' : 'warning');
    avisarSalidas();
  });
  const alertTimer = window.setInterval(avisarSalidas, 30000);
  window.addEventListener('hashchange', () => window.clearInterval(alertTimer), { once: true });

  async function loadProgramacion() {
    selectedDate = dateInput.value;
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 25px; color: #94a3b8;">Cargando despachos...</td></tr>`;

    try {
      const [resServicios, resDisponibles] = await Promise.all([
        api.get('servicios/programacion.php', { json: 1, fecha: selectedDate }),
        api.get('conductores/disponibles.php', { fecha: selectedDate })
      ]);

      const servicios = resServicios.data || [];
      
      document.getElementById('prog-total-viajes').textContent = servicios.length;
      document.getElementById('prog-total-prog').textContent = servicios.filter(s => s.estado_servicio === 'programado').length;
      document.getElementById('prog-total-ruta').textContent = servicios.filter(s => s.estado_servicio === 'en_ruta').length;
      document.getElementById('prog-total-fin').textContent = servicios.filter(s => s.estado_servicio === 'finalizado').length;

      if (servicios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 30px; color: #64748b;">No hay servicios programados para el <strong>${fmt.fecha(selectedDate)}</strong>.</td></tr>`;
      } else {
        tbody.innerHTML = servicios.map(s => `
          <tr>
            <td><strong style="color: #1d4ed8; font-size: 12.5px;"><i class="bi bi-clock"></i> ${esc(fmt.hora(s.hora_servicio))}–${esc(fmt.hora(s.hora_fin_estimada))}</strong></td>
            <td><strong>#${esc(s.id)}</strong></td>
            <td><strong>${esc(s.cliente || '-')}</strong></td>
            <td><span class="badge-status" style="background:#f1f5f9; color:#1e293b; border:1px solid #cbd5e1;">${esc(s.modalidad === 'tercerizado' ? (s.proveedor || 'Tercerizado') : (s.placa || '-'))}</span></td>
            <td>${esc(s.modalidad === 'tercerizado' ? 'Del proveedor' : (s.conductor || '-'))}</td>
            <td>
              <div>${esc(s.origen || '-')}</div>
              <small style="color: #64748b;"><i class="bi bi-arrow-right"></i> ${esc(s.destino || '-')}</small>
            </td>
            <td><span class="badge-status" style="background:#f8fafc; border:1px solid #e2e8f0;">${esc(s.tipo_carga || 'General')}</span></td>
            <td><code>${esc(s.guia_transportista || '-')}</code></td>
            <td>${fmt.badgeEstado(s.estado_servicio)}</td>
            <td style="text-align: center; white-space: nowrap;">
              ${['finalizado', 'cancelado'].includes(s.estado_servicio) || !auth.can('programacion', 'editar') ? '' : `<select class="form-control-tms select-change-status" data-id="${esc(s.id)}" data-actual="${esc(s.estado_servicio)}" style="width: 125px; display: inline-block; font-size: 11px; padding: 3px 6px;">
                <option value="programado" ${s.estado_servicio === 'programado' ? 'selected' : ''} ${s.estado_servicio === 'programado' ? '' : 'disabled'}>Programado</option>
                <option value="en_ruta" ${s.estado_servicio === 'en_ruta' ? 'selected' : ''}>En ruta</option>
                <option value="finalizado">Finalizado</option>
                ${auth.can('servicios', 'anular') ? '<option value="cancelado">Anular…</option>' : ''}
              </select>`}
            </td>
          </tr>
        `).join('');

        tbody.querySelectorAll('.select-change-status').forEach(select => {
          select.addEventListener('change', async (e) => {
            const id = e.target.dataset.id;
            const estado_servicio = e.target.value;
            let motivo;
            if (estado_servicio === 'cancelado') {
              motivo = prompt(`Anular el servicio #${id}. Indique el motivo:`);
              if (!motivo || motivo.trim().length < 5) { e.target.value = e.target.dataset.actual; if (motivo !== null) showToast('Indique un motivo de al menos 5 caracteres.', 'warning'); return; }
            }
            try {
              const res = await api.post('servicios/cambiar_estado.php', { id, estado_servicio, motivo });
              if (res.success) {
                showToast(`Estado del servicio #${id} actualizado a ${estado_servicio}`, 'success');
                loadProgramacion();
              }
            } catch (err) {
              e.target.value = e.target.dataset.actual;
              showToast(err.message || 'Error al cambiar estado', 'error');
            }
          });
        });
      }

      conductoresDia = resDisponibles.todos || [];
      const r = resDisponibles.resumen || {};
      document.getElementById('disp-fecha').textContent = '· ' + fmt.fecha(selectedDate);
      document.getElementById('disp-resumen').innerHTML = [
        ['libre', 'Libres todo el día', r.libres, 'bi-check-circle-fill'],
        ['con_viajes', 'Con viajes asignados', r.con_viajes, 'bi-truck'],
        ['no_habilitado', 'No habilitados', r.no_habilitados, 'bi-slash-circle'],
      ].map(([k, l, n, i]) => `<button type="button" class="disp-kpi disp-${k}" data-filtro="${k}"><i class="bi ${i}"></i><strong>${esc(n ?? 0)}</strong><span>${l}</span></button>`).join('');
      renderDisponibles();

    } catch (err) {
      showToast(err.message || 'Error al cargar programación', 'error');
    }
  }

  // Tabla de disponibilidad: filtro por situación y búsqueda por nombre o licencia.
  function renderDisponibles() {
    const filtro = document.getElementById('disp-filtro').value;
    const q = document.getElementById('disp-buscar').value.trim().toLowerCase();
    const filas = conductoresDia.filter(c => (!filtro || c.situacion === filtro) &&
      (!q || `${c.nombre} ${c.licencia} ${c.categoria_licencia || ''}`.toLowerCase().includes(q)));
    document.querySelectorAll('#disp-resumen .disp-kpi').forEach(b => b.classList.toggle('activo', b.dataset.filtro === filtro));
    const situacion = c => {
      if (c.situacion === 'libre') return '<span class="facturas-status fac-pagada">Libre todo el día</span>';
      if (c.situacion === 'no_habilitado') return `<span class="facturas-status fac-vencida">${esc(c.motivo)}</span>`;
      return `<span class="facturas-status fac-parcial">Con ${c.viajes.length} viaje(s)</span><div class="disp-viajes">${c.viajes.map(v =>
        `<span>#${esc(v.id)} ${esc(v.inicio)}–${esc(v.fin)} · ${esc(v.cliente || '')}</span>`).join('')}</div>`;
    };
    document.getElementById('disp-body').innerHTML = filas.map(c => `<tr>
      <td><strong>${esc(c.nombre)}</strong></td>
      <td><code>${esc(c.licencia || '-')}</code>${c.categoria_licencia ? ` <small class="muted">${esc(c.categoria_licencia)}</small>` : ''}</td>
      <td>${c.licencia_vencimiento ? esc(fmt.fecha(c.licencia_vencimiento)) : '<small class="muted">Sin dato</small>'}${c.licencia_por_vencer ? '<br><span class="facturas-status fac-proxima">Vence pronto</span>' : ''}</td>
      <td>${c.telefono ? `<a href="tel:${esc(c.telefono)}">${esc(c.telefono)}</a>` : '-'}</td>
      <td>${situacion(c)}</td></tr>`).join('')
      || `<tr><td colspan="5" style="text-align:center;padding:20px;color:#64748b;">No hay conductores en esta categoría para la fecha.</td></tr>`;
  }
  document.getElementById('disp-filtro').addEventListener('change', renderDisponibles);
  document.getElementById('disp-buscar').addEventListener('input', renderDisponibles);
  document.getElementById('disp-resumen').addEventListener('click', e => {
    const b = e.target.closest('[data-filtro]');
    if (!b) return;
    document.getElementById('disp-filtro').value = b.dataset.filtro;
    renderDisponibles();
  });

  dateInput.addEventListener('change', loadProgramacion);
  document.getElementById('btn-prog-hoy').addEventListener('click', () => {
    dateInput.value = hoyISO();
    loadProgramacion();
  });
  document.getElementById('btn-prog-refresh').addEventListener('click', () => {
    loadProgramacion();
    showToast('Programación actualizada', 'info');
  });

  await loadProgramacion();
  avisarSalidas();
}

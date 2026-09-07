// frontend/js/modules/programacion.js - Programación y Despacho Diario
import { api, showToast, fmt } from '../api.js';

export async function renderProgramacion(container) {
  let selectedDate = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="page-title-box">
      <div class="page-title-main">
        <i class="bi bi-calendar-check text-primary"></i> Programación Diaria
        <span class="page-title-sub">Gestión de despachos y estado de rutas en tiempo real</span>
      </div>
      <div class="d-flex align-items-center gap-2">
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

    <!-- Conductores Disponibles para la fecha -->
    <div style="margin-top: 24px; background: #ffffff; padding: 16px 20px; border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
      <h6 style="font-weight: 700; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-person-check-fill text-success"></i> Conductores Disponibles para esta fecha
      </h6>
      <div id="prog-conductores-disponibles" style="display: flex; flex-wrap: wrap; gap: 8px;">
        <span style="color: #64748b; font-size: 12px;">Consultando disponibilidad...</span>
      </div>
    </div>
  `;

  const dateInput = document.getElementById('prog-fecha-filtro');
  const tbody = document.getElementById('tbody-programacion');

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
            <td><strong style="color: #1d4ed8; font-size: 12.5px;"><i class="bi bi-clock"></i> ${fmt.hora(s.hora_servicio)}</strong></td>
            <td><strong>#${s.id}</strong></td>
            <td><strong>${s.cliente || '-'}</strong></td>
            <td><span class="badge-status" style="background:#f1f5f9; color:#1e293b; border:1px solid #cbd5e1;">${s.placa || '-'}</span></td>
            <td>${s.conductor || '-'}</td>
            <td>
              <div>${s.origen || '-'}</div>
              <small style="color: #64748b;"><i class="bi bi-arrow-right"></i> ${s.destino || '-'}</small>
            </td>
            <td><span class="badge-status" style="background:#f8fafc; border:1px solid #e2e8f0;">${s.tipo_carga || 'General'}</span></td>
            <td><code>${s.guia_transportista || '-'}</code></td>
            <td>${fmt.badgeEstado(s.estado_servicio)}</td>
            <td style="text-align: center; white-space: nowrap;">
              <select class="form-control-tms select-change-status" data-id="${s.id}" style="width: 125px; display: inline-block; font-size: 11px; padding: 3px 6px;">
                <option value="programado" ${s.estado_servicio === 'programado' ? 'selected' : ''}>Programado</option>
                <option value="en_ruta" ${s.estado_servicio === 'en_ruta' ? 'selected' : ''}>En Ruta</option>
                <option value="finalizado" ${s.estado_servicio === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                <option value="cancelado" ${s.estado_servicio === 'cancelado' ? 'selected' : ''}>Cancelado</option>
              </select>
            </td>
          </tr>
        `).join('');

        tbody.querySelectorAll('.select-change-status').forEach(select => {
          select.addEventListener('change', async (e) => {
            const id = e.target.dataset.id;
            const estado_servicio = e.target.value;
            try {
              const res = await api.post('servicios/cambiar_estado.php', { id, estado_servicio });
              if (res.success) {
                showToast(`Estado del servicio #${id} actualizado a ${estado_servicio}`, 'success');
                loadProgramacion();
              }
            } catch (err) {
              showToast(err.message || 'Error al cambiar estado', 'error');
            }
          });
        });
      }

      const contDisponibles = document.getElementById('prog-conductores-disponibles');
      const disponibles = resDisponibles.data || [];
      if (disponibles.length === 0) {
        contDisponibles.innerHTML = `<span style="color: #ef4444; font-size: 12px;"><i class="bi bi-exclamation-circle"></i> No hay conductores libres registrados para esta fecha.</span>`;
      } else {
        contDisponibles.innerHTML = disponibles.map(c => `
          <span style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 4px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            <i class="bi bi-person-check"></i> ${c.nombre} (${c.telefono || 'Sin tel.'})
          </span>
        `).join('');
      }

    } catch (err) {
      showToast(err.message || 'Error al cargar programación', 'error');
    }
  }

  dateInput.addEventListener('change', loadProgramacion);
  document.getElementById('btn-prog-hoy').addEventListener('click', () => {
    dateInput.value = new Date().toISOString().split('T')[0];
    loadProgramacion();
  });
  document.getElementById('btn-prog-refresh').addEventListener('click', () => {
    loadProgramacion();
    showToast('Programación actualizada', 'info');
  });

  await loadProgramacion();
}

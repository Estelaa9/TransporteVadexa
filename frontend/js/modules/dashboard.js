// frontend/js/modules/dashboard.js - Vista del Dashboard con métricas y KPIs
import { api, showToast, fmt } from '../api.js';

export async function renderDashboard(container) {
  const now = new Date();
  let currentMonth = now.getMonth() + 1;
  let currentYear = now.getFullYear();

  container.innerHTML = `
    <div class="page-title-box">
      <div class="page-title-main">
        <i class="bi bi-speedometer2 text-primary"></i> Dashboard
        <span class="page-title-sub">Resumen operativo y financiero mensual</span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <select id="dash-mes" class="form-control-tms" style="width: 130px;">
          ${[
            [1, 'Enero'], [2, 'Febrero'], [3, 'Marzo'], [4, 'Abril'],
            [5, 'Mayo'], [6, 'Junio'], [7, 'Julio'], [8, 'Agosto'],
            [9, 'Septiembre'], [10, 'Octubre'], [11, 'Noviembre'], [12, 'Diciembre']
          ].map(([m, nombre]) => `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>${nombre}</option>`).join('')}
        </select>
        <select id="dash-anio" class="form-control-tms" style="width: 90px;">
          ${[currentYear - 1, currentYear, currentYear + 1].map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
        <button id="btn-refresh-dash" class="btn-tms btn-tms-default" title="Recargar métricas">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>

    <!-- Grid de KPIs principales -->
    <div class="kpi-grid">
      <div class="kpi-card blue">
        <div class="kpi-icon-wrap"><i class="bi bi-truck"></i></div>
        <div>
          <div class="kpi-title">Servicios del Mes</div>
          <div class="kpi-value" id="kpi-servicios">-</div>
        </div>
      </div>

      <div class="kpi-card green">
        <div class="kpi-icon-wrap"><i class="bi bi-cash-stack"></i></div>
        <div>
          <div class="kpi-title">Facturación Total</div>
          <div class="kpi-value" id="kpi-facturacion">-</div>
        </div>
      </div>

      <div class="kpi-card amber">
        <div class="kpi-icon-wrap"><i class="bi bi-receipt"></i></div>
        <div>
          <div class="kpi-title">IGV Generado</div>
          <div class="kpi-value" id="kpi-igv">-</div>
        </div>
      </div>

      <div class="kpi-card purple">
        <div class="kpi-icon-wrap"><i class="bi bi-graph-up-arrow"></i></div>
        <div>
          <div class="kpi-title">Utilidad Neta</div>
          <div class="kpi-value" id="kpi-utilidad">-</div>
        </div>
      </div>
    </div>

    <!-- Segunda fila de KPIs y Gastos -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
      <div class="kpi-card rose">
        <div class="kpi-icon-wrap"><i class="bi bi-fuel-pump"></i></div>
        <div style="flex: 1;">
          <div class="kpi-title">Gastos Operativos (Flota)</div>
          <div class="kpi-value" id="kpi-gastos-op">-</div>
        </div>
      </div>

      <div class="kpi-card amber">
        <div class="kpi-icon-wrap"><i class="bi bi-building"></i></div>
        <div style="flex: 1;">
          <div class="kpi-title">Gastos Administrativos</div>
          <div class="kpi-value" id="kpi-gastos-admin">-</div>
        </div>
      </div>
    </div>

    <!-- Tabla de Últimos Servicios -->
    <div class="tms-toolbar">
      <div class="toolbar-group-left">
        <strong style="font-size: 13px; color: #1e293b;"><i class="bi bi-clock-history"></i> Servicios Recientes</strong>
      </div>
      <div class="toolbar-group-right">
        <a href="#servicios" class="btn-tms btn-tms-primary">
          <i class="bi bi-eye"></i> Ver Todos los Servicios
        </a>
      </div>
    </div>

    <div class="tms-table-container">
      <table class="tms-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Vehículo</th>
            <th>Conductor</th>
            <th>Origen → Destino</th>
            <th>Guía Transportista</th>
            <th>Monto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody id="dash-tabla-servicios">
          <tr><td colspan="9" style="text-align: center; padding: 20px; color: #94a3b8;">Cargando servicios recientes...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  async function loadData() {
    const mes = document.getElementById('dash-mes').value;
    const anio = document.getElementById('dash-anio').value;

    try {
      const res = await api.get('dashboard/index.php', { json: 1, mes, anio });
      if (res.success) {
        const d = res.data;
        document.getElementById('kpi-servicios').textContent = d.servicios_mes || 0;
        document.getElementById('kpi-facturacion').textContent = fmt.moneda(d.facturacion);
        document.getElementById('kpi-igv').textContent = fmt.moneda(d.igv);
        
        const utilEl = document.getElementById('kpi-utilidad');
        utilEl.textContent = fmt.moneda(d.utilidad);
        if (d.utilidad < 0) {
          utilEl.style.color = '#dc2626';
        } else {
          utilEl.style.color = '#15803d';
        }

        document.getElementById('kpi-gastos-op').textContent = fmt.moneda(d.gastos_operativos);
        document.getElementById('kpi-gastos-admin').textContent = fmt.moneda(d.gastos_admin);

        const tbody = document.getElementById('dash-tabla-servicios');
        if (!d.servicios_recientes || d.servicios_recientes.length === 0) {
          tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #64748b;">No hay servicios registrados en este periodo.</td></tr>`;
          return;
        }

        tbody.innerHTML = d.servicios_recientes.map(s => `
          <tr>
            <td><strong>#${s.id}</strong></td>
            <td>${fmt.fecha(s.fecha_servicio)}</td>
            <td><strong>${s.cliente || '-'}</strong></td>
            <td><span class="badge-status" style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1;">${s.placa || '-'}</span></td>
            <td>${s.conductor || '-'}</td>
            <td>${s.origen || '-'} <i class="bi bi-arrow-right text-muted"></i> ${s.destino || '-'}</td>
            <td><code style="color:#0369a1;">${s.guia_transportista || '-'}</code></td>
            <td style="font-weight: 700; color: #1e293b;">${fmt.moneda(s.precio_cliente)}</td>
            <td>${fmt.badgeEstado(s.estado_servicio)}</td>
          </tr>
        `).join('');
      }
    } catch (err) {
      showToast(err.message || 'Error cargando datos del dashboard', 'error');
    }
  }

  document.getElementById('dash-mes').addEventListener('change', loadData);
  document.getElementById('dash-anio').addEventListener('change', loadData);
  document.getElementById('btn-refresh-dash').addEventListener('click', () => {
    loadData();
    showToast('Dashboard actualizado', 'info');
  });

  await loadData();
}

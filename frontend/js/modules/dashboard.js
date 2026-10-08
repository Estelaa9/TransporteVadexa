// frontend/js/modules/dashboard.js - Vista del Dashboard con métricas y KPIs
import { api, showToast, fmt } from '../api.js';

export async function renderDashboard(container) {
  const now = new Date();
  let currentMonth = now.getMonth() + 1;
  let currentYear = now.getFullYear();

  container.innerHTML = `
    <div class="page-title-box" style="background: white; padding: 20px 24px; border-bottom: 2px solid #e2e8f0; margin-bottom: 24px;">
      <div class="page-title-main">
        <i class="bi bi-grid-3x3-gap-fill" style="color: #1e40af;"></i> Dashboard
        <span class="page-title-sub" style="color: #64748b; font-weight: 400;">Resumen operativo y financiero mensual</span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <select id="dash-mes" class="form-control-tms" style="width: 130px; border: 2px solid #e2e8f0; padding: 8px 12px; font-weight: 600;">
          ${[
            [1, 'Enero'], [2, 'Febrero'], [3, 'Marzo'], [4, 'Abril'],
            [5, 'Mayo'], [6, 'Junio'], [7, 'Julio'], [8, 'Agosto'],
            [9, 'Septiembre'], [10, 'Octubre'], [11, 'Noviembre'], [12, 'Diciembre']
          ].map(([m, nombre]) => `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>${nombre}</option>`).join('')}
        </select>
        <select id="dash-anio" class="form-control-tms" style="width: 90px; border: 2px solid #e2e8f0; padding: 8px 12px; font-weight: 600;">
          ${[currentYear - 1, currentYear, currentYear + 1].map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
        <button id="btn-refresh-dash" class="btn-tms btn-tms-default" title="Recargar métricas" style="border: 2px solid #e2e8f0; padding: 8px 14px;">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>

    <!-- Grid de KPIs principales -->
    <div class="kpi-grid" style="margin-bottom: 20px;">
      <!-- Servicios del Mes -->
      <div class="kpi-card" style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 48px; height: 48px; background: #eff6ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="bi bi-truck" style="font-size: 22px; color: #1e40af;"></i>
          </div>
          <div style="flex: 1;">
            <div style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Servicios del Mes</div>
            <div id="kpi-servicios" style="color: #0f172a; font-size: 28px; font-weight: 700; line-height: 1;">-</div>
          </div>
        </div>
      </div>

      <!-- Facturación Total -->
      <div class="kpi-card" style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 48px; height: 48px; background: #eff6ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="bi bi-cash-stack" style="font-size: 22px; color: #1e40af;"></i>
          </div>
          <div style="flex: 1;">
            <div style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Facturación Total</div>
            <div id="kpi-facturacion" style="color: #0f172a; font-size: 28px; font-weight: 700; line-height: 1;">-</div>
          </div>
        </div>
      </div>

      <!-- IGV Generado -->
      <div class="kpi-card" style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 48px; height: 48px; background: #f8fafc; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="bi bi-receipt" style="font-size: 22px; color: #64748b;"></i>
          </div>
          <div style="flex: 1;">
            <div style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">IGV Generado</div>
            <div id="kpi-igv" style="color: #0f172a; font-size: 28px; font-weight: 700; line-height: 1;">-</div>
          </div>
        </div>
      </div>

      <!-- Utilidad Neta -->
      <div class="kpi-card" style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 48px; height: 48px; background: #eff6ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="bi bi-graph-up-arrow" style="font-size: 22px; color: #1e40af;"></i>
          </div>
          <div style="flex: 1;">
            <div style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Utilidad Neta</div>
            <div id="kpi-utilidad" style="color: #0f172a; font-size: 28px; font-weight: 700; line-height: 1;">-</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Segunda fila de KPIs - Gastos -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px;">
      <!-- Gastos Operativos -->
      <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 48px; height: 48px; background: #f8fafc; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="bi bi-fuel-pump" style="font-size: 22px; color: #64748b;"></i>
          </div>
          <div style="flex: 1;">
            <div style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Gastos Operativos (Flota)</div>
            <div id="kpi-gastos-op" style="color: #0f172a; font-size: 26px; font-weight: 700; line-height: 1;">-</div>
          </div>
        </div>
      </div>

      <!-- Gastos Administrativos -->
      <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 48px; height: 48px; background: #f8fafc; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="bi bi-building" style="font-size: 22px; color: #64748b;"></i>
          </div>
          <div style="flex: 1;">
            <div style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Gastos Administrativos</div>
            <div id="kpi-gastos-admin" style="color: #0f172a; font-size: 26px; font-weight: 700; line-height: 1;">-</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de Últimos Servicios -->
    <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px;">
            <i class="bi bi-clock-history" style="color: #1e40af;"></i>
            Servicios Recientes
          </h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Últimos servicios registrados en el sistema</p>
        </div>
        <a href="#servicios" class="btn-tms btn-tms-primary" style="border: 2px solid #1e40af; padding: 8px 16px; font-weight: 600;">
          <i class="bi bi-eye"></i> Ver Todos los Servicios
        </a>
      </div>

      <div class="tms-table-container" style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
        <table class="tms-table" style="margin: 0;">
          <thead style="background: #f8fafc;">
            <tr>
              <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">ID</th>
              <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Fecha</th>
              <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Cliente</th>
              <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Vehículo</th>
              <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Conductor</th>
              <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Origen → Destino</th>
              <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Guía</th>
              <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; text-align: right;">Monto</th>
              <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; text-align: center;">Estado</th>
            </tr>
          </thead>
          <tbody id="dash-tabla-servicios">
            <tr><td colspan="9" style="text-align: center; padding: 40px 20px; color: #94a3b8;">Cargando servicios recientes...</td></tr>
          </tbody>
        </table>
      </div>
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
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 14px 16px;"><strong style="color: #1e40af; font-weight: 700;">#${s.id}</strong></td>
            <td style="padding: 14px 16px; color: #475569; font-size: 13px;">${fmt.fecha(s.fecha_servicio)}</td>
            <td style="padding: 14px 16px;"><strong style="color: #0f172a; font-weight: 600;">${s.cliente || '-'}</strong></td>
            <td style="padding: 14px 16px;">
              <span style="background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; border: 1px solid #e2e8f0;">
                ${s.placa || '-'}
              </span>
            </td>
            <td style="padding: 14px 16px; color: #64748b; font-size: 13px;">${s.conductor || '-'}</td>
            <td style="padding: 14px 16px; color: #475569; font-size: 13px;">
              ${s.origen || '-'} <i class="bi bi-arrow-right" style="color: #cbd5e1; margin: 0 4px;"></i> ${s.destino || '-'}
            </td>
            <td style="padding: 14px 16px;">
              <code style="color: #1e40af; background: #eff6ff; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: 600;">
                ${s.guia_transportista || '-'}
              </code>
            </td>
            <td style="padding: 14px 16px; text-align: right; font-weight: 700; color: #0f172a; font-size: 14px;">
              ${fmt.moneda(s.precio_cliente)}
            </td>
            <td style="padding: 14px 16px; text-align: center;">${fmt.badgeEstado(s.estado_servicio)}</td>
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

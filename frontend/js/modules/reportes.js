// frontend/js/modules/reportes.js - Generación e Impresión de Reportes
import { api, showToast, fmt, exportTableToExcel } from '../api.js';

export async function renderReportes(container) {
  let reportType = 'servicios';
  let reportData = [];

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  container.innerHTML = `
    <div class="page-title-box">
      <div class="page-title-main">
        <i class="bi bi-file-earmark-bar-graph text-primary"></i> Centro de Reportes
        <span class="page-title-sub">Informes operativos, facturación mensual y rentabilidad</span>
      </div>
    </div>

    <!-- Pestañas de tipos de reportes -->
    <div class="tms-tabs">
      <button class="tms-tab-btn active" id="rep-tab-servicios" data-type="servicios">
        <i class="bi bi-truck"></i> Servicios Generales
      </button>
      <button class="tms-tab-btn" id="rep-tab-facturacion" data-type="facturacion">
        <i class="bi bi-receipt"></i> Facturación e IGV
      </button>
      <button class="tms-tab-btn" id="rep-tab-utilidad" data-type="utilidad">
        <i class="bi bi-graph-up"></i> Utilidad y Rentabilidad
      </button>
      <button class="tms-tab-btn" id="rep-tab-clientes" data-type="clientes">
        <i class="bi bi-people"></i> Ventas por Cliente
      </button>
    </div>

    <!-- Toolbar de filtros -->
    <div class="tms-toolbar">
      <div class="toolbar-group-left">
        <div class="d-flex align-items-center gap-2">
          <label class="form-label mb-0" style="font-weight: 600;">Desde:</label>
          <input type="date" id="rep-desde" class="form-control-tms" value="${firstDay}" style="width: 140px;">
          
          <label class="form-label mb-0" style="font-weight: 600; margin-left: 8px;">Hasta:</label>
          <input type="date" id="rep-hasta" class="form-control-tms" value="${lastDay}" style="width: 140px;">
          
          <button id="btn-rep-generar" class="btn-tms btn-tms-primary">
            <i class="bi bi-funnel-fill"></i> Filtrar Reporte
          </button>
        </div>
      </div>

      <div class="toolbar-group-right">
        <button id="btn-rep-imprimir" class="btn-tms btn-tms-default">
          <i class="bi bi-printer"></i> Imprimir Reporte
        </button>
        <button id="btn-rep-excel" class="btn-tms btn-tms-default">
          <i class="bi bi-file-earmark-excel"></i> Exportar a Excel
        </button>
      </div>
    </div>

    <!-- KPIs del reporte -->
    <div class="kpi-grid" id="rep-kpi-container" style="margin-bottom: 16px;">
      <div class="kpi-card blue">
        <div class="kpi-icon-wrap"><i class="bi bi-list-check"></i></div>
        <div>
          <div class="kpi-title" id="rep-kpi1-title">Total Registros</div>
          <div class="kpi-value" id="rep-kpi1-val">0</div>
        </div>
      </div>

      <div class="kpi-card green">
        <div class="kpi-icon-wrap"><i class="bi bi-cash"></i></div>
        <div>
          <div class="kpi-title" id="rep-kpi2-title">Total Facturado</div>
          <div class="kpi-value" id="rep-kpi2-val">S/ 0.00</div>
        </div>
      </div>

      <div class="kpi-card amber" id="rep-kpi3-box">
        <div class="kpi-icon-wrap"><i class="bi bi-receipt"></i></div>
        <div>
          <div class="kpi-title" id="rep-kpi3-title">IGV / Utilidad</div>
          <div class="kpi-value" id="rep-kpi3-val">S/ 0.00</div>
        </div>
      </div>
    </div>

    <!-- Contenedor de la Tabla -->
    <div class="tms-table-container">
      <table class="tms-table" id="tabla-reporte-main">
        <thead id="thead-reporte"></thead>
        <tbody id="tbody-reporte">
          <tr><td colspan="8" style="text-align: center; padding: 25px; color: #94a3b8;">Cargando informe...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  const thead = document.getElementById('thead-reporte');
  const tbody = document.getElementById('tbody-reporte');
  const desdeInput = document.getElementById('rep-desde');
  const hastaInput = document.getElementById('rep-hasta');

  async function loadReport() {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 25px; color: #94a3b8;">Generando informe...</td></tr>`;
    const desde = desdeInput.value;
    const hasta = hastaInput.value;

    try {
      const endpoint = `reportes/${reportType}.php`;
      const res = await api.get(endpoint, { json: 1, desde, hasta });
      if (res.success) {
        reportData = res.data || [];
        renderReportView(res);
      }
    } catch (err) {
      showToast(err.message || 'Error al generar reporte', 'error');
    }
  }

  function renderReportView(res) {
    if (reportType === 'servicios') {
      document.getElementById('rep-kpi1-title').textContent = 'Total Servicios';
      document.getElementById('rep-kpi1-val').textContent = res.total_registros || 0;
      document.getElementById('rep-kpi2-title').textContent = 'Monto Total Facturado';
      document.getElementById('rep-kpi2-val').textContent = fmt.moneda(res.total_monto);
      document.getElementById('rep-kpi3-box').style.display = 'none';

      thead.innerHTML = `
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Vehículo</th>
          <th>Conductor</th>
          <th>Ruta</th>
          <th>G. Transportista</th>
          <th style="text-align: right;">Monto (S/)</th>
          <th style="text-align: center;">Estado</th>
        </tr>
      `;

      if (reportData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 25px; color: #64748b;">No hay servicios en el rango seleccionado.</td></tr>`;
        return;
      }

      tbody.innerHTML = reportData.map(s => `
        <tr>
          <td><strong>#${s.id}</strong></td>
          <td>${fmt.fecha(s.fecha_servicio)}</td>
          <td><strong>${s.cliente || '-'}</strong></td>
          <td>${s.placa || '-'}</td>
          <td>${s.conductor || '-'}</td>
          <td>${s.origen || '-'} → ${s.destino || '-'}</td>
          <td><code>${s.guia_transportista || '-'}</code></td>
          <td style="text-align: right; font-weight: 700;">${fmt.moneda(s.precio_cliente)}</td>
          <td style="text-align: center;">${fmt.badgeEstado(s.estado_servicio)}</td>
        </tr>
      `).join('');

    } else if (reportType === 'facturacion') {
      document.getElementById('rep-kpi1-title').textContent = 'Comprobantes Emitidos';
      document.getElementById('rep-kpi1-val').textContent = res.total_registros || 0;
      document.getElementById('rep-kpi2-title').textContent = 'Total Facturado';
      document.getElementById('rep-kpi2-val').textContent = fmt.moneda(res.total_facturado);
      document.getElementById('rep-kpi3-box').style.display = 'flex';
      document.getElementById('rep-kpi3-title').textContent = 'Total IGV Generado';
      document.getElementById('rep-kpi3-val').textContent = fmt.moneda(res.total_igv);

      thead.innerHTML = `
        <tr>
          <th>Fecha</th>
          <th>N° Comprobante</th>
          <th>Tipo</th>
          <th style="text-align: right;">Base Imponible (S/)</th>
          <th style="text-align: right;">IGV 18% (S/)</th>
          <th style="text-align: right;">Total Comprobante (S/)</th>
        </tr>
      `;

      if (reportData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 25px; color: #64748b;">No hay comprobantes emitidos en este periodo.</td></tr>`;
        return;
      }

      tbody.innerHTML = reportData.map(f => `
        <tr>
          <td>${fmt.fecha(f.fecha_servicio)}</td>
          <td><strong style="color: #1d4ed8;">${f.numero_factura || '-'}</strong></td>
          <td><span class="badge-status" style="background: #eff6ff; color: #1d4ed8;">${f.tipo_comprobante}</span></td>
          <td style="text-align: right;">${fmt.moneda(f.base_imponible)}</td>
          <td style="text-align: right; color: #d97706; font-weight: 600;">${fmt.moneda(f.igv)}</td>
          <td style="text-align: right; font-weight: 700; color: #15803d;">${fmt.moneda(f.precio_cliente)}</td>
        </tr>
      `).join('');

    } else if (reportType === 'utilidad') {
      document.getElementById('rep-kpi1-title').textContent = 'Servicios Evaluados';
      document.getElementById('rep-kpi1-val').textContent = res.total_registros || 0;
      document.getElementById('rep-kpi2-title').textContent = 'Facturación Bruta';
      document.getElementById('rep-kpi2-val').textContent = fmt.moneda(res.total_facturado);
      document.getElementById('rep-kpi3-box').style.display = 'flex';
      document.getElementById('rep-kpi3-title').textContent = 'Utilidad Neta';
      document.getElementById('rep-kpi3-val').textContent = fmt.moneda(res.total_utilidad);

      thead.innerHTML = `
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Modalidad</th>
          <th style="text-align: right;">Cobrado a Cliente (S/)</th>
          <th style="text-align: right;">Costo Proveedor (S/)</th>
          <th style="text-align: right;">Utilidad Neta (S/)</th>
        </tr>
      `;

      if (reportData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 25px; color: #64748b;">No hay datos de utilidad en el rango seleccionado.</td></tr>`;
        return;
      }

      tbody.innerHTML = reportData.map(u => `
        <tr>
          <td><strong>#${u.id}</strong></td>
          <td>${fmt.fecha(u.fecha_servicio)}</td>
          <td><span class="badge-status" style="background: ${u.modalidad === 'propio' ? '#eff6ff' : '#fef3c7'};">${u.modalidad}</span></td>
          <td style="text-align: right; font-weight: 600;">${fmt.moneda(u.precio_cliente)}</td>
          <td style="text-align: right; color: #dc2626;">${fmt.moneda(u.costo_proveedor)}</td>
          <td style="text-align: right; font-weight: 700; color: ${u.utilidad >= 0 ? '#15803d' : '#dc2626'};">${fmt.moneda(u.utilidad)}</td>
        </tr>
      `).join('');

    } else if (reportType === 'clientes') {
      document.getElementById('rep-kpi1-title').textContent = 'Clientes con Servicios';
      document.getElementById('rep-kpi1-val').textContent = res.total_clientes || 0;
      document.getElementById('rep-kpi2-title').textContent = 'Gran Total Facturado';
      document.getElementById('rep-kpi2-val').textContent = fmt.moneda(res.gran_total);
      document.getElementById('rep-kpi3-box').style.display = 'none';

      thead.innerHTML = `
        <tr>
          <th>Cliente</th>
          <th>Documento</th>
          <th style="text-align: center;">Cantidad de Viajes</th>
          <th style="text-align: right;">Facturación Total (S/)</th>
        </tr>
      `;

      if (reportData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 25px; color: #64748b;">No hay movimientos de clientes en este rango.</td></tr>`;
        return;
      }

      tbody.innerHTML = reportData.map(c => `
        <tr>
          <td><strong style="color: #0f172a;">${c.cliente || 'Sin nombre'}</strong></td>
          <td><code>${c.documento || '-'}</code></td>
          <td style="text-align: center;"><strong>${c.total_viajes}</strong></td>
          <td style="text-align: right; font-weight: 700; color: #15803d;">${fmt.moneda(c.total_facturado)}</td>
        </tr>
      `).join('');
    }
  }

  document.querySelectorAll('.tms-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tms-tab-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      reportType = e.currentTarget.dataset.type;
      loadReport();
    });
  });

  document.getElementById('btn-rep-generar').addEventListener('click', loadReport);
  document.getElementById('btn-rep-imprimir').addEventListener('click', () => window.print());
  document.getElementById('btn-rep-excel').addEventListener('click', () => {
    exportTableToExcel('tabla-reporte-main', `reporte_${reportType}_vadexsa.csv`);
  });

  await loadReport();
}

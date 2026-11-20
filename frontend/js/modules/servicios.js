// frontend/js/modules/servicios.js - Gestión integral de Servicios y Liquidaciones
import { api, showToast, fmt, exportTableToExcel, esc } from '../api.js';
import { auth } from './auth.js';
import { crearAsistenteServicio } from './servicio-wizard.js';

export async function renderServicios(container) {
  let allServicios = [];
  let currentTab = 'sin_liquidar'; // 'sin_liquidar' o 'liquidaciones'
  const escapeHtml = esc;
  const puede = accion => auth.can('servicios', accion);

  container.innerHTML = `
    <div class="page-title-box">
      <div class="page-title-main">
        <i class="bi bi-truck text-primary"></i> Control de Servicios y Liquidaciones
        <span class="page-title-sub">Operaciones de transporte, fletes y liquidación</span>
      </div>
    </div>

    <!-- Pestañas de navegación -->
    <div class="tms-tabs">
      <button class="tms-tab-btn active" id="tab-sin-liquidar" data-tab="sin_liquidar">
        <i class="bi bi-hourglass-split"></i> Viajes sin liquidar
      </button>
      <button class="tms-tab-btn" id="tab-liquidaciones" data-tab="liquidaciones">
        <i class="bi bi-check2-all"></i> Liquidaciones y Finalizados
      </button>
    </div>

    <!-- Barra de herramientas empresarial -->
    <div class="tms-toolbar">
      <div class="toolbar-group-left">
        <button id="btn-servicios-refresh" class="btn-tms btn-tms-default">
          <i class="bi bi-arrow-clockwise"></i> Actualizar
        </button>
        <button id="btn-servicios-nuevo" class="btn-tms btn-tms-primary" ${puede('crear') ? '' : 'hidden'}>
          <i class="bi bi-plus-circle"></i> Nuevo Servicio
        </button>
        <button id="btn-servicios-imprimir" class="btn-tms btn-tms-default">
          <i class="bi bi-printer"></i> Imprimir
        </button>
        <button id="btn-servicios-excel" class="btn-tms btn-tms-default" ${puede('exportar') ? '' : 'hidden'}>
          <i class="bi bi-file-earmark-excel"></i> Excel
        </button>
      </div>

      <div class="toolbar-group-right">
        <div class="search-table-box">
          <label><i class="bi bi-search"></i> Buscar:</label>
          <input type="text" id="search-servicios" class="search-table-input" placeholder="Cliente, placa, guía...">
        </div>
      </div>
    </div>

    <!-- Contenedor de la Tabla -->
    <div class="tms-table-container">
      <table class="tms-table" id="tabla-servicios-main">
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;"><input type="checkbox" id="check-all-servicios"></th>
            <th>ID</th>
            <th>Fecha / Hora</th>
            <th>Cliente</th>
            <th>Vehículo / proveedor</th>
            <th>Conductor</th>
            <th>Origen → Destino</th>
            <th>G. Remitente</th>
            <th>G. Transportista</th>
            <th>Comprobante</th>
            <th style="text-align: right;">Monto (S/)</th>
            <th style="text-align: right;" title="Base imponible sin IGV − costo del proveedor">Margen sin IGV (S/)</th>
            <th style="text-align: center;">Estado</th>
            <th class="no-export" style="text-align: center;">Acciones</th>
          </tr>
        </thead>
        <tbody id="tbody-servicios">
          <tr><td colspan="14" style="text-align: center; padding: 25px; color: #94a3b8;">Cargando servicios...</td></tr>
        </tbody>
      </table>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 12px; color: #64748b;">
      <div id="servicios-contador">Mostrando 0 servicios</div>
      <div id="servicios-total-monto" style="font-weight: 700; color: #1e293b; font-size: 13px;">Total: S/ 0.00</div>
    </div>

  `;

  const tbody = document.getElementById('tbody-servicios');
  const searchInput = document.getElementById('search-servicios');
  // Asistente de registro en 4 pasos (servicio-wizard.js): usa la lista cargada para calcular la disponibilidad.
  const asistente = crearAsistenteServicio({ getServicios: () => allServicios, onGuardado: () => loadServicios() });
  // Al salir del módulo se retira el modal del asistente del documento.
  new MutationObserver((_, obs) => { if (!document.body.contains(tbody)) { asistente.destruir(); obs.disconnect(); } }).observe(container, { childList: true });

  async function loadServicios() {
    tbody.innerHTML = `<tr><td colspan="14" style="text-align: center; padding: 25px; color: #94a3b8;">Cargando servicios...</td></tr>`;
    try {
      const res = await api.get('servicios/index.php');
      if (res.success) {
        allServicios = res.data || [];
        renderTable();
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="14" role="alert" style="text-align:center;padding:25px;color:#991b1b;">${escapeHtml(err.message)}</td></tr>`;
      showToast(err.message || 'Error al cargar servicios', 'error');
    }
  }

  function renderTable() {
    const q = searchInput.value.toLowerCase().trim();
    
    const filtered = allServicios.filter(s => {
      const st = (s.estado_servicio || '').toLowerCase();
      if (currentTab === 'sin_liquidar') {
        if (st === 'finalizado' || st === 'cancelado') return false;
      } else if (currentTab === 'liquidaciones') {
        if (st === 'programado' || st === 'en_ruta') return false;
      }

      if (q) {
        const text = `${s.id} ${s.cliente} ${s.placa} ${s.conductor} ${s.origen} ${s.destino} ${s.guia_remitente} ${s.guia_transportista} ${s.comprobante} ${s.proveedor} ${s.estado_servicio}`.toLowerCase();
        return text.includes(q);
      }
      return true;
    });

    document.getElementById('servicios-contador').textContent = `Mostrando ${filtered.length} de ${allServicios.length} servicios`;
    const totalSuma = filtered.reduce((acc, curr) => acc + (parseFloat(curr.precio_cliente) || 0), 0);
    document.getElementById('servicios-total-monto').textContent = `Total (con IGV): ${fmt.moneda(totalSuma)}`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="14" style="text-align: center; padding: 30px; color: #64748b;">No se encontraron servicios en esta sección.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(s => {
      const st = (s.estado_servicio || 'programado').toLowerCase();
      let actionPill = '';
      
      const sid = escapeHtml(s.id);
      if (st === 'programado' && puede('editar')) {
        actionPill = `<button class="btn-pill-action" data-action="status" data-id="${sid}" data-newstatus="en_ruta" title="Poner en ruta"><i class="bi bi-play-fill"></i> Iniciar</button>`;
      } else if (st === 'en_ruta' && puede('editar')) {
        actionPill = `<button class="btn-pill-action" data-action="status" data-id="${sid}" data-newstatus="finalizado" style="background:#16a34a;" title="Finalizar servicio"><i class="bi bi-check-lg"></i> Finalizar</button>`;
      }

      return `
        <tr>
          <td style="text-align: center;"><input type="checkbox" class="srv-checkbox" value="${sid}"></td>
          <td><strong>#${sid}</strong></td>
          <td>
            <div>${escapeHtml(fmt.fecha(s.fecha_servicio))}</div>
            <small style="color: #64748b;">${escapeHtml(fmt.hora(s.hora_servicio))}–${escapeHtml(fmt.hora(s.hora_fin_estimada))}</small>
          </td>
          <td><strong>${escapeHtml(s.cliente || '-')}</strong></td>
          <td><span class="badge-status" style="background:#f1f5f9; color:#1e293b; border:1px solid #cbd5e1;">${escapeHtml(s.modalidad === 'tercerizado' ? (s.proveedor || 'Tercerizado') : (s.placa || '-'))}</span></td>
          <td>${escapeHtml(s.modalidad === 'tercerizado' ? 'Del proveedor' : (s.conductor || '-'))}</td>
          <td>
            <div style="font-size: 11px;">${escapeHtml(s.origen || '-')}</div>
            <div style="font-size: 11px; color:#64748b;"><i class="bi bi-arrow-down-right"></i> ${escapeHtml(s.destino || '-')}</div>
          </td>
          <td><small>${escapeHtml(s.guia_remitente || '-')}</small></td>
          <td><code style="color: #0284c7; font-weight: 600;">${escapeHtml(s.guia_transportista || '-')}</code></td>
          <td>
            <small style="font-weight: 600;">${escapeHtml(s.comprobante || (st === 'cancelado' ? '—' : st === 'finalizado' && s.tipo_comprobante !== 'SIN_COMPROBANTE' ? 'Por facturar' : s.tipo_comprobante))}</small>
          </td>
          <td style="text-align: right; font-weight: 700; color: #1e293b;">${fmt.moneda(s.precio_cliente)}</td>
          <td style="text-align: right; font-weight: 600; color: ${Number(s.utilidad) >= 0 ? '#15803d' : '#dc2626'};">${fmt.moneda(s.utilidad)}</td>
          <td style="text-align: center;">${fmt.badgeEstado(s.estado_servicio)}</td>
          <td class="no-export" style="text-align: center; white-space: nowrap;">
            ${actionPill}
            ${puede('editar') && st !== 'cancelado' ? `<button class="btn-pill-action btn-pill-edit" data-action="edit" data-id="${sid}" title="Editar"><i class="bi bi-pencil"></i></button>` : ''}
            ${puede('anular') && (st === 'programado' || st === 'en_ruta') && !s.comprobante_id ? `<button class="btn-pill-action btn-pill-delete" data-action="delete" data-id="${sid}" title="Anular servicio"><i class="bi bi-x-octagon"></i></button>` : ''}
            <a class="btn-pill-action" href="../servicios/imprimir.php?id=${encodeURIComponent(s.id)}" target="_blank" rel="noopener" title="Imprimir orden"><i class="bi bi-printer"></i></a>
            ${st === 'cancelado' && s.motivo_cancelacion ? `<br><small title="Motivo">${escapeHtml(s.motivo_cancelacion)}</small>` : ''}
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', handleRowAction);
    });
  }

  async function handleRowAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'status') {
      const newStatus = btn.dataset.newstatus;
      try {
        const res = await api.post('servicios/cambiar_estado.php', { id, estado_servicio: newStatus });
        if (res.success) {
          showToast(`Servicio #${id} actualizado a ${newStatus}`, 'success');
          loadServicios();
        }
      } catch (err) {
        showToast(err.message || 'Error al cambiar estado', 'error');
      }
    } else if (action === 'edit') {
      asistente.abrirEdicion(id);
    } else if (action === 'delete') {
      const motivo = prompt(`Anular el servicio #${id}. Se conserva en el historial.\nIndique el motivo:`);
      if (motivo && motivo.trim().length >= 5) {
        try {
          const res = await api.post('servicios/eliminar.php', { id, motivo: motivo.trim() });
          if (res.success) {
            showToast(res.message || `Servicio #${id} anulado`, 'success');
            loadServicios();
          }
        } catch (err) {
          showToast(err.message || 'Error al anular', 'error');
        }
      } else if (motivo !== null) {
        showToast('Indique un motivo de al menos 5 caracteres.', 'warning');
      }
    }
  }


  document.getElementById('btn-servicios-nuevo').addEventListener('click', () => asistente.abrirNuevo());
  document.getElementById('btn-servicios-refresh').addEventListener('click', () => {
    loadServicios();
    showToast('Lista de servicios actualizada', 'info');
  });

  document.getElementById('tab-sin-liquidar').addEventListener('click', (e) => {
    document.querySelectorAll('.tms-tab-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentTab = 'sin_liquidar';
    renderTable();
  });

  document.getElementById('tab-liquidaciones').addEventListener('click', (e) => {
    document.querySelectorAll('.tms-tab-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentTab = 'liquidaciones';
    renderTable();
  });

  searchInput.addEventListener('input', renderTable);

  document.getElementById('btn-servicios-excel').addEventListener('click', () => {
    exportTableToExcel('tabla-servicios-main', `servicios_vadexsa_${new Date().toISOString().split('T')[0]}.csv`);
  });

  document.getElementById('btn-servicios-imprimir').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('check-all-servicios').addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    document.querySelectorAll('.srv-checkbox').forEach(c => c.checked = isChecked);
  });

  await loadServicios();
}

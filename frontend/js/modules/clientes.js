// frontend/js/modules/clientes.js - Gestión de Clientes y su Historial de Viajes
import { api, showToast, fmt, exportTableToExcel } from '../api.js';

export async function renderClientes(container) {
  let clientesList = [];

  container.innerHTML = `
    <div class="page-title-box">
      <div class="page-title-main">
        <i class="bi bi-people-fill text-primary"></i> Directorio de Clientes
        <span class="page-title-sub">Gestión de cuentas corporativas, personas y su historial</span>
      </div>
    </div>

    <div class="tms-toolbar">
      <div class="toolbar-group-left">
        <button id="btn-cli-nuevo" class="btn-tms btn-tms-primary">
          <i class="bi bi-person-plus-fill"></i> Nuevo Cliente
        </button>
        <button id="btn-cli-refresh" class="btn-tms btn-tms-default">
          <i class="bi bi-arrow-clockwise"></i> Actualizar
        </button>
        <button id="btn-cli-excel" class="btn-tms btn-tms-default">
          <i class="bi bi-file-earmark-excel"></i> Excel
        </button>
        <select id="cli-filtro-tipo" class="form-control-tms" style="width: 140px;">
          <option value="">Todos los tipos</option>
          <option value="Empresa">Empresa / RUC</option>
          <option value="Persona">Persona / DNI</option>
        </select>
      </div>

      <div class="toolbar-group-right">
        <div class="search-table-box">
          <label><i class="bi bi-search"></i> Buscar:</label>
          <input type="text" id="search-clientes" class="search-table-input" placeholder="Nombre, RUC, teléfono...">
        </div>
      </div>
    </div>

    <div class="tms-table-container">
      <table class="tms-table" id="tabla-clientes">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre / Razón Social</th>
            <th>Tipo</th>
            <th>RUC / DNI</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Email</th>
            <th class="no-export" style="text-align: center;">Acciones</th>
          </tr>
        </thead>
        <tbody id="tbody-clientes">
          <tr><td colspan="8" style="text-align: center; padding: 25px; color: #94a3b8;">Cargando clientes...</td></tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top: 10px; font-size: 12px; color: #64748b;" id="clientes-contador">
      Total de clientes: 0
    </div>

    <!-- Modal Nuevo / Editar Cliente -->
    <div class="tms-modal-backdrop" id="modal-cliente">
      <div class="tms-modal-dialog" style="max-width: 600px;">
        <div class="tms-modal-header">
          <div class="tms-modal-title" id="modal-cliente-titulo">
            <i class="bi bi-person-plus"></i> Registrar Cliente
          </div>
          <button class="tms-modal-close" id="btn-close-modal-cliente">&times;</button>
        </div>
        <form id="form-cliente">
          <input type="hidden" id="cli-id" name="id">
          <div class="tms-modal-body">
            <div class="form-grid">
              
              <!-- Datos del Cliente -->
              <div class="col-12" style="margin-bottom: 8px;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                    <i class="bi bi-building-fill" style="font-size: 16px;"></i>
                    <span>DATOS DEL CLIENTE</span>
                  </h4>
                </div>
              </div>

              <div class="col-12 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Nombre o Razón Social *</label>
                <input type="text" id="cli-nombre" class="form-control-tms" required placeholder="Ej: VADEXSA LOGISTIC S.A.C." style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Tipo de Cliente *</label>
                <select id="cli-tipo" class="form-control-tms" required style="border: 2px solid #e2e8f0; padding: 10px 14px;">
                  <option value="Empresa">Empresa</option>
                  <option value="Persona">Persona Natural</option>
                </select>
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">N° Documento (RUC / DNI)</label>
                <input type="text" id="cli-documento" class="form-control-tms" placeholder="20604629293" style="border: 2px solid #e2e8f0; padding: 10px 14px; background: #dbeafe;">
              </div>

              <!-- Información de Contacto -->
              <div class="col-12" style="margin-bottom: 8px; margin-top: 20px;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                    <i class="bi bi-telephone-fill" style="font-size: 16px;"></i>
                    <span>INFORMACIÓN DE CONTACTO</span>
                  </h4>
                </div>
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Teléfono / Celular</label>
                <input type="text" id="cli-telefono" class="form-control-tms" placeholder="987654321" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Correo Electrónico</label>
                <input type="email" id="cli-email" class="form-control-tms" placeholder="contacto@cliente.com" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <div class="col-12 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Dirección Fiscal / Despacho</label>
                <input type="text" id="cli-direccion" class="form-control-tms" placeholder="Av. Principal 123, Lima" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

            </div>
          </div>
          <div class="tms-modal-footer">
            <button type="button" class="btn-tms btn-tms-default" id="btn-cancel-modal-cliente">Cancelar</button>
            <button type="submit" class="btn-tms btn-tms-primary" id="btn-guardar-cliente">
              <i class="bi bi-save"></i> Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Historial de Servicios del Cliente -->
    <div class="tms-modal-backdrop" id="modal-historial-cliente">
      <div class="tms-modal-dialog" style="max-width: 850px;">
        <div class="tms-modal-header">
          <div class="tms-modal-title" id="modal-historial-titulo">
            <i class="bi bi-journal-text"></i> Historial de Servicios
          </div>
          <button class="tms-modal-close" id="btn-close-modal-historial">&times;</button>
        </div>
        <div class="tms-modal-body">
          <div id="historial-resumen-box" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div class="kpi-card blue" style="padding: 10px 14px;">
              <div class="kpi-icon-wrap" style="width: 36px; height: 36px; font-size: 16px;"><i class="bi bi-truck"></i></div>
              <div>
                <div class="kpi-title">Total Viajes</div>
                <div class="kpi-value" id="historial-total-viajes" style="font-size: 16px;">0</div>
              </div>
            </div>
            <div class="kpi-card green" style="padding: 10px 14px;">
              <div class="kpi-icon-wrap" style="width: 36px; height: 36px; font-size: 16px;"><i class="bi bi-cash"></i></div>
              <div>
                <div class="kpi-title">Facturación Acumulada</div>
                <div class="kpi-value" id="historial-total-facturado" style="font-size: 16px;">S/ 0.00</div>
              </div>
            </div>
          </div>

          <div class="tms-table-container">
            <table class="tms-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Ruta</th>
                  <th>Vehículo</th>
                  <th>Conductor</th>
                  <th>G. Transportista</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody id="tbody-historial-cliente">
                <tr><td colspan="8" style="text-align: center; padding: 20px;">Cargando historial...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="tms-modal-footer">
          <button type="button" class="btn-tms btn-tms-default" id="btn-cerrar-historial">Cerrar</button>
        </div>
      </div>
    </div>
  `;

  const tbody = document.getElementById('tbody-clientes');
  const searchInput = document.getElementById('search-clientes');
  const filtroTipo = document.getElementById('cli-filtro-tipo');
  const modalCli = document.getElementById('modal-cliente');
  const modalHist = document.getElementById('modal-historial-cliente');
  const formCli = document.getElementById('form-cliente');

  async function loadClientes() {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 25px; color: #94a3b8;">Cargando clientes...</td></tr>`;
    try {
      const tipo = filtroTipo.value;
      const res = await api.get('clientes/index.php', { tipo });
      if (res.success) {
        clientesList = res.data || [];
        renderTable();
      }
    } catch (err) {
      showToast(err.message || 'Error al cargar clientes', 'error');
    }
  }

  function renderTable() {
    const q = searchInput.value.toLowerCase().trim();
    const filtered = clientesList.filter(c => {
      if (!q) return true;
      const t = `${c.id} ${c.nombre} ${c.documento} ${c.telefono} ${c.direccion} ${c.email}`.toLowerCase();
      return t.includes(q);
    });

    document.getElementById('clientes-contador').textContent = `Mostrando ${filtered.length} de ${clientesList.length} clientes`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 25px; color: #64748b;">No se encontraron clientes.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(c => `
      <tr>
        <td><strong>#${c.id}</strong></td>
        <td><strong style="color: #0f172a;">${c.nombre}</strong></td>
        <td><span class="badge-status" style="background: ${c.tipo_cliente === 'Empresa' ? '#eff6ff' : '#f8fafc'}; color: ${c.tipo_cliente === 'Empresa' ? '#1d4ed8' : '#334155'}; border: 1px solid #cbd5e1;">${c.tipo_cliente || 'Empresa'}</span></td>
        <td><code>${c.documento || '-'}</code></td>
        <td>${c.telefono || '-'}</td>
        <td><small style="color: #64748b;">${c.direccion || '-'}</small></td>
        <td><small>${c.email || '-'}</small></td>
        <td class="no-export" style="text-align: center; white-space: nowrap;">
          <button class="btn-pill-action" data-action="historial" data-id="${c.id}" data-nombre="${encodeURIComponent(c.nombre)}" title="Ver Historial de Viajes" style="background:#0284c7;">
            <i class="bi bi-clock-history"></i> Viajes
          </button>
          <button class="btn-pill-action btn-pill-edit" data-action="edit" data-id="${c.id}" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn-pill-action btn-pill-delete" data-action="delete" data-id="${c.id}" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', handleAction);
    });
  }

  async function handleAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'historial') {
      const nombre = decodeURIComponent(btn.dataset.nombre || 'Cliente');
      openHistorialModal(id, nombre);
    } else if (action === 'edit') {
      openEditModal(id);
    } else if (action === 'delete') {
      if (confirm(`¿Está seguro de eliminar este cliente?`)) {
        try {
          const res = await api.delete('clientes/eliminar.php', { id });
          if (res.success) {
            showToast('Cliente eliminado', 'success');
            loadClientes();
          }
        } catch (err) {
          showToast(err.message || 'Error al eliminar', 'error');
        }
      }
    }
  }

  async function openHistorialModal(id, nombre) {
    document.getElementById('modal-historial-titulo').innerHTML = `<i class="bi bi-journal-text"></i> Historial de Viajes — <strong>${nombre}</strong>`;
    const tbodyHist = document.getElementById('tbody-historial-cliente');
    tbodyHist.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">Cargando historial...</td></tr>`;
    modalHist.classList.add('show');

    try {
      const res = await api.get('clientes/servicios.php', { id });
      if (res.success) {
        document.getElementById('historial-total-viajes').textContent = res.total_servicios || 0;
        document.getElementById('historial-total-facturado').textContent = fmt.moneda(res.total_facturado);

        const servicios = res.servicios || [];
        if (servicios.length === 0) {
          tbodyHist.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">Este cliente no tiene viajes registrados aún.</td></tr>`;
          return;
        }

        tbodyHist.innerHTML = servicios.map(s => `
          <tr>
            <td><strong>#${s.id}</strong></td>
            <td>${fmt.fecha(s.fecha_servicio)}</td>
            <td>${s.origen || '-'} → ${s.destino || '-'}</td>
            <td>${s.placa || '-'}</td>
            <td>${s.conductor || '-'}</td>
            <td><code>${s.guia_transportista || '-'}</code></td>
            <td style="font-weight: 700;">${fmt.moneda(s.precio_cliente)}</td>
            <td>${fmt.badgeEstado(s.estado_servicio)}</td>
          </tr>
        `).join('');
      }
    } catch (err) {
      showToast(err.message || 'Error al cargar historial', 'error');
    }
  }

  async function openEditModal(id) {
    try {
      const res = await api.get('clientes/index.php', { action: 'get', id });
      if (res.success && res.data) {
        const c = res.data;
        document.getElementById('cli-id').value = c.id;
        document.getElementById('modal-cliente-titulo').innerHTML = `<i class="bi bi-pencil-square"></i> Editar Cliente #${c.id}`;
        document.getElementById('cli-nombre').value = c.nombre || '';
        document.getElementById('cli-tipo').value = c.tipo_cliente || 'Empresa';
        document.getElementById('cli-documento').value = c.documento || '';
        document.getElementById('cli-telefono').value = c.telefono || '';
        document.getElementById('cli-email').value = c.email || '';
        document.getElementById('cli-direccion').value = c.direccion || '';
        modalCli.classList.add('show');
      }
    } catch (err) {
      showToast(err.message || 'Error al obtener cliente', 'error');
    }
  }

  function openNewModal() {
    formCli.reset();
    document.getElementById('cli-id').value = '';
    document.getElementById('modal-cliente-titulo').innerHTML = `<i class="bi bi-person-plus"></i> Registrar Nuevo Cliente`;
    modalCli.classList.add('show');
  }

  formCli.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('cli-id').value;
    const isEdit = Boolean(id);

    const payload = {
      id: id || undefined,
      nombre: document.getElementById('cli-nombre').value,
      tipo_cliente: document.getElementById('cli-tipo').value,
      documento: document.getElementById('cli-documento').value,
      telefono: document.getElementById('cli-telefono').value,
      email: document.getElementById('cli-email').value,
      direccion: document.getElementById('cli-direccion').value,
    };

    const btn = document.getElementById('btn-guardar-cliente');
    btn.disabled = true;

    try {
      let res;
      if (isEdit) {
        res = await api.post('clientes/actualizar.php', payload);
      } else {
        res = await api.post('clientes/guardar.php', payload);
      }

      if (res.success) {
        showToast(res.message || 'Cliente guardado', 'success');
        modalCli.classList.remove('show');
        loadClientes();
      }
    } catch (err) {
      showToast(err.message || 'Error al guardar cliente', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('btn-cli-nuevo').addEventListener('click', openNewModal);
  document.getElementById('btn-cli-refresh').addEventListener('click', () => {
    loadClientes();
    showToast('Clientes actualizados', 'info');
  });
  document.getElementById('btn-close-modal-cliente').addEventListener('click', () => modalCli.classList.remove('show'));
  document.getElementById('btn-cancel-modal-cliente').addEventListener('click', () => modalCli.classList.remove('show'));
  document.getElementById('btn-close-modal-historial').addEventListener('click', () => modalHist.classList.remove('show'));
  document.getElementById('btn-cerrar-historial').addEventListener('click', () => modalHist.classList.remove('show'));
  filtroTipo.addEventListener('change', loadClientes);
  searchInput.addEventListener('input', renderTable);
  document.getElementById('btn-cli-excel').addEventListener('click', () => {
    exportTableToExcel('tabla-clientes', 'clientes_vadexsa.csv');
  });

  await loadClientes();
}

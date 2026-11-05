// frontend/js/modules/vehiculos.js - Gestión de la Flota de Vehículos
import { api, showToast, exportTableToExcel } from '../api.js';

export async function renderVehiculos(container) {
  let vehiculosList = [];

  container.innerHTML = `
    <div class="page-title-box" style="background: white; padding: 20px 24px; border-bottom: 2px solid #e2e8f0; margin-bottom: 24px;">
      <div class="page-title-main">
        <i class="bi bi-truck-flatbed" style="color: #1e40af;"></i> Flota de Vehículos
        <span class="page-title-sub" style="color: #64748b; font-weight: 400;">Unidades de transporte, capacidades y estado operativo</span>
      </div>
    </div>

    <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; gap: 10px;">
        <button id="btn-veh-nuevo" class="btn-tms btn-tms-primary" style="border: 2px solid #1e40af; padding: 8px 16px; font-weight: 600; background: #1e40af; color: white;">
          <i class="bi bi-plus-circle"></i> Nuevo Vehículo
        </button>
        <button id="btn-veh-refresh" class="btn-tms btn-tms-default" style="border: 2px solid #e2e8f0; padding: 8px 14px; font-weight: 600;">
          <i class="bi bi-arrow-clockwise"></i> Actualizar
        </button>
        <button id="btn-veh-excel" class="btn-tms btn-tms-default" style="border: 2px solid #e2e8f0; padding: 8px 14px; font-weight: 600;">
          <i class="bi bi-file-earmark-excel"></i> Excel
        </button>
      </div>

      <div style="display: flex; align-items: center; gap: 8px;">
        <label style="color: #64748b; font-size: 13px; font-weight: 600;"><i class="bi bi-search"></i> Buscar:</label>
        <input type="text" id="search-vehiculos" style="border: 2px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; width: 280px; font-size: 13px;" placeholder="Placa, modelo, tipo...">
      </div>
    </div>

    <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <table class="tms-table" id="tabla-vehiculos" style="margin: 0;">
        <thead style="background: #f8fafc;">
          <tr>
            <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">ID</th>
            <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Placa</th>
            <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Modelo / Marca</th>
            <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Tipo de Unidad</th>
            <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Capacidad de Carga</th>
            <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Estado</th>
            <th class="no-export" style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; text-align: center;">Acciones</th>
          </tr>
        </thead>
        <tbody id="tbody-vehiculos">
          <tr><td colspan="7" style="text-align: center; padding: 40px 25px; color: #94a3b8;">Cargando flota...</td></tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top: 14px; padding: 0 4px; font-size: 13px; color: #64748b; font-weight: 600;" id="vehiculos-contador">
      Total de unidades: 0
    </div>

    <!-- Modal Nuevo / Editar Vehículo -->
    <div class="tms-modal-backdrop" id="modal-vehiculo">
      <div class="tms-modal-dialog" style="max-width: 550px;">
        <div class="tms-modal-header">
          <div class="tms-modal-title" id="modal-vehiculo-titulo">
            <i class="bi bi-truck"></i> Registrar Vehículo
          </div>
          <button class="tms-modal-close" id="btn-close-modal-vehiculo">&times;</button>
        </div>
        <form id="form-vehiculo">
          <input type="hidden" id="veh-id" name="id">
          <div class="tms-modal-body">
            <div class="form-grid">
              
              <!-- Datos del Vehículo -->
              <div class="col-12" style="margin-bottom: 8px;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                    <i class="bi bi-truck-flatbed" style="font-size: 16px;"></i>
                    <span>DATOS DEL VEHÍCULO</span>
                  </h4>
                </div>
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Placa de Rodaje *</label>
                <input type="text" id="veh-placa" class="form-control-tms" required placeholder="ABC-123" style="text-transform: uppercase; font-weight: 700; border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Modelo / Marca *</label>
                <input type="text" id="veh-modelo" class="form-control-tms" required placeholder="Ej: Volvo FH / Isuzu Forward" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <!-- Características Técnicas -->
              <div class="col-12" style="margin-bottom: 8px; margin-top: 20px;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                    <i class="bi bi-gear-fill" style="font-size: 16px;"></i>
                    <span>CARACTERÍSTICAS TÉCNICAS</span>
                  </h4>
                </div>
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Tipo de Unidad</label>
                <input type="text" id="veh-tipo" class="form-control-tms" placeholder="Furgón, Plataforma, Baranda" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Capacidad de Carga</label>
                <input type="text" id="veh-capacidad" class="form-control-tms" placeholder="Ej: 5 Toneladas / 30 m3" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <div class="col-12 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Estado Operativo</label>
                <select id="veh-estado" class="form-control-tms" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
                  <option value="activo">Activo / Operativo</option>
                  <option value="mantenimiento">En Mantenimiento</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

            </div>
          </div>
          <div class="tms-modal-footer">
            <button type="button" class="btn-tms btn-tms-default" id="btn-cancel-modal-vehiculo">Cancelar</button>
            <button type="submit" class="btn-tms btn-tms-primary" id="btn-guardar-vehiculo">
              <i class="bi bi-save"></i> Guardar Vehículo
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const tbody = document.getElementById('tbody-vehiculos');
  const searchInput = document.getElementById('search-vehiculos');
  const modal = document.getElementById('modal-vehiculo');
  const form = document.getElementById('form-vehiculo');

  async function loadVehiculos() {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #94a3b8;">Cargando vehículos...</td></tr>`;
    try {
      const res = await api.get('vehiculos/index.php');
      if (res.success) {
        vehiculosList = res.data || [];
        renderTable();
      }
    } catch (err) {
      showToast(err.message || 'Error al cargar vehículos', 'error');
    }
  }

  function renderTable() {
    const q = searchInput.value.toLowerCase().trim();
    const filtered = vehiculosList.filter(v => {
      if (!q) return true;
      const t = `${v.id} ${v.placa} ${v.modelo} ${v.tipo} ${v.capacidad} ${v.estado}`.toLowerCase();
      return t.includes(q);
    });

    document.getElementById('vehiculos-contador').textContent = `Total de vehículos: ${filtered.length}`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #64748b;">No hay vehículos registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(v => {
      let badgeEstado = '<span class="badge-status" style="background:#dcfce7; color:#15803d;">Activo</span>';
      if (v.estado === 'mantenimiento') {
        badgeEstado = '<span class="badge-status" style="background:#fef3c7; color:#92400e;">Mantenimiento</span>';
      } else if (v.estado === 'inactivo') {
        badgeEstado = '<span class="badge-status" style="background:#fee2e2; color:#991b1b;">Inactivo</span>';
      }

      return `
        <tr>
          <td><strong>#${v.id}</strong></td>
          <td><strong style="color: #1d4ed8; font-size: 13px; letter-spacing: 0.5px;">${v.placa}</strong></td>
          <td>${v.modelo || '-'}</td>
          <td><span class="badge-status" style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1;">${v.tipo || '-'}</span></td>
          <td>${v.capacidad || '-'}</td>
          <td>${badgeEstado}</td>
          <td class="no-export" style="text-align: center; white-space: nowrap;">
            <button class="btn-pill-action btn-pill-edit" data-action="edit" data-id="${v.id}" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-pill-action btn-pill-delete" data-action="delete" data-id="${v.id}" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', handleAction);
    });
  }

  async function handleAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'edit') {
      try {
        const res = await api.get('vehiculos/index.php', { action: 'get', id });
        if (res.success && res.data) {
          const v = res.data;
          document.getElementById('veh-id').value = v.id;
          document.getElementById('modal-vehiculo-titulo').innerHTML = `<i class="bi bi-pencil-square"></i> Editar Vehículo #${v.id}`;
          document.getElementById('veh-placa').value = v.placa || '';
          document.getElementById('veh-modelo').value = v.modelo || '';
          document.getElementById('veh-tipo').value = v.tipo || '';
          document.getElementById('veh-capacidad').value = v.capacidad || '';
          document.getElementById('veh-estado').value = v.estado || 'activo';
          modal.classList.add('show');
        }
      } catch (err) {
        showToast(err.message || 'Error al obtener vehículo', 'error');
      }
    } else if (action === 'delete') {
      if (confirm('¿Está seguro de eliminar este vehículo?')) {
        try {
          const res = await api.delete('vehiculos/eliminar.php', { id });
          if (res.success) {
            showToast('Vehículo eliminado', 'success');
            loadVehiculos();
          }
        } catch (err) {
          showToast(err.message || 'Error al eliminar', 'error');
        }
      }
    }
  }

  function openNewModal() {
    form.reset();
    document.getElementById('veh-id').value = '';
    document.getElementById('modal-vehiculo-titulo').innerHTML = `<i class="bi bi-truck"></i> Registrar Nuevo Vehículo`;
    modal.classList.add('show');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('veh-id').value;
    const isEdit = Boolean(id);

    const payload = {
      id: id || undefined,
      placa: document.getElementById('veh-placa').value.toUpperCase().trim(),
      modelo: document.getElementById('veh-modelo').value.trim(),
      tipo: document.getElementById('veh-tipo').value.trim(),
      capacidad: document.getElementById('veh-capacidad').value.trim(),
      estado: document.getElementById('veh-estado').value,
    };

    const btn = document.getElementById('btn-guardar-vehiculo');
    btn.disabled = true;

    try {
      let res;
      if (isEdit) {
        res = await api.post('vehiculos/actualizar.php', payload);
      } else {
        res = await api.post('vehiculos/guardar.php', payload);
      }

      if (res.success) {
        showToast(res.message || 'Vehículo guardado', 'success');
        modal.classList.remove('show');
        loadVehiculos();
      }
    } catch (err) {
      showToast(err.message || 'Error al guardar vehículo', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('btn-veh-nuevo').addEventListener('click', openNewModal);
  document.getElementById('btn-veh-refresh').addEventListener('click', () => {
    loadVehiculos();
    showToast('Flota actualizada', 'info');
  });
  document.getElementById('btn-close-modal-vehiculo').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('btn-cancel-modal-vehiculo').addEventListener('click', () => modal.classList.remove('show'));
  searchInput.addEventListener('input', renderTable);
  document.getElementById('btn-veh-excel').addEventListener('click', () => {
    exportTableToExcel('tabla-vehiculos', 'flota_vehiculos_vadexsa.csv');
  });

  await loadVehiculos();
}

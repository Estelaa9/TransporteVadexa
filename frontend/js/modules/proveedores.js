// frontend/js/modules/proveedores.js - Gestión de Proveedores Tercerizados
import { api, showToast, exportTableToExcel } from '../api.js';

export async function renderProveedores(container) {
  let proveedoresList = [];

  container.innerHTML = `
    <div class="page-title-box" style="background: white; padding: 20px 24px; border-bottom: 2px solid #e2e8f0; margin-bottom: 24px;">
      <div class="page-title-main">
        <i class="bi bi-box-seam-fill" style="color: #1e40af;"></i> Proveedores de Transporte
        <span class="page-title-sub" style="color: #64748b; font-weight: 400;">Gestión de empresas y unidades tercerizadas</span>
      </div>
    </div>

    <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; gap: 10px;">
        <button id="btn-prov-nuevo" class="btn-tms btn-tms-primary" style="border: 2px solid #1e40af; padding: 8px 16px; font-weight: 600; background: #1e40af; color: white;">
          <i class="bi bi-plus-circle"></i> Nuevo Proveedor
        </button>
        <button id="btn-prov-refresh" class="btn-tms btn-tms-default" style="border: 2px solid #e2e8f0; padding: 8px 14px; font-weight: 600;">
          <i class="bi bi-arrow-clockwise"></i> Actualizar
        </button>
        <button id="btn-prov-excel" class="btn-tms btn-tms-default" style="border: 2px solid #e2e8f0; padding: 8px 14px; font-weight: 600;">
          <i class="bi bi-file-earmark-excel"></i> Excel
        </button>
      </div>

      <div style="display: flex; align-items: center; gap: 8px;">
        <label style="color: #64748b; font-size: 13px; font-weight: 600;"><i class="bi bi-search"></i> Buscar:</label>
        <input type="text" id="search-proveedores" style="border: 2px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; width: 280px; font-size: 13px;" placeholder="Nombre, placa, teléfono...">
      </div>
    </div>

    <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <table class="tms-table" id="tabla-proveedores" style="margin: 0;">
        <thead style="background: #f8fafc;">
          <tr>
            <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">ID</th>
            <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Nombre / Empresa Proveedor</th>
            <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Teléfono de Contacto</th>
            <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Tipo / Modelo Vehículo</th>
            <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Placa de la Unidad</th>
            <th class="no-export" style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; text-align: center;">Acciones</th>
          </tr>
        </thead>
        <tbody id="tbody-proveedores">
          <tr><td colspan="6" style="text-align: center; padding: 40px 25px; color: #94a3b8;">Cargando proveedores...</td></tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top: 14px; padding: 0 4px; font-size: 13px; color: #64748b; font-weight: 600;" id="proveedores-contador">
      Total de proveedores: 0
    </div>

    <!-- Modal Nuevo / Editar Proveedor -->
    <div class="tms-modal-backdrop" id="modal-proveedor">
      <div class="tms-modal-dialog" style="max-width: 500px;">
        <div class="tms-modal-header">
          <div class="tms-modal-title" id="modal-proveedor-titulo">
            <i class="bi bi-box-seam"></i> Registrar Proveedor
          </div>
          <button class="tms-modal-close" id="btn-close-modal-proveedor">&times;</button>
        </div>
        <form id="form-proveedor">
          <input type="hidden" id="prov-id" name="id">
          <div class="tms-modal-body">
            <div class="form-grid">
              
              <!-- Datos del Proveedor -->
              <div class="col-12" style="margin-bottom: 8px;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                    <i class="bi bi-box-seam-fill" style="font-size: 16px;"></i>
                    <span>DATOS DEL PROVEEDOR</span>
                  </h4>
                </div>
              </div>

              <div class="col-12 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Nombre o Empresa Proveedor *</label>
                <input type="text" id="prov-nombre" class="form-control-tms" required placeholder="Ej: Transportes del Norte S.A.C." style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <div class="col-12 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Teléfono / Celular</label>
                <input type="text" id="prov-telefono" class="form-control-tms" placeholder="987654321" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <!-- Información del Vehículo -->
              <div class="col-12" style="margin-bottom: 8px; margin-top: 20px;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                    <i class="bi bi-truck-flatbed" style="font-size: 16px;"></i>
                    <span>INFORMACIÓN DEL VEHÍCULO</span>
                  </h4>
                </div>
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Vehículo / Capacidad</label>
                <input type="text" id="prov-vehiculo" class="form-control-tms" placeholder="Furgón 10 Ton" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Placa del Vehículo</label>
                <input type="text" id="prov-placa" class="form-control-tms" placeholder="XYZ-987" style="text-transform: uppercase; border: 2px solid #e2e8f0; padding: 10px 14px; background: #dbeafe;">
              </div>

            </div>
          </div>
          <div class="tms-modal-footer">
            <button type="button" class="btn-tms btn-tms-default" id="btn-cancel-modal-proveedor">Cancelar</button>
            <button type="submit" class="btn-tms btn-tms-primary" id="btn-guardar-proveedor">
              <i class="bi bi-save"></i> Guardar Proveedor
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const tbody = document.getElementById('tbody-proveedores');
  const searchInput = document.getElementById('search-proveedores');
  const modal = document.getElementById('modal-proveedor');
  const form = document.getElementById('form-proveedor');

  async function loadProveedores() {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 25px; color: #94a3b8;">Cargando proveedores...</td></tr>`;
    try {
      const res = await api.get('proveedores/index.php');
      if (res.success) {
        proveedoresList = res.data || [];
        renderTable();
      }
    } catch (err) {
      showToast(err.message || 'Error al cargar proveedores', 'error');
    }
  }

  function renderTable() {
    const q = searchInput.value.toLowerCase().trim();
    const filtered = proveedoresList.filter(p => {
      if (!q) return true;
      const t = `${p.id} ${p.nombre} ${p.telefono} ${p.vehiculo} ${p.placa}`.toLowerCase();
      return t.includes(q);
    });

    document.getElementById('proveedores-contador').textContent = `Total de proveedores: ${filtered.length}`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 25px; color: #64748b;">No hay proveedores registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td><strong>#${p.id}</strong></td>
        <td><strong style="color: #0f172a;">${p.nombre}</strong></td>
        <td>${p.telefono || '-'}</td>
        <td>${p.vehiculo || '-'}</td>
        <td><code>${p.placa || '-'}</code></td>
        <td class="no-export" style="text-align: center; white-space: nowrap;">
          <button class="btn-pill-action btn-pill-edit" data-action="edit" data-id="${p.id}" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn-pill-action btn-pill-delete" data-action="delete" data-id="${p.id}" title="Eliminar">
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

    if (action === 'edit') {
      try {
        const res = await api.get('proveedores/index.php', { action: 'get', id });
        if (res.success && res.data) {
          const p = res.data;
          document.getElementById('prov-id').value = p.id;
          document.getElementById('modal-proveedor-titulo').innerHTML = `<i class="bi bi-pencil-square"></i> Editar Proveedor #${p.id}`;
          document.getElementById('prov-nombre').value = p.nombre || '';
          document.getElementById('prov-telefono').value = p.telefono || '';
          document.getElementById('prov-vehiculo').value = p.vehiculo || '';
          document.getElementById('prov-placa').value = p.placa || '';
          modal.classList.add('show');
        }
      } catch (err) {
        showToast(err.message || 'Error al obtener proveedor', 'error');
      }
    } else if (action === 'delete') {
      if (confirm('¿Está seguro de eliminar este proveedor?')) {
        try {
          const res = await api.delete('proveedores/eliminar.php', { id });
          if (res.success) {
            showToast('Proveedor eliminado', 'success');
            loadProveedores();
          }
        } catch (err) {
          showToast(err.message || 'Error al eliminar', 'error');
        }
      }
    }
  }

  function openNewModal() {
    form.reset();
    document.getElementById('prov-id').value = '';
    document.getElementById('modal-proveedor-titulo').innerHTML = `<i class="bi bi-box-seam"></i> Registrar Nuevo Proveedor`;
    modal.classList.add('show');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prov-id').value;
    const isEdit = Boolean(id);

    const payload = {
      id: id || undefined,
      nombre: document.getElementById('prov-nombre').value.trim(),
      telefono: document.getElementById('prov-telefono').value.trim(),
      vehiculo: document.getElementById('prov-vehiculo').value.trim(),
      placa: document.getElementById('prov-placa').value.toUpperCase().trim(),
    };

    const btn = document.getElementById('btn-guardar-proveedor');
    btn.disabled = true;

    try {
      let res;
      if (isEdit) {
        res = await api.post('proveedores/actualizar.php', payload);
      } else {
        res = await api.post('proveedores/guardar.php', payload);
      }

      if (res.success) {
        showToast(res.message || 'Proveedor guardado', 'success');
        modal.classList.remove('show');
        loadProveedores();
      }
    } catch (err) {
      showToast(err.message || 'Error al guardar proveedor', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('btn-prov-nuevo').addEventListener('click', openNewModal);
  document.getElementById('btn-prov-refresh').addEventListener('click', () => {
    loadProveedores();
    showToast('Proveedores actualizados', 'info');
  });
  document.getElementById('btn-close-modal-proveedor').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('btn-cancel-modal-proveedor').addEventListener('click', () => modal.classList.remove('show'));
  searchInput.addEventListener('input', renderTable);
  document.getElementById('btn-prov-excel').addEventListener('click', () => {
    exportTableToExcel('tabla-proveedores', 'proveedores_transporte_vadexsa.csv');
  });

  await loadProveedores();
}

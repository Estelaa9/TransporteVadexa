// frontend/js/modules/conductores.js - Gestión de Conductores y Disponibilidad
import { api, showToast, exportTableToExcel } from '../api.js';

export async function renderConductores(container) {
  let conductoresList = [];

  container.innerHTML = `
    <div class="page-title-box">
      <div class="page-title-main">
        <i class="bi bi-person-badge-fill text-primary"></i> Conductores y Operadores
        <span class="page-title-sub">Personal de conducción, licencias de conducir y disponibilidad</span>
      </div>
    </div>

    <div class="tms-toolbar">
      <div class="toolbar-group-left">
        <button id="btn-cond-nuevo" class="btn-tms btn-tms-primary">
          <i class="bi bi-person-plus-fill"></i> Nuevo Conductor
        </button>
        <button id="btn-cond-refresh" class="btn-tms btn-tms-default">
          <i class="bi bi-arrow-clockwise"></i> Actualizar
        </button>
        <button id="btn-cond-excel" class="btn-tms btn-tms-default">
          <i class="bi bi-file-earmark-excel"></i> Excel
        </button>
      </div>

      <div class="toolbar-group-right">
        <div class="search-table-box">
          <label><i class="bi bi-search"></i> Buscar:</label>
          <input type="text" id="search-conductores" class="search-table-input" placeholder="Nombre, brevete, teléfono...">
        </div>
      </div>
    </div>

    <div class="tms-table-container">
      <table class="tms-table" id="tabla-conductores">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre Completo</th>
            <th>N° Licencia / Brevete</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Estado</th>
            <th class="no-export" style="text-align: center;">Acciones</th>
          </tr>
        </thead>
        <tbody id="tbody-conductores">
          <tr><td colspan="7" style="text-align: center; padding: 25px; color: #94a3b8;">Cargando conductores...</td></tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top: 10px; font-size: 12px; color: #64748b;" id="conductores-contador">
      Total de conductores: 0
    </div>

    <!-- Modal Nuevo / Editar Conductor -->
    <div class="tms-modal-backdrop" id="modal-conductor">
      <div class="tms-modal-dialog" style="max-width: 550px;">
        <div class="tms-modal-header">
          <div class="tms-modal-title" id="modal-conductor-titulo">
            <i class="bi bi-person-badge"></i> Registrar Conductor
          </div>
          <button class="tms-modal-close" id="btn-close-modal-conductor">&times;</button>
        </div>
        <form id="form-conductor">
          <input type="hidden" id="cond-id" name="id">
          <div class="tms-modal-body">
            <div class="form-grid">
              
              <!-- Datos Personales -->
              <div class="col-12" style="margin-bottom: 8px;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                    <i class="bi bi-person-badge-fill" style="font-size: 16px;"></i>
                    <span>DATOS PERSONALES</span>
                  </h4>
                </div>
              </div>

              <div class="col-12 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Nombre Completo *</label>
                <input type="text" id="cond-nombre" class="form-control-tms" required placeholder="Nombres y Apellidos" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">N° Licencia de Conducir (Brevete) *</label>
                <input type="text" id="cond-licencia" class="form-control-tms" required placeholder="Ej: Q12345678" style="text-transform: uppercase; border: 2px solid #e2e8f0; padding: 10px 14px; background: #dbeafe;">
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Teléfono / Celular</label>
                <input type="text" id="cond-telefono" class="form-control-tms" placeholder="987654321" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <!-- Información de Contacto -->
              <div class="col-12" style="margin-bottom: 8px; margin-top: 20px;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                    <i class="bi bi-geo-alt-fill" style="font-size: 16px;"></i>
                    <span>INFORMACIÓN DE CONTACTO</span>
                  </h4>
                </div>
              </div>

              <div class="col-8 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Dirección</label>
                <input type="text" id="cond-direccion" class="form-control-tms" placeholder="Domicilio del conductor" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <div class="col-4 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Estado</label>
                <select id="cond-estado" class="form-control-tms" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
                  <option value="activo">Activo</option>
                  <option value="descanso">En Descanso</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

            </div>
          </div>
          <div class="tms-modal-footer">
            <button type="button" class="btn-tms btn-tms-default" id="btn-cancel-modal-conductor">Cancelar</button>
            <button type="submit" class="btn-tms btn-tms-primary" id="btn-guardar-conductor">
              <i class="bi bi-save"></i> Guardar Conductor
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const tbody = document.getElementById('tbody-conductores');
  const searchInput = document.getElementById('search-conductores');
  const modal = document.getElementById('modal-conductor');
  const form = document.getElementById('form-conductor');

  async function loadConductores() {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #94a3b8;">Cargando conductores...</td></tr>`;
    try {
      const res = await api.get('conductores/index.php');
      if (res.success) {
        conductoresList = res.data || [];
        renderTable();
      }
    } catch (err) {
      showToast(err.message || 'Error al cargar conductores', 'error');
    }
  }

  function renderTable() {
    const q = searchInput.value.toLowerCase().trim();
    const filtered = conductoresList.filter(c => {
      if (!q) return true;
      const t = `${c.id} ${c.nombre} ${c.licencia} ${c.telefono} ${c.direccion} ${c.estado}`.toLowerCase();
      return t.includes(q);
    });

    document.getElementById('conductores-contador').textContent = `Total de conductores: ${filtered.length}`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #64748b;">No hay conductores registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(c => `
      <tr>
        <td><strong>#${c.id}</strong></td>
        <td><strong style="color: #0f172a;">${c.nombre}</strong></td>
        <td><code>${c.licencia || '-'}</code></td>
        <td>${c.telefono || '-'}</td>
        <td><small style="color: #64748b;">${c.direccion || '-'}</small></td>
        <td><span class="badge-status" style="background: ${c.estado === 'activo' ? '#dcfce7' : '#fee2e2'}; color: ${c.estado === 'activo' ? '#15803d' : '#991b1b'};">${c.estado || 'activo'}</span></td>
        <td class="no-export" style="text-align: center; white-space: nowrap;">
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

    if (action === 'edit') {
      try {
        const res = await api.get('conductores/index.php', { action: 'get', id });
        if (res.success && res.data) {
          const c = res.data;
          document.getElementById('cond-id').value = c.id;
          document.getElementById('modal-conductor-titulo').innerHTML = `<i class="bi bi-pencil-square"></i> Editar Conductor #${c.id}`;
          document.getElementById('cond-nombre').value = c.nombre || '';
          document.getElementById('cond-licencia').value = c.licencia || '';
          document.getElementById('cond-telefono').value = c.telefono || '';
          document.getElementById('cond-direccion').value = c.direccion || '';
          document.getElementById('cond-estado').value = c.estado || 'activo';
          modal.classList.add('show');
        }
      } catch (err) {
        showToast(err.message || 'Error al obtener conductor', 'error');
      }
    } else if (action === 'delete') {
      if (confirm('¿Está seguro de eliminar este conductor?')) {
        try {
          const res = await api.delete('conductores/eliminar.php', { id });
          if (res.success) {
            showToast('Conductor eliminado', 'success');
            loadConductores();
          }
        } catch (err) {
          showToast(err.message || 'Error al eliminar', 'error');
        }
      }
    }
  }

  function openNewModal() {
    form.reset();
    document.getElementById('cond-id').value = '';
    document.getElementById('modal-conductor-titulo').innerHTML = `<i class="bi bi-person-badge"></i> Registrar Nuevo Conductor`;
    modal.classList.add('show');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('cond-id').value;
    const isEdit = Boolean(id);

    const payload = {
      id: id || undefined,
      nombre: document.getElementById('cond-nombre').value.trim(),
      licencia: document.getElementById('cond-licencia').value.toUpperCase().trim(),
      telefono: document.getElementById('cond-telefono').value.trim(),
      direccion: document.getElementById('cond-direccion').value.trim(),
      estado: document.getElementById('cond-estado').value,
    };

    const btn = document.getElementById('btn-guardar-conductor');
    btn.disabled = true;

    try {
      let res;
      if (isEdit) {
        res = await api.post('conductores/actualizar.php', payload);
      } else {
        res = await api.post('conductores/guardar.php', payload);
      }

      if (res.success) {
        showToast(res.message || 'Conductor guardado', 'success');
        modal.classList.remove('show');
        loadConductores();
      }
    } catch (err) {
      showToast(err.message || 'Error al guardar conductor', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('btn-cond-nuevo').addEventListener('click', openNewModal);
  document.getElementById('btn-cond-refresh').addEventListener('click', () => {
    loadConductores();
    showToast('Conductores actualizados', 'info');
  });
  document.getElementById('btn-close-modal-conductor').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('btn-cancel-modal-conductor').addEventListener('click', () => modal.classList.remove('show'));
  searchInput.addEventListener('input', renderTable);
  document.getElementById('btn-cond-excel').addEventListener('click', () => {
    exportTableToExcel('tabla-conductores', 'conductores_vadexsa.csv');
  });

  await loadConductores();
}

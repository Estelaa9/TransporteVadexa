// frontend/js/modules/gastos.js - Control de Gastos Operativos y Administrativos
import { api, showToast, fmt, exportTableToExcel } from '../api.js';

export async function renderGastos(container, tipoInicial = 'operativos') {
  let currentTab = tipoInicial; // 'operativos' o 'administrativos'
  const now = new Date();
  let currentMonth = now.getMonth() + 1;
  let currentYear = now.getFullYear();
  let vehiculosList = [];

  container.innerHTML = `
    <div class="page-title-box">
      <div class="page-title-main">
        <i class="bi bi-wallet2 text-primary"></i> Control de Gastos
        <span class="page-title-sub">Gestión de egresos operativos (flota) y administrativos</span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <select id="gastos-mes" class="form-control-tms" style="width: 130px;">
          <option value="">Todos los meses</option>
          ${[
            [1, 'Enero'], [2, 'Febrero'], [3, 'Marzo'], [4, 'Abril'],
            [5, 'Mayo'], [6, 'Junio'], [7, 'Julio'], [8, 'Agosto'],
            [9, 'Septiembre'], [10, 'Octubre'], [11, 'Noviembre'], [12, 'Diciembre']
          ].map(([m, nombre]) => `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>${nombre}</option>`).join('')}
        </select>
        <select id="gastos-anio" class="form-control-tms" style="width: 90px;">
          <option value="">Todos</option>
          ${[currentYear - 1, currentYear, currentYear + 1].map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
        <button id="btn-gastos-refresh" class="btn-tms btn-tms-default"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
    </div>

    <!-- Pestañas -->
    <div class="tms-tabs">
      <button class="tms-tab-btn ${currentTab === 'operativos' ? 'active' : ''}" id="tab-gastos-op" data-tab="operativos">
        <i class="bi bi-fuel-pump-fill"></i> Gastos Operativos (Flota)
      </button>
      <button class="tms-tab-btn ${currentTab === 'administrativos' ? 'active' : ''}" id="tab-gastos-admin" data-tab="administrativos">
        <i class="bi bi-building-fill"></i> Gastos Administrativos
      </button>
    </div>

    <!-- Toolbar -->
    <div class="tms-toolbar">
      <div class="toolbar-group-left">
        <button id="btn-gasto-nuevo" class="btn-tms btn-tms-primary">
          <i class="bi bi-plus-circle"></i> Nuevo Gasto
        </button>
        <button id="btn-gastos-excel" class="btn-tms btn-tms-default">
          <i class="bi bi-file-earmark-excel"></i> Excel
        </button>
      </div>

      <div class="toolbar-group-right">
        <div class="search-table-box">
          <label><i class="bi bi-search"></i> Buscar:</label>
          <input type="text" id="search-gastos" class="search-table-input" placeholder="Descripción, vehículo, tipo...">
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="tms-table-container">
      <table class="tms-table" id="tabla-gastos">
        <thead id="thead-gastos"></thead>
        <tbody id="tbody-gastos">
          <tr><td colspan="6" style="text-align: center; padding: 25px; color: #94a3b8;">Cargando gastos...</td></tr>
        </tbody>
      </table>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 12px; color: #64748b;">
      <div id="gastos-contador">Total de registros: 0</div>
      <div id="gastos-total-monto" style="font-weight: 700; color: #dc2626; font-size: 13.5px;">Suma Gastos: S/ 0.00</div>
    </div>

    <!-- Modal Nuevo / Editar Gasto Operativo -->
    <div class="tms-modal-backdrop" id="modal-gasto-op">
      <div class="tms-modal-dialog" style="max-width: 550px;">
        <div class="tms-modal-header">
          <div class="tms-modal-title" id="modal-gasto-op-titulo">
            <i class="bi bi-fuel-pump"></i> Registrar Gasto Operativo
          </div>
          <button class="tms-modal-close" id="btn-close-modal-gasto-op">&times;</button>
        </div>
        <form id="form-gasto-op">
          <input type="hidden" id="gop-id" name="id">
          <div class="tms-modal-body">
            <div class="form-grid">
              
              <!-- Información del Gasto -->
              <div class="col-12" style="margin-bottom: 8px;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                    <i class="bi bi-fuel-pump-fill" style="font-size: 16px;"></i>
                    <span>INFORMACIÓN DEL GASTO</span>
                  </h4>
                </div>
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Fecha *</label>
                <input type="date" id="gop-fecha" class="form-control-tms" required style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Vehículo Vinculado *</label>
                <select id="gop-vehiculo" class="form-control-tms" required style="border: 2px solid #e2e8f0; padding: 10px 14px; background: #dbeafe;">
                  <option value="">Seleccione vehículo</option>
                </select>
              </div>

              <!-- Detalle del Gasto -->
              <div class="col-12" style="margin-bottom: 8px; margin-top: 20px;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                    <i class="bi bi-receipt" style="font-size: 16px;"></i>
                    <span>DETALLE DEL GASTO</span>
                  </h4>
                </div>
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Tipo de Gasto *</label>
                <select id="gop-tipo" class="form-control-tms" required style="border: 2px solid #e2e8f0; padding: 10px 14px;">
                  <option value="Combustible">Combustible / Petróleo</option>
                  <option value="Peaje">Peajes</option>
                  <option value="Mantenimiento">Mantenimiento Mecánico</option>
                  <option value="Llantas">Llantas / Neumáticos</option>
                  <option value="Lavado">Lavado / Limpieza</option>
                  <option value="Cochera">Cochera / Parqueo</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Monto (S/) *</label>
                <input type="number" step="0.01" id="gop-monto" class="form-control-tms" placeholder="0.00" required style="font-weight: 700; color: #dc2626; border: 2px solid #e2e8f0; padding: 10px 14px; background: #fee2e2;">
              </div>

              <div class="col-12 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Descripción / Detalle</label>
                <input type="text" id="gop-descripcion" class="form-control-tms" placeholder="Detalle del gasto o estación de servicio" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

            </div>
          </div>
          <div class="tms-modal-footer">
            <button type="button" class="btn-tms btn-tms-default" id="btn-cancel-modal-gasto-op">Cancelar</button>
            <button type="submit" class="btn-tms btn-tms-primary" id="btn-guardar-gasto-op">
              <i class="bi bi-save"></i> Guardar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Nuevo / Editar Gasto Administrativo -->
    <div class="tms-modal-backdrop" id="modal-gasto-admin">
      <div class="tms-modal-dialog" style="max-width: 550px;">
        <div class="tms-modal-header">
          <div class="tms-modal-title" id="modal-gasto-admin-titulo">
            <i class="bi bi-building"></i> Registrar Gasto Administrativo
          </div>
          <button class="tms-modal-close" id="btn-close-modal-gasto-admin">&times;</button>
        </div>
        <form id="form-gasto-admin">
          <input type="hidden" id="gad-id" name="id">
          <div class="tms-modal-body">
            <div class="form-grid">
              
              <!-- Información del Gasto -->
              <div class="col-12" style="margin-bottom: 8px;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                    <i class="bi bi-building-fill" style="font-size: 16px;"></i>
                    <span>INFORMACIÓN DEL GASTO</span>
                  </h4>
                </div>
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Fecha *</label>
                <input type="date" id="gad-fecha" class="form-control-tms" required style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Tipo de Gasto *</label>
                <select id="gad-tipo" class="form-control-tms" required style="border: 2px solid #e2e8f0; padding: 10px 14px;">
                  <option value="Sueldos">Sueldos y Planilla</option>
                  <option value="Alquiler">Alquiler de Oficina / Local</option>
                  <option value="Servicios Básicos">Servicios Básicos (Luz, Agua, Internet)</option>
                  <option value="Útiles de Oficina">Útiles de Oficina</option>
                  <option value="Contabilidad">Asesoría Contable / Legal</option>
                  <option value="Publicidad">Marketing y Publicidad</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <!-- Detalle del Gasto -->
              <div class="col-12" style="margin-bottom: 8px; margin-top: 20px;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                    <i class="bi bi-receipt" style="font-size: 16px;"></i>
                    <span>DETALLE DEL GASTO</span>
                  </h4>
                </div>
              </div>

              <div class="col-12 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Descripción *</label>
                <input type="text" id="gad-descripcion" class="form-control-tms" required placeholder="Concepto del gasto" style="border: 2px solid #e2e8f0; padding: 10px 14px;">
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Monto (S/) *</label>
                <input type="number" step="0.01" id="gad-monto" class="form-control-tms" placeholder="0.00" required style="font-weight: 700; color: #dc2626; border: 2px solid #e2e8f0; padding: 10px 14px; background: #fee2e2;">
              </div>

            </div>
          </div>
          <div class="tms-modal-footer">
            <button type="button" class="btn-tms btn-tms-default" id="btn-cancel-modal-gasto-admin">Cancelar</button>
            <button type="submit" class="btn-tms btn-tms-primary" id="btn-guardar-gasto-admin">
              <i class="bi bi-save"></i> Guardar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const thead = document.getElementById('thead-gastos');
  const tbody = document.getElementById('tbody-gastos');
  const searchInput = document.getElementById('search-gastos');
  const mesSelect = document.getElementById('gastos-mes');
  const anioSelect = document.getElementById('gastos-anio');
  const modalOp = document.getElementById('modal-gasto-op');
  const modalAdmin = document.getElementById('modal-gasto-admin');
  const formOp = document.getElementById('form-gasto-op');
  const formAdmin = document.getElementById('form-gasto-admin');

  let gastosList = [];

  async function loadVehiculos() {
    try {
      const res = await api.get('vehiculos/index.php');
      vehiculosList = res.data || [];
      const sel = document.getElementById('gop-vehiculo');
      sel.innerHTML = '<option value="">Seleccione vehículo</option>' +
        vehiculosList.map(v => `<option value="${v.id}">${v.placa} - ${v.modelo || v.tipo}</option>`).join('');
    } catch (e) {}
  }

  async function loadGastos() {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #94a3b8;">Cargando gastos...</td></tr>`;
    const mes = mesSelect.value;
    const anio = anioSelect.value;

    try {
      const endpoint = currentTab === 'operativos' ? 'gastos_operativos/index.php' : 'gastos_administrativos/index.php';
      const res = await api.get(endpoint, { mes, anio });
      if (res.success) {
        gastosList = res.data || [];
        renderTable();
      }
    } catch (err) {
      showToast(err.message || 'Error al cargar gastos', 'error');
    }
  }

  function renderTable() {
    const q = searchInput.value.toLowerCase().trim();
    
    if (currentTab === 'operativos') {
      thead.innerHTML = `
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Vehículo (Placa)</th>
          <th>Tipo de Gasto</th>
          <th>Descripción</th>
          <th style="text-align: right;">Monto (S/)</th>
          <th class="no-export" style="text-align: center;">Acciones</th>
        </tr>
      `;

      const filtered = gastosList.filter(g => {
        if (!q) return true;
        return `${g.id} ${g.fecha} ${g.placa} ${g.tipo} ${g.descripcion} ${g.monto}`.toLowerCase().includes(q);
      });

      const total = filtered.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
      document.getElementById('gastos-contador').textContent = `Mostrando ${filtered.length} gastos operativos`;
      document.getElementById('gastos-total-monto').textContent = `Total Operativos: ${fmt.moneda(total)}`;

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #64748b;">No hay gastos operativos registrados en este periodo.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(g => `
        <tr>
          <td><strong>#${g.id}</strong></td>
          <td>${fmt.fecha(g.fecha)}</td>
          <td><strong style="color: #1d4ed8;">${g.placa || 'Vehículo #' + g.vehiculo_id}</strong></td>
          <td><span class="badge-status" style="background:#fff1f2; color:#be123c; border:1px solid #fecdd3;">${g.tipo || '-'}</span></td>
          <td>${g.descripcion || '-'}</td>
          <td style="text-align: right; font-weight: 700; color: #dc2626;">${fmt.moneda(g.monto)}</td>
          <td class="no-export" style="text-align: center; white-space: nowrap;">
            <button class="btn-pill-action btn-pill-edit" data-action="edit" data-id="${g.id}" title="Editar"><i class="bi bi-pencil"></i></button>
            <button class="btn-pill-action btn-pill-delete" data-action="delete" data-id="${g.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `).join('');

    } else {
      thead.innerHTML = `
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Tipo de Gasto</th>
          <th>Descripción</th>
          <th style="text-align: right;">Monto (S/)</th>
          <th class="no-export" style="text-align: center;">Acciones</th>
        </tr>
      `;

      const filtered = gastosList.filter(g => {
        if (!q) return true;
        return `${g.id} ${g.fecha} ${g.tipo} ${g.descripcion} ${g.monto}`.toLowerCase().includes(q);
      });

      const total = filtered.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
      document.getElementById('gastos-contador').textContent = `Mostrando ${filtered.length} gastos administrativos`;
      document.getElementById('gastos-total-monto').textContent = `Total Administrativos: ${fmt.moneda(total)}`;

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 25px; color: #64748b;">No hay gastos administrativos registrados en este periodo.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(g => `
        <tr>
          <td><strong>#${g.id}</strong></td>
          <td>${fmt.fecha(g.fecha)}</td>
          <td><span class="badge-status" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a;">${g.tipo || '-'}</span></td>
          <td>${g.descripcion || '-'}</td>
          <td style="text-align: right; font-weight: 700; color: #dc2626;">${fmt.moneda(g.monto)}</td>
          <td class="no-export" style="text-align: center; white-space: nowrap;">
            <button class="btn-pill-action btn-pill-edit" data-action="edit" data-id="${g.id}" title="Editar"><i class="bi bi-pencil"></i></button>
            <button class="btn-pill-action btn-pill-delete" data-action="delete" data-id="${g.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `).join('');
    }

    tbody.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', handleAction);
    });
  }

  async function handleAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const folder = currentTab === 'operativos' ? 'gastos_operativos' : 'gastos_administrativos';

    if (action === 'edit') {
      try {
        const res = await api.get(`${folder}/index.php`, { action: 'get', id });
        if (res.success && res.data) {
          const g = res.data;
          if (currentTab === 'operativos') {
            document.getElementById('gop-id').value = g.id;
            document.getElementById('modal-gasto-op-titulo').innerHTML = `<i class="bi bi-pencil-square"></i> Editar Gasto Operativo #${g.id}`;
            document.getElementById('gop-fecha').value = g.fecha || '';
            document.getElementById('gop-vehiculo').value = g.vehiculo_id || '';
            document.getElementById('gop-tipo').value = g.tipo || 'Combustible';
            document.getElementById('gop-descripcion').value = g.descripcion || '';
            document.getElementById('gop-monto').value = g.monto || '';
            modalOp.classList.add('show');
          } else {
            document.getElementById('gad-id').value = g.id;
            document.getElementById('modal-gasto-admin-titulo').innerHTML = `<i class="bi bi-pencil-square"></i> Editar Gasto Administrativo #${g.id}`;
            document.getElementById('gad-fecha').value = g.fecha || '';
            document.getElementById('gad-tipo').value = g.tipo || 'Sueldos';
            document.getElementById('gad-descripcion').value = g.descripcion || '';
            document.getElementById('gad-monto').value = g.monto || '';
            modalAdmin.classList.add('show');
          }
        }
      } catch (err) {
        showToast(err.message || 'Error al obtener gasto', 'error');
      }
    } else if (action === 'delete') {
      if (confirm('¿Está seguro de eliminar este gasto?')) {
        try {
          const res = await api.delete(`${folder}/eliminar.php`, { id });
          if (res.success) {
            showToast('Gasto eliminado', 'success');
            loadGastos();
          }
        } catch (err) {
          showToast(err.message || 'Error al eliminar gasto', 'error');
        }
      }
    }
  }

  function openNewModal() {
    if (currentTab === 'operativos') {
      formOp.reset();
      document.getElementById('gop-id').value = '';
      document.getElementById('modal-gasto-op-titulo').innerHTML = `<i class="bi bi-fuel-pump"></i> Registrar Gasto Operativo`;
      document.getElementById('gop-fecha').value = new Date().toISOString().split('T')[0];
      modalOp.classList.add('show');
    } else {
      formAdmin.reset();
      document.getElementById('gad-id').value = '';
      document.getElementById('modal-gasto-admin-titulo').innerHTML = `<i class="bi bi-building"></i> Registrar Gasto Administrativo`;
      document.getElementById('gad-fecha').value = new Date().toISOString().split('T')[0];
      modalAdmin.classList.add('show');
    }
  }

  formOp.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('gop-id').value;
    const isEdit = Boolean(id);

    const payload = {
      id: id || undefined,
      fecha: document.getElementById('gop-fecha').value,
      vehiculo_id: document.getElementById('gop-vehiculo').value,
      tipo: document.getElementById('gop-tipo').value,
      descripcion: document.getElementById('gop-descripcion').value,
      monto: document.getElementById('gop-monto').value,
    };

    const btn = document.getElementById('btn-guardar-gasto-op');
    btn.disabled = true;

    try {
      let res;
      if (isEdit) {
        res = await api.post('gastos_operativos/actualizar.php', payload);
      } else {
        res = await api.post('gastos_operativos/guardar.php', payload);
      }
      if (res.success) {
        showToast(res.message || 'Gasto guardado', 'success');
        modalOp.classList.remove('show');
        loadGastos();
      }
    } catch (err) {
      showToast(err.message || 'Error al guardar gasto operativo', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  formAdmin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('gad-id').value;
    const isEdit = Boolean(id);

    const payload = {
      id: id || undefined,
      fecha: document.getElementById('gad-fecha').value,
      tipo: document.getElementById('gad-tipo').value,
      descripcion: document.getElementById('gad-descripcion').value,
      monto: document.getElementById('gad-monto').value,
    };

    const btn = document.getElementById('btn-guardar-gasto-admin');
    btn.disabled = true;

    try {
      let res;
      if (isEdit) {
        res = await api.post('gastos_administrativos/actualizar.php', payload);
      } else {
        res = await api.post('gastos_administrativos/guardar.php', payload);
      }
      if (res.success) {
        showToast(res.message || 'Gasto guardado', 'success');
        modalAdmin.classList.remove('show');
        loadGastos();
      }
    } catch (err) {
      showToast(err.message || 'Error al guardar gasto administrativo', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('tab-gastos-op').addEventListener('click', (e) => {
    document.querySelectorAll('.tms-tab-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentTab = 'operativos';
    loadGastos();
  });

  document.getElementById('tab-gastos-admin').addEventListener('click', (e) => {
    document.querySelectorAll('.tms-tab-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentTab = 'administrativos';
    loadGastos();
  });

  document.getElementById('btn-gasto-nuevo').addEventListener('click', openNewModal);
  document.getElementById('btn-gastos-refresh').addEventListener('click', () => {
    loadGastos();
    showToast('Gastos actualizados', 'info');
  });
  document.getElementById('btn-close-modal-gasto-op').addEventListener('click', () => modalOp.classList.remove('show'));
  document.getElementById('btn-cancel-modal-gasto-op').addEventListener('click', () => modalOp.classList.remove('show'));
  document.getElementById('btn-close-modal-gasto-admin').addEventListener('click', () => modalAdmin.classList.remove('show'));
  document.getElementById('btn-cancel-modal-gasto-admin').addEventListener('click', () => modalAdmin.classList.remove('show'));
  mesSelect.addEventListener('change', loadGastos);
  anioSelect.addEventListener('change', loadGastos);
  searchInput.addEventListener('input', renderTable);
  document.getElementById('btn-gastos-excel').addEventListener('click', () => {
    exportTableToExcel('tabla-gastos', `gastos_${currentTab}_vadexsa.csv`);
  });

  await loadVehiculos();
  await loadGastos();
}

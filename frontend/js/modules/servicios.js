// frontend/js/modules/servicios.js - Gestión integral de Servicios y Liquidaciones
import { api, showToast, fmt, exportTableToExcel, esc } from '../api.js';
import { auth } from './auth.js';

export async function renderServicios(container) {
  let allServicios = [];
  let currentTab = 'sin_liquidar'; // 'sin_liquidar' o 'liquidaciones'
  let clientesList = [];
  let vehiculosList = [];
  let conductoresList = [];
  let proveedoresList = [];
  let editingVersion = null;
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

    <!-- Modal para Crear / Editar Servicio -->
    <div class="tms-modal-backdrop" id="modal-servicio">
      <div class="tms-modal-dialog" style="max-width: 850px;">
        <div class="tms-modal-header">
          <div class="tms-modal-title" id="modal-servicio-titulo">
            <i class="bi bi-truck"></i> Registrar Nuevo Servicio
          </div>
          <button class="tms-modal-close" id="btn-close-modal-servicio">&times;</button>
        </div>
        <form id="form-servicio" novalidate>
          <input type="hidden" id="srv-id" name="id">
          <div class="srv-wizard-progress" id="srv-wizard-progress" aria-label="Pasos del registro de servicio">
            <div class="srv-wizard-step active" data-step-indicator="1"><span>1</span><strong>Cliente</strong></div>
            <div class="srv-wizard-step" data-step-indicator="2"><span>2</span><strong>Modalidad</strong></div>
            <div class="srv-wizard-step" data-step-indicator="3"><span>3</span><strong>Asignación</strong></div>
            <div class="srv-wizard-step" data-step-indicator="4"><span>4</span><strong>Confirmación</strong></div>
          </div>
          <div class="tms-modal-body">
            <p id="srv-wizard-help" class="srv-wizard-help" role="status"></p>
            <div id="srv-wizard-review" class="srv-wizard-review" hidden></div>
            <div class="form-grid">
              
              <div class="col-3 form-group">
                <label class="form-label">Fecha del Servicio *</label>
                <input type="date" id="srv-fecha" name="fecha_servicio" class="form-control-tms" required>
              </div>

              <div class="col-3 form-group">
                <label class="form-label">Hora de inicio *</label>
                <input type="time" id="srv-hora" name="hora_servicio" class="form-control-tms" required>
              </div>

              <div class="col-3 form-group">
                <label class="form-label">Hora fin estimada *</label>
                <input type="time" id="srv-hora-fin" name="hora_fin_estimada" class="form-control-tms" required>
                <small class="muted">Si es menor que el inicio, el viaje termina al día siguiente.</small>
              </div>

              <div class="col-6 form-group">
                <label class="form-label">Cliente *</label>
                <select id="srv-cliente" name="cliente_id" class="form-control-tms" required>
                  <option value="">Seleccione un cliente</option>
                </select>
              </div>

              <div class="col-6 form-group">
                <label class="form-label">Vehículo *</label>
                <select id="srv-vehiculo" name="vehiculo_id" class="form-control-tms" required>
                  <option value="">Seleccione un vehículo</option>
                </select>
              </div>

              <div class="col-6 form-group">
                <label class="form-label">Conductor *</label>
                <select id="srv-conductor" name="conductor_id" class="form-control-tms" required>
                  <option value="">Seleccione un conductor</option>
                </select>
              </div>

              <div class="col-6 form-group">
                <label class="form-label">Proveedor (servicio tercerizado) *</label>
                <select id="srv-proveedor" name="proveedor_id" class="form-control-tms">
                  <option value="">Seleccione un proveedor</option>
                </select>
              </div>

              <div class="col-6 form-group">
                <label class="form-label">Costo del proveedor sin IGV (S/) *</label>
                <input type="number" step="0.01" min="0" id="srv-costo-proveedor" name="costo_proveedor" class="form-control-tms" placeholder="0.00">
              </div>

              <div class="col-3 form-group">
                <label class="form-label">Tipo Servicio</label>
                <select id="srv-tipo-servicio" name="tipo_servicio" class="form-control-tms">
                  <option value="Local">Local</option>
                  <option value="Provincia">Provincia</option>
                  <option value="Mudanza">Mudanza</option>
                  <option value="Distribución">Distribución</option>
                  <option value="Especial">Especial</option>
                </select>
              </div>

              <div class="col-3 form-group">
                <label class="form-label">Tipo Carga</label>
                <select id="srv-tipo-carga" name="tipo_carga" class="form-control-tms">
                  <option value="General">General</option>
                  <option value="Frágil">Frágil</option>
                  <option value="Refrigerada">Refrigerada</option>
                  <option value="Maquinaria">Maquinaria</option>
                  <option value="Enseres">Enseres / Muebles</option>
                </select>
              </div>

              <div class="col-3 form-group">
                <label class="form-label">Modalidad *</label>
                <select id="srv-modalidad" name="modalidad" class="form-control-tms" required>
                  <option value="propio">Propio (Flota)</option>
                  <option value="tercerizado">Tercerizado</option>
                </select>
              </div>

              <div class="col-3 form-group">
                <label class="form-label">Forma de Pago</label>
                <select id="srv-forma-pago" name="forma_pago" class="form-control-tms">
                  <option value="Contado">Contado</option>
                  <option value="Crédito 15 días">Crédito 15 días</option>
                  <option value="Crédito 30 días">Crédito 30 días</option>
                  <option value="Contra entrega">Contra entrega</option>
                </select>
              </div>

              <div class="col-6 form-group">
                <label class="form-label">Origen *</label>
                <input type="text" id="srv-origen" name="origen" class="form-control-tms" placeholder="Dirección / Almacén Origen" required>
              </div>

              <div class="col-6 form-group">
                <label class="form-label">Destino *</label>
                <input type="text" id="srv-destino" name="destino" class="form-control-tms" placeholder="Dirección Destino" required>
              </div>

              <div class="col-4 form-group">
                <label class="form-label">Precio Cliente (S/) *</label>
                <input type="number" step="0.01" min="0.01" id="srv-precio-cliente" name="precio_cliente" class="form-control-tms" placeholder="0.00" required style="font-weight: 700; color: #1e293b;">
              </div>


              <div class="col-4 form-group">
                <label class="form-label">Comprobante a emitir *</label>
                <select id="srv-tipo-comprobante" name="tipo_comprobante" class="form-control-tms">
                  <option value="FACTURA">FACTURA</option>
                  <option value="BOLETA">BOLETA</option>
                  <option value="SIN_COMPROBANTE">SIN COMPROBANTE</option>
                </select>
              </div>

              <div class="col-4 form-group">
                <label class="form-label">Base Imponible (S/)</label>
                <input type="text" id="srv-base" name="base_imponible" class="form-control-tms" readonly>
              </div>

              <div class="col-4 form-group">
                <label class="form-label">IGV (18%)</label>
                <input type="text" id="srv-igv" name="igv" class="form-control-tms" readonly>
              </div>

              <div class="col-4 form-group">
                <label class="form-label">Peso de la carga (kg)</label>
                <input type="number" step="0.01" min="0" id="srv-peso" name="peso_kg" class="form-control-tms" placeholder="Opcional">
              </div>

              <div class="col-12 form-group">
                <small class="muted" id="srv-nota-comprobante">El comprobante se registra en Facturación cuando el servicio finaliza. Montos calculados en el servidor.</small>
              </div>

              <div class="col-4 form-group">
                <label class="form-label">Guía Remitente</label>
                <input type="text" id="srv-guia-rem" name="guia_remitente" class="form-control-tms" placeholder="T001-XXXXXX">
              </div>

              <div class="col-4 form-group">
                <label class="form-label">Guía Transportista</label>
                <input type="text" id="srv-guia-trans" name="guia_transportista" class="form-control-tms" placeholder="GRT-XXXXXX" readonly>
              </div>

              <div class="col-4 form-group">
                <label class="form-label">Estado del Servicio *</label>
                <select id="srv-estado" name="estado_servicio" class="form-control-tms" required>
                  <option value="programado">Programado</option>
                  <option value="en_ruta">En Ruta</option>
                  <option value="finalizado">Finalizado / Liquidado</option>
                </select>
              </div>

            </div>
          </div>
          <div class="tms-modal-footer">
            <button type="button" class="btn-tms btn-tms-default" id="btn-cancel-modal-servicio">Cancelar</button>
            <button type="button" class="btn-tms btn-tms-default" id="btn-servicio-anterior">Anterior</button>
            <button type="button" class="btn-tms btn-tms-primary" id="btn-servicio-siguiente">Siguiente</button>
            <button type="submit" class="btn-tms btn-tms-primary" id="btn-guardar-servicio" hidden>
              <i class="bi bi-save"></i> Guardar Servicio
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const tbody = document.getElementById('tbody-servicios');
  const searchInput = document.getElementById('search-servicios');
  const modal = document.getElementById('modal-servicio');
  const form = document.getElementById('form-servicio');
  const precioInput = document.getElementById('srv-precio-cliente');
  const costoInput = document.getElementById('srv-costo-proveedor');
  const comprobanteSelect = document.getElementById('srv-tipo-comprobante');
  const baseInput = document.getElementById('srv-base');
  const igvInput = document.getElementById('srv-igv');
  const modalidadSelect = document.getElementById('srv-modalidad');
  const guiaTransInput = document.getElementById('srv-guia-trans');
  const wizardSteps = 4;
  let wizardStep = 1;
  let editingServiceId = '';

  function getFieldContainer(id) {
    return document.getElementById(id)?.closest('.form-group');
  }

  const wizardFields = {
    1: ['srv-fecha', 'srv-hora', 'srv-hora-fin', 'srv-cliente'],
    2: ['srv-modalidad'],
    3: ['srv-vehiculo', 'srv-conductor', 'srv-proveedor', 'srv-costo-proveedor']
  };
  const wizardContainers = new Map();
  for (const [step, fieldIds] of Object.entries(wizardFields)) {
    for (const id of fieldIds) {
      const fieldContainer = getFieldContainer(id);
      if (fieldContainer) wizardContainers.set(fieldContainer, Number(step));
    }
  }

  function renderWizardReview() {
    const values = [
      ['Cliente', document.getElementById('srv-cliente').selectedOptions[0]?.textContent],
      ['Modalidad', modalidadSelect.selectedOptions[0]?.textContent],
      ...(modalidadSelect.value === 'tercerizado'
        ? [['Proveedor', document.getElementById('srv-proveedor').selectedOptions[0]?.textContent], ['Costo proveedor', fmt.moneda(costoInput.value)]]
        : [['Vehículo', document.getElementById('srv-vehiculo').selectedOptions[0]?.textContent], ['Conductor', document.getElementById('srv-conductor').selectedOptions[0]?.textContent]]),
      ['Servicio', document.getElementById('srv-tipo-servicio').value],
      ['Ruta', `${document.getElementById('srv-origen').value || '—'} → ${document.getElementById('srv-destino').value || '—'}`],
      ['Fecha y horario', `${document.getElementById('srv-fecha').value || '—'} ${document.getElementById('srv-hora').value || ''} – ${document.getElementById('srv-hora-fin').value || ''}`],
      ['Total', fmt.moneda(precioInput.value)]
    ];
    document.getElementById('srv-wizard-review').innerHTML = `
      <strong>Resumen del servicio</strong>
      <dl>${values.map(([label, value]) => `<div><dt>${label}</dt><dd>${String(value || '—').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}</dd></div>`).join('')}</dl>`;
  }

  function setWizardStep(step) {
    wizardStep = Math.min(wizardSteps, Math.max(1, step));
    applyModalidad();
    for (const [fieldContainer, fieldStep] of wizardContainers) {
      fieldContainer.hidden = fieldStep !== wizardStep || fieldContainer.dataset.modalidadOculto === '1';
    }
    document.querySelectorAll('#srv-wizard-progress [data-step-indicator]').forEach(indicator => {
      const number = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle('active', number === wizardStep);
      indicator.classList.toggle('complete', number < wizardStep);
      indicator.setAttribute('aria-current', number === wizardStep ? 'step' : 'false');
    });
    document.getElementById('btn-servicio-anterior').hidden = wizardStep === 1;
    document.getElementById('btn-servicio-siguiente').hidden = wizardStep === wizardSteps;
    document.getElementById('btn-guardar-servicio').hidden = wizardStep !== wizardSteps;
    document.getElementById('srv-wizard-help').textContent = [
      'Paso 1 de 4: seleccione el cliente y programe fecha y hora.',
      'Paso 2 de 4: indique si utilizará flota propia o un servicio tercerizado.',
      modalidadSelect.value === 'tercerizado' ? 'Paso 3 de 4: seleccione el proveedor y su costo (sin IGV). No se ocupa flota propia.' : 'Paso 3 de 4: seleccione un vehículo y un conductor activos y libres en ese horario.',
      'Paso 4 de 4: complete la ruta, los importes y los datos de facturación.'
    ][wizardStep - 1];
    if (wizardStep === wizardSteps) renderWizardReview();
  }

  function renderAssignmentOptions() {
    const vehicleSelect = document.getElementById('srv-vehiculo');
    const driverSelect = document.getElementById('srv-conductor');
    const selectedVehicle = vehicleSelect.value;
    const selectedDriver = driverSelect.value;
    const date = document.getElementById('srv-fecha').value;
    const [ini, fin] = intervalo(date, document.getElementById('srv-hora').value, document.getElementById('srv-hora-fin').value);
    // Ocupados: servicios cuyo intervalo se solapa con el nuevo (NEG-06). El servidor vuelve a validarlo.
    const busy = allServicios.filter(service => {
      if (String(service.id) === String(editingServiceId) || service.estado_servicio === 'cancelado' || !ini) return false;
      const [i2, f2] = intervalo(service.fecha_servicio, service.hora_servicio, service.hora_fin_estimada);
      return i2 && ini < f2 && fin > i2;
    });
    const availableVehicles = vehiculosList.filter(vehicle =>
      String(vehicle.estado || 'activo').toLowerCase() === 'activo' &&
      (!date || ((!vehicle.soat_vencimiento || vehicle.soat_vencimiento >= date) && (!vehicle.revision_vencimiento || vehicle.revision_vencimiento >= date))) &&
      (!busy.some(service => String(service.vehiculo_id) === String(vehicle.id)) || String(vehicle.id) === selectedVehicle)
    );
    const availableDrivers = conductoresList.filter(driver =>
      String(driver.estado || 'activo').toLowerCase() === 'activo' &&
      (!driver.licencia_vencimiento || !date || driver.licencia_vencimiento >= date) &&
      (!busy.some(service => String(service.conductor_id) === String(driver.id)) || String(driver.id) === selectedDriver)
    );
    vehicleSelect.innerHTML = '<option value="">Seleccione un vehículo disponible</option>' +
      availableVehicles.map(vehicle => `<option value="${escapeHtml(vehicle.id)}">${escapeHtml(vehicle.placa)} - ${escapeHtml(vehicle.modelo || vehicle.tipo || 'Unidad')}</option>`).join('');
    driverSelect.innerHTML = '<option value="">Seleccione un conductor disponible</option>' +
      availableDrivers.map(driver => `<option value="${escapeHtml(driver.id)}">${escapeHtml(driver.nombre)}</option>`).join('');
    if (availableVehicles.some(vehicle => String(vehicle.id) === selectedVehicle)) vehicleSelect.value = selectedVehicle;
    if (availableDrivers.some(driver => String(driver.id) === selectedDriver)) driverSelect.value = selectedDriver;
  }

  // Vista previa; el servidor recalcula siempre (NEG-16). Una operación gravada genera IGV aunque no se emita comprobante (NEG-17).
  function calcularIGV() {
    const monto = parseFloat(precioInput.value) || 0;
    const base = Math.round(monto / 1.18 * 100) / 100;
    baseInput.value = base.toFixed(2);
    igvInput.value = (monto - base).toFixed(2);
  }

  function intervalo(fecha, horaIni, horaFin) {
    if (!fecha || !horaIni) return [null, null];
    const i = new Date(`${fecha}T${String(horaIni).slice(0, 5)}:00`);
    const fTxt = String(horaFin || '').slice(0, 5);
    let f = fTxt ? new Date(`${fecha}T${fTxt}:00`) : new Date(i.getTime() + 4 * 3600e3);
    if (f <= i) f = new Date(f.getTime() + 24 * 3600e3);
    return [i, f];
  }

  function applyModalidad() {
    const terc = modalidadSelect.value === 'tercerizado';
    const set = (id, oculto) => {
      const el = document.getElementById(id);
      const box = getFieldContainer(id);
      if (box) box.dataset.modalidadOculto = oculto ? '1' : '0';
      if (el) { el.required = !oculto; el.disabled = oculto; }
    };
    set('srv-vehiculo', terc);
    set('srv-conductor', terc);
    set('srv-proveedor', !terc);
    set('srv-costo-proveedor', !terc);
  }

  precioInput.addEventListener('input', calcularIGV);
  comprobanteSelect.addEventListener('change', calcularIGV);

  modalidadSelect.addEventListener('change', () => {
    if (modalidadSelect.value === 'propio') costoInput.value = '';
    applyModalidad();
  });

  async function loadSelectOptions() {
    try {
      const [cRes, vRes, coRes, pRes] = await Promise.all([
        api.get('clientes/index.php'),
        api.get('vehiculos/index.php'),
        api.get('conductores/index.php'),
        api.get('proveedores/index.php')
      ]);

      clientesList = cRes.data || [];
      vehiculosList = vRes.data || [];
      conductoresList = coRes.data || [];
      proveedoresList = (pRes.data || []).filter(p => (p.estado || 'activo') === 'activo');
      document.getElementById('srv-proveedor').innerHTML = '<option value="">Seleccione un proveedor</option>' +
        proveedoresList.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nombre)}${p.placa ? ' · ' + escapeHtml(p.placa) : ''}</option>`).join('');

      const clienteSel = document.getElementById('srv-cliente');
      clienteSel.innerHTML = '<option value="">Seleccione un cliente</option>' +
        clientesList.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.nombre)} (${escapeHtml(c.documento || c.tipo_cliente)})</option>`).join('');

      renderAssignmentOptions();
    } catch (e) {
      showToast(`No se pudieron cargar clientes, vehículos y conductores: ${e.message}`, 'error');
      throw e;
    }
  }

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
      openEditModal(id);
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

  async function openNewModal() {
    form.reset();
    document.getElementById('srv-id').value = '';
    editingServiceId = '';
    document.getElementById('modal-servicio-titulo').innerHTML = `<i class="bi bi-truck"></i> Registrar Nuevo Servicio`;
    document.getElementById('srv-fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('srv-hora').value = new Date().toTimeString().split(' ')[0].substring(0, 5);
    const finDefault = new Date(Date.now() + 4 * 3600e3).toTimeString().slice(0, 5);
    document.getElementById('srv-hora-fin').value = finDefault;
    editingVersion = null;
    comprobanteSelect.disabled = false;
    precioInput.disabled = false;
    renderAssignmentOptions();

    try {
      const res = await api.get('servicios/correlativo.php');
      if (res.success) guiaTransInput.value = res.guia_transportista;
    } catch (e) {}

    calcularIGV();
    setWizardStep(1);
    modal.classList.add('show');
  }

  async function openEditModal(id) {
    try {
      const res = await api.get('servicios/index.php', { action: 'get', id });
      if (res.success && res.data) {
        const s = res.data;
        editingServiceId = String(s.id);
        document.getElementById('srv-id').value = s.id;
        document.getElementById('modal-servicio-titulo').innerHTML = `<i class="bi bi-pencil-square"></i> Editar Servicio #${escapeHtml(s.id)}`;
        editingVersion = s.version;
        document.getElementById('srv-hora-fin').value = (s.hora_fin_estimada || '').substring(0, 5);
        document.getElementById('srv-proveedor').value = s.proveedor_id || '';
        document.getElementById('srv-peso').value = s.peso_kg || '';
        // NEG-15: con comprobante vigente no se cambian importes ni tipo de comprobante.
        const bloqueado = Boolean(s.comprobante_id);
        precioInput.disabled = bloqueado;
        comprobanteSelect.disabled = bloqueado;
        document.getElementById('srv-nota-comprobante').textContent = bloqueado
          ? `Servicio facturado (${s.comprobante}). Importes bloqueados; corrija con nota de crédito en Facturación.`
          : 'El comprobante se registra en Facturación cuando el servicio finaliza. Montos calculados en el servidor.';
        document.getElementById('srv-fecha').value = s.fecha_servicio || '';
        document.getElementById('srv-hora').value = (s.hora_servicio || '').substring(0, 5);
        document.getElementById('srv-cliente').value = s.cliente_id || '';
        document.getElementById('srv-vehiculo').value = s.vehiculo_id || '';
        document.getElementById('srv-conductor').value = s.conductor_id || '';
        document.getElementById('srv-tipo-servicio').value = s.tipo_servicio || 'Local';
        document.getElementById('srv-tipo-carga').value = s.tipo_carga || 'General';
        document.getElementById('srv-modalidad').value = s.modalidad || 'propio';
        renderAssignmentOptions();
        document.getElementById('srv-forma-pago').value = s.forma_pago || 'Contado';
        document.getElementById('srv-origen').value = s.origen || '';
        document.getElementById('srv-destino').value = s.destino || '';
        document.getElementById('srv-precio-cliente').value = s.precio_cliente || '';
        document.getElementById('srv-costo-proveedor').value = s.costo_proveedor || '';
        document.getElementById('srv-tipo-comprobante').value = s.tipo_comprobante || 'FACTURA';
        document.getElementById('srv-guia-rem').value = s.guia_remitente || '';
        document.getElementById('srv-guia-trans').value = s.guia_transportista || '';
        document.getElementById('srv-estado').value = s.estado_servicio || 'programado';

        calcularIGV();
        setWizardStep(1);
        modal.classList.add('show');
      }
    } catch (err) {
      showToast(err.message || 'Error al obtener datos del servicio', 'error');
    }
  }

  document.getElementById('btn-servicio-siguiente').addEventListener('click', () => {
    const activeFields = [...wizardContainers].filter(([, step]) => step === wizardStep).map(([fieldContainer]) => fieldContainer);
    const invalid = activeFields.flatMap(fieldContainer => [...fieldContainer.querySelectorAll('input, select, textarea')]).find(field => !field.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    setWizardStep(wizardStep + 1);
  });
  document.getElementById('btn-servicio-anterior').addEventListener('click', () => setWizardStep(wizardStep - 1));
  document.getElementById('srv-fecha').addEventListener('change', renderAssignmentOptions);
  document.getElementById('srv-hora').addEventListener('change', renderAssignmentOptions);
  document.getElementById('srv-hora-fin').addEventListener('change', renderAssignmentOptions);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invalid = [...form.querySelectorAll('input, select, textarea')].find(field => !field.disabled && !field.checkValidity());
    if (invalid) {
      const ownerStep = wizardContainers.get(getFieldContainer(invalid.id)) || wizardSteps;
      setWizardStep(ownerStep);
      invalid.reportValidity();
      return;
    }
    const id = document.getElementById('srv-id').value;
    const isEdit = Boolean(id);

    const payload = {
      id: id || undefined,
      fecha_servicio: document.getElementById('srv-fecha').value,
      hora_servicio: document.getElementById('srv-hora').value,
      hora_fin_estimada: document.getElementById('srv-hora-fin').value,
      cliente_id: document.getElementById('srv-cliente').value,
      vehiculo_id: document.getElementById('srv-vehiculo').value,
      conductor_id: document.getElementById('srv-conductor').value,
      proveedor_id: document.getElementById('srv-proveedor').value,
      peso_kg: document.getElementById('srv-peso').value,
      version: editingVersion ?? undefined,
      tipo_servicio: document.getElementById('srv-tipo-servicio').value,
      tipo_carga: document.getElementById('srv-tipo-carga').value,
      modalidad: document.getElementById('srv-modalidad').value,
      forma_pago: document.getElementById('srv-forma-pago').value,
      origen: document.getElementById('srv-origen').value,
      destino: document.getElementById('srv-destino').value,
      precio_cliente: document.getElementById('srv-precio-cliente').value,
      costo_proveedor: document.getElementById('srv-costo-proveedor').value,
      tipo_comprobante: document.getElementById('srv-tipo-comprobante').value,
      guia_remitente: document.getElementById('srv-guia-rem').value,
      estado_servicio: document.getElementById('srv-estado').value,
    };

    const btn = document.getElementById('btn-guardar-servicio');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Guardando...`;

    try {
      let res;
      if (isEdit) {
        res = await api.post('servicios/actualizar.php', payload);
      } else {
        res = await api.post('servicios/guardar.php', payload);
      }

      if (res.success) {
        showToast(res.message || 'Servicio guardado exitosamente', res.avisos?.length ? 'warning' : 'success');
        modal.classList.remove('show');
        loadServicios();
      }
    } catch (err) {
      showToast(err.message || 'Error al procesar el servicio', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-save"></i> Guardar Servicio`;
    }
  });

  document.getElementById('btn-close-modal-servicio').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('btn-cancel-modal-servicio').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('btn-servicios-nuevo').addEventListener('click', openNewModal);
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

  await loadSelectOptions();
  await loadServicios();
}

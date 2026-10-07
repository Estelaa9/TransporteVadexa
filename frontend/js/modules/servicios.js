// frontend/js/modules/servicios.js - Gestión integral de Servicios y Liquidaciones
import { api, showToast, fmt, exportTableToExcel } from '../api.js';

export async function renderServicios(container) {
  let allServicios = [];
  let currentTab = 'sin_liquidar'; // 'sin_liquidar' o 'liquidaciones'
  let clientesList = [];
  let vehiculosList = [];
  let conductoresList = [];

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
        <button id="btn-servicios-nuevo" class="btn-tms btn-tms-primary">
          <i class="bi bi-plus-circle"></i> Nuevo Servicio
        </button>
        <button id="btn-servicios-imprimir" class="btn-tms btn-tms-default">
          <i class="bi bi-printer"></i> Imprimir
        </button>
        <button id="btn-servicios-excel" class="btn-tms btn-tms-default">
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
            <th>Vehículo</th>
            <th>Conductor</th>
            <th>Origen → Destino</th>
            <th>G. Remitente</th>
            <th>G. Transportista</th>
            <th>Comprobante</th>
            <th style="text-align: right;">Monto (S/)</th>
            <th style="text-align: right;">Utilidad (S/)</th>
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
        <form id="form-servicio">
          <input type="hidden" id="srv-id" name="id">
          <div class="tms-modal-body" style="max-height: 70vh; overflow-y: auto; padding: 24px;">
            
            <!-- SECCIÓN 1: ASIGNACIÓN DE RECURSOS -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
              <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                <i class="bi bi-truck-flatbed" style="font-size: 16px;"></i>
                <span>ASIGNACIÓN DE RECURSOS</span>
              </h4>
              <p style="margin: 6px 0 0 26px; font-size: 11px; opacity: 0.85; font-weight: 400;">Vehículo, cliente y conductor asignados al servicio</p>
            </div>

            <div class="form-grid" style="margin-bottom: 28px;">
              <div class="col-4 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-truck" style="color: #1e40af;"></i> Vehículo (Placa) <span style="color: #dc2626;">*</span>
                </label>
                <select id="srv-vehiculo" name="vehiculo_id" class="form-control-tms" required style="font-weight: 600; color: #1e40af; border: 2px solid #e2e8f0;">
                  <option value="">Seleccione un vehículo</option>
                </select>
              </div>

              <div class="col-4 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-building" style="color: #1e40af;"></i> Cliente <span style="color: #dc2626;">*</span>
                </label>
                <select id="srv-cliente" name="cliente_id" class="form-control-tms" required style="font-weight: 600; border: 2px solid #e2e8f0;">
                  <option value="">Seleccione un cliente</option>
                </select>
              </div>

              <div class="col-4 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-person-badge" style="color: #1e40af;"></i> Conductor <span style="color: #dc2626;">*</span>
                </label>
                <select id="srv-conductor" name="conductor_id" class="form-control-tms" required style="font-weight: 500; border: 2px solid #e2e8f0;">
                  <option value="">Seleccione un conductor</option>
                </select>
              </div>
            </div>

            <!-- SECCIÓN 2: DETALLES DEL SERVICIO -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
              <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                <i class="bi bi-box-seam" style="font-size: 16px;"></i>
                <span>DETALLES DEL SERVICIO</span>
              </h4>
              <p style="margin: 6px 0 0 26px; font-size: 11px; opacity: 0.85; font-weight: 400;">Tipo de servicio, carga, modalidad y forma de pago</p>
            </div>

            <div class="form-grid" style="margin-bottom: 28px;">
              <div class="col-3 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-tags" style="color: #1e40af;"></i> Tipo Servicio
                </label>
                <select id="srv-tipo-servicio" name="tipo_servicio" class="form-control-tms" style="border: 2px solid #e2e8f0;">
                  <option value="Local">Local</option>
                  <option value="Provincia">Provincia</option>
                  <option value="Mudanza">Mudanza</option>
                  <option value="Distribución">Distribución</option>
                  <option value="Especial">Especial</option>
                </select>
              </div>

              <div class="col-3 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-box" style="color: #1e40af;"></i> Tipo Carga
                </label>
                <select id="srv-tipo-carga" name="tipo_carga" class="form-control-tms" style="border: 2px solid #e2e8f0;">
                  <option value="General">General</option>
                  <option value="Frágil">Frágil</option>
                  <option value="Refrigerada">Refrigerada</option>
                  <option value="Maquinaria">Maquinaria</option>
                  <option value="Enseres">Enseres / Muebles</option>
                </select>
              </div>

              <div class="col-3 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-shield-check" style="color: #1e40af;"></i> Modalidad <span style="color: #dc2626;">*</span>
                </label>
                <select id="srv-modalidad" name="modalidad" class="form-control-tms" required style="border: 2px solid #e2e8f0;">
                  <option value="propio">Propio (Flota)</option>
                  <option value="tercerizado">Tercerizado</option>
                </select>
              </div>

              <div class="col-3 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-credit-card" style="color: #1e40af;"></i> Forma de Pago
                </label>
                <select id="srv-forma-pago" name="forma_pago" class="form-control-tms" style="border: 2px solid #e2e8f0;">
                  <option value="Contado">Contado</option>
                  <option value="Crédito 15 días">Crédito 15 días</option>
                  <option value="Crédito 30 días">Crédito 30 días</option>
                  <option value="Contra entrega">Contra entrega</option>
                </select>
              </div>
            </div>

            <!-- SECCIÓN 3: RUTA DEL SERVICIO -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
              <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                <i class="bi bi-map" style="font-size: 16px;"></i>
                <span>RUTA DEL SERVICIO</span>
              </h4>
              <p style="margin: 6px 0 0 26px; font-size: 11px; opacity: 0.85; font-weight: 400;">Punto de origen y destino del transporte</p>
            </div>

            <div class="form-grid" style="margin-bottom: 28px;">
              <div class="col-6 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-geo-alt" style="color: #1e40af;"></i> Origen <span style="color: #dc2626;">*</span>
                </label>
                <input type="text" id="srv-origen" name="origen" class="form-control-tms" placeholder="Dirección / Almacén / Distrito Origen" required style="border: 2px solid #e2e8f0;">
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-geo-alt-fill" style="color: #1e40af;"></i> Destino <span style="color: #dc2626;">*</span>
                </label>
                <input type="text" id="srv-destino" name="destino" class="form-control-tms" placeholder="Dirección / Distrito Destino" required style="border: 2px solid #e2e8f0;">
              </div>
            </div>

            <!-- SECCIÓN 4: INFORMACIÓN FINANCIERA -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
              <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                <i class="bi bi-currency-dollar" style="font-size: 16px;"></i>
                <span>INFORMACIÓN FINANCIERA</span>
              </h4>
              <p style="margin: 6px 0 0 26px; font-size: 11px; opacity: 0.85; font-weight: 400;">Precios, costos, IGV y comprobantes</p>
            </div>

            <div class="form-grid" style="margin-bottom: 28px;">
              <div class="col-4 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-cash-coin" style="color: #16a34a;"></i> Precio Cliente (S/) <span style="color: #dc2626;">*</span>
                </label>
                <input type="number" step="0.01" id="srv-precio-cliente" name="precio_cliente" class="form-control-tms" placeholder="0.00" required style="font-weight: 700; color: #16a34a; font-size: 15px; border: 2px solid #bbf7d0; background: #f0fdf4;">
              </div>

              <div class="col-4 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-wallet2" style="color: #dc2626;"></i> Costo Proveedor (S/)
                </label>
                <input type="number" step="0.01" id="srv-costo-proveedor" name="costo_proveedor" class="form-control-tms" placeholder="0.00" disabled style="font-weight: 600; color: #dc2626; border: 2px solid #fecaca; background: #fef2f2;">
                <small style="color: #64748b; font-size: 10px; display: block; margin-top: 4px;">Solo si es Tercerizado</small>
              </div>

              <div class="col-4 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-receipt" style="color: #1e40af;"></i> Tipo Comprobante <span style="color: #dc2626;">*</span>
                </label>
                <select id="srv-tipo-comprobante" name="tipo_comprobante" class="form-control-tms" style="border: 2px solid #e2e8f0;">
                  <option value="FACTURA">FACTURA</option>
                  <option value="BOLETA">BOLETA</option>
                  <option value="SIN_COMPROBANTE">SIN COMPROBANTE</option>
                </select>
              </div>

              <div class="col-4 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-calculator" style="color: #64748b;"></i> Base Imponible (S/)
                </label>
                <input type="text" id="srv-base" name="base_imponible" class="form-control-tms" readonly style="background: #f8fafc; border: 2px solid #e2e8f0; font-weight: 600; color: #475569;">
              </div>

              <div class="col-4 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-percent" style="color: #64748b;"></i> IGV 18% (S/)
                </label>
                <input type="text" id="srv-igv" name="igv" class="form-control-tms" readonly style="background: #f8fafc; border: 2px solid #e2e8f0; font-weight: 600; color: #475569;">
              </div>

              <div class="col-4 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-hash" style="color: #0284c7;"></i> N° Factura / Boleta
                </label>
                <input type="text" id="srv-factura" name="numero_factura" class="form-control-tms" placeholder="Generado automático" style="font-weight: 600; color: #0284c7; border: 2px solid #e0f2fe; background: #f0f9ff;">
              </div>
            </div>

            <!-- SECCIÓN 5: GUÍAS Y DOCUMENTACIÓN -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
              <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                <i class="bi bi-file-text" style="font-size: 16px;"></i>
                <span>GUÍAS Y DOCUMENTACIÓN</span>
              </h4>
              <p style="margin: 6px 0 0 26px; font-size: 11px; opacity: 0.85; font-weight: 400;">Guías de remisión y transporte</p>
            </div>

            <div class="form-grid" style="margin-bottom: 28px;">
              <div class="col-6 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-file-earmark-text" style="color: #1e40af;"></i> Guía Remitente
                </label>
                <input type="text" id="srv-guia-rem" name="guia_remitente" class="form-control-tms" placeholder="T001-XXXXXX" style="font-weight: 600; border: 2px solid #e2e8f0;">
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-file-earmark-check" style="color: #0284c7;"></i> Guía Transportista
                </label>
                <input type="text" id="srv-guia-trans" name="guia_transportista" class="form-control-tms" placeholder="GRT-XXXXXX" readonly style="background: #f0f9ff; font-weight: 700; color: #0284c7; border: 2px solid #e0f2fe;">
                <small style="color: #64748b; font-size: 10px; display: block; margin-top: 4px;">Generado automáticamente</small>
              </div>
            </div>

            <!-- SECCIÓN 6: INFORMACIÓN DEL SERVICIO -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; color: white; box-shadow: 0 2px 4px rgba(30,58,138,0.15);">
              <h4 style="margin: 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px;">
                <i class="bi bi-calendar3" style="font-size: 16px;"></i>
                <span>INFORMACIÓN DEL SERVICIO</span>
              </h4>
              <p style="margin: 6px 0 0 26px; font-size: 11px; opacity: 0.85; font-weight: 400;">Fecha, hora y estado del servicio</p>
            </div>

            <div class="form-grid">
              <div class="col-3 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-calendar-event" style="color: #1e40af;"></i> Fecha del Servicio <span style="color: #dc2626;">*</span>
                </label>
                <input type="date" id="srv-fecha" name="fecha_servicio" class="form-control-tms" required style="border: 2px solid #e2e8f0; font-weight: 600;">
              </div>

              <div class="col-3 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-clock" style="color: #1e40af;"></i> Hora
                </label>
                <input type="time" id="srv-hora" name="hora_servicio" class="form-control-tms" style="border: 2px solid #e2e8f0; font-weight: 600;">
              </div>

              <div class="col-6 form-group">
                <label class="form-label" style="font-weight: 600; color: #1e293b; font-size: 12px;">
                  <i class="bi bi-circle-fill" style="color: #eab308; font-size: 8px;"></i> Estado del Servicio <span style="color: #dc2626;">*</span>
                </label>
                <select id="srv-estado" name="estado_servicio" class="form-control-tms" required style="border: 2px solid #e2e8f0; font-weight: 600;">
                  <option value="programado">Programado</option>
                  <option value="en_ruta">En Ruta</option>
                  <option value="finalizado">Finalizado / Liquidado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

          </div>
          <div class="tms-modal-footer" style="background: #f8fafc; border-top: 2px solid #e2e8f0; padding: 16px 24px;">
            <button type="button" class="btn-tms btn-tms-default" id="btn-cancel-modal-servicio">
              <i class="bi bi-x-circle"></i> Cancelar
            </button>
            <button type="submit" class="btn-tms btn-tms-primary" id="btn-guardar-servicio" style="padding: 10px 24px; font-size: 14px; font-weight: 700;">
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
  const facturaInput = document.getElementById('srv-factura');
  const modalidadSelect = document.getElementById('srv-modalidad');
  const guiaTransInput = document.getElementById('srv-guia-trans');

  function calcularIGV() {
    const monto = parseFloat(precioInput.value) || 0;
    const tipo = comprobanteSelect.value;

    if (tipo === 'SIN_COMPROBANTE') {
      baseInput.value = monto.toFixed(2);
      igvInput.value = '0.00';
      facturaInput.value = '';
      facturaInput.disabled = true;
    } else {
      facturaInput.disabled = false;
      const base = monto / 1.18;
      const igv = monto - base;
      baseInput.value = base.toFixed(2);
      igvInput.value = igv.toFixed(2);
    }
  }

  precioInput.addEventListener('input', calcularIGV);
  comprobanteSelect.addEventListener('change', calcularIGV);

  modalidadSelect.addEventListener('change', () => {
    if (modalidadSelect.value === 'propio') {
      costoInput.value = '';
      costoInput.disabled = true;
    } else {
      costoInput.disabled = false;
    }
  });

  async function loadSelectOptions() {
    try {
      const [cRes, vRes, coRes] = await Promise.all([
        api.get('clientes/index.php'),
        api.get('vehiculos/index.php'),
        api.get('conductores/index.php')
      ]);

      clientesList = cRes.data || [];
      vehiculosList = vRes.data || [];
      conductoresList = coRes.data || [];

      const clienteSel = document.getElementById('srv-cliente');
      clienteSel.innerHTML = '<option value="">Seleccione un cliente</option>' +
        clientesList.map(c => `<option value="${c.id}">${c.nombre} (${c.documento || c.tipo_cliente})</option>`).join('');

      const vehiculoSel = document.getElementById('srv-vehiculo');
      vehiculoSel.innerHTML = '<option value="">Seleccione un vehículo</option>' +
        vehiculosList.map(v => `<option value="${v.id}">${v.placa} - ${v.modelo || v.tipo}</option>`).join('');

      const conductorSel = document.getElementById('srv-conductor');
      conductorSel.innerHTML = '<option value="">Seleccione un conductor</option>' +
        conductoresList.map(co => `<option value="${co.id}">${co.nombre}</option>`).join('');
    } catch (e) {
      console.warn('Error cargando listas:', e);
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
        const text = `${s.id} ${s.cliente} ${s.placa} ${s.conductor} ${s.origen} ${s.destino} ${s.guia_remitente} ${s.guia_transportista} ${s.numero_factura} ${s.estado_servicio}`.toLowerCase();
        return text.includes(q);
      }
      return true;
    });

    document.getElementById('servicios-contador').textContent = `Mostrando ${filtered.length} de ${allServicios.length} servicios`;
    const totalSuma = filtered.reduce((acc, curr) => acc + (parseFloat(curr.precio_cliente) || 0), 0);
    document.getElementById('servicios-total-monto').textContent = `Total Facturación: ${fmt.moneda(totalSuma)}`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="14" style="text-align: center; padding: 30px; color: #64748b;">No se encontraron servicios en esta sección.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(s => {
      const st = (s.estado_servicio || 'programado').toLowerCase();
      let actionPill = '';
      
      if (st === 'programado') {
        actionPill = `<button class="btn-pill-action" data-action="status" data-id="${s.id}" data-newstatus="en_ruta" title="Poner en ruta"><i class="bi bi-play-fill"></i> Iniciar</button>`;
      } else if (st === 'en_ruta') {
        actionPill = `<button class="btn-pill-action" data-action="status" data-id="${s.id}" data-newstatus="finalizado" style="background:#16a34a;" title="Liquidar servicio"><i class="bi bi-check-lg"></i> Liquidar</button>`;
      }

      return `
        <tr>
          <td style="text-align: center;"><input type="checkbox" class="srv-checkbox" value="${s.id}"></td>
          <td><strong>#${s.id}</strong></td>
          <td>
            <div>${fmt.fecha(s.fecha_servicio)}</div>
            <small style="color: #64748b;">${fmt.hora(s.hora_servicio)}</small>
          </td>
          <td><strong>${s.cliente || '-'}</strong></td>
          <td><span class="badge-status" style="background:#f1f5f9; color:#1e293b; border:1px solid #cbd5e1;">${s.placa || '-'}</span></td>
          <td>${s.conductor || '-'}</td>
          <td>
            <div style="font-size: 11px;">${s.origen || '-'}</div>
            <div style="font-size: 11px; color:#64748b;"><i class="bi bi-arrow-down-right"></i> ${s.destino || '-'}</div>
          </td>
          <td><small>${s.guia_remitente || '-'}</small></td>
          <td><code style="color: #0284c7; font-weight: 600;">${s.guia_transportista || '-'}</code></td>
          <td>
            <small style="font-weight: 600;">${s.numero_factura || s.tipo_comprobante}</small>
          </td>
          <td style="text-align: right; font-weight: 700; color: #1e293b;">${fmt.moneda(s.precio_cliente)}</td>
          <td style="text-align: right; font-weight: 600; color: ${s.utilidad >= 0 ? '#15803d' : '#dc2626'};">${fmt.moneda(s.utilidad)}</td>
          <td style="text-align: center;">${fmt.badgeEstado(s.estado_servicio)}</td>
          <td class="no-export" style="text-align: center; white-space: nowrap;">
            ${actionPill}
            <button class="btn-pill-action btn-pill-edit" data-action="edit" data-id="${s.id}" title="Editar"><i class="bi bi-pencil"></i></button>
            <button class="btn-pill-action btn-pill-delete" data-action="delete" data-id="${s.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
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
      if (confirm(`¿Está seguro de eliminar el servicio #${id}? Esta acción no se puede deshacer.`)) {
        try {
          const res = await api.delete('servicios/eliminar.php', { id });
          if (res.success) {
            showToast(`Servicio #${id} eliminado`, 'success');
            loadServicios();
          }
        } catch (err) {
          showToast(err.message || 'Error al eliminar', 'error');
        }
      }
    }
  }

  async function openNewModal() {
    form.reset();
    document.getElementById('srv-id').value = '';
    document.getElementById('modal-servicio-titulo').innerHTML = `<i class="bi bi-truck"></i> Registrar Nuevo Servicio`;
    document.getElementById('srv-fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('srv-hora').value = new Date().toTimeString().split(' ')[0].substring(0, 5);
    costoInput.disabled = true;

    try {
      const res = await api.get('servicios/correlativo.php', { tipo_comprobante: 'FACTURA' });
      if (res.success) {
        guiaTransInput.value = res.guia_transportista;
        facturaInput.value = res.numero_factura;
      }
    } catch (e) {}

    calcularIGV();
    modal.classList.add('show');
  }

  async function openEditModal(id) {
    try {
      const res = await api.get('servicios/index.php', { action: 'get', id });
      if (res.success && res.data) {
        const s = res.data;
        document.getElementById('srv-id').value = s.id;
        document.getElementById('modal-servicio-titulo').innerHTML = `<i class="bi bi-pencil-square"></i> Editar Servicio #${s.id}`;
        document.getElementById('srv-fecha').value = s.fecha_servicio || '';
        document.getElementById('srv-hora').value = (s.hora_servicio || '').substring(0, 5);
        document.getElementById('srv-cliente').value = s.cliente_id || '';
        document.getElementById('srv-vehiculo').value = s.vehiculo_id || '';
        document.getElementById('srv-conductor').value = s.conductor_id || '';
        document.getElementById('srv-tipo-servicio').value = s.tipo_servicio || 'Local';
        document.getElementById('srv-tipo-carga').value = s.tipo_carga || 'General';
        document.getElementById('srv-modalidad').value = s.modalidad || 'propio';
        document.getElementById('srv-forma-pago').value = s.forma_pago || 'Contado';
        document.getElementById('srv-origen').value = s.origen || '';
        document.getElementById('srv-destino').value = s.destino || '';
        document.getElementById('srv-precio-cliente').value = s.precio_cliente || '';
        document.getElementById('srv-costo-proveedor').value = s.costo_proveedor || '';
        document.getElementById('srv-tipo-comprobante').value = s.tipo_comprobante || 'FACTURA';
        document.getElementById('srv-guia-rem').value = s.guia_remitente || '';
        document.getElementById('srv-guia-trans').value = s.guia_transportista || '';
        document.getElementById('srv-factura').value = s.numero_factura || '';
        document.getElementById('srv-estado').value = s.estado_servicio || 'programado';

        if (s.modalidad === 'propio') {
          costoInput.disabled = true;
        } else {
          costoInput.disabled = false;
        }

        calcularIGV();
        modal.classList.add('show');
      }
    } catch (err) {
      showToast(err.message || 'Error al obtener datos del servicio', 'error');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('srv-id').value;
    const isEdit = Boolean(id);

    const payload = {
      id: id || undefined,
      fecha_servicio: document.getElementById('srv-fecha').value,
      hora_servicio: document.getElementById('srv-hora').value,
      cliente_id: document.getElementById('srv-cliente').value,
      vehiculo_id: document.getElementById('srv-vehiculo').value,
      conductor_id: document.getElementById('srv-conductor').value,
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
      guia_transportista: document.getElementById('srv-guia-trans').value,
      numero_factura: document.getElementById('srv-factura').value,
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
        showToast(res.message || 'Servicio guardado exitosamente', 'success');
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

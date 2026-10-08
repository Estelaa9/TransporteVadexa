// frontend/js/modules/portal-cliente.js - Portal del Cliente
import { api, showToast, fmt } from '../api.js';

export async function renderMisServicios(container) {
  container.innerHTML = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      
      .portal-wrapper {
        background: #f5f7f9;
        min-height: 100vh;
      }
      
      .portal-header {
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }
      
      .portal-header-content {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 48px;
      }
      
      .portal-logo-title {
        font-size: 20px;
        font-weight: 700;
        color: #1e3a5f;
      }
      
      .portal-logo-subtitle {
        font-size: 10px;
        color: #0891b2;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 2px;
      }
      
      .portal-nav {
        display: flex;
        gap: 48px;
      }
      
      .portal-nav-item {
        padding: 8px 0;
        color: #6b7280;
        font-weight: 500;
        font-size: 15px;
        cursor: pointer;
        border-bottom: 3px solid transparent;
      }
      
      .portal-nav-item.active {
        color: #1e3a5f;
        border-bottom-color: #0891b2;
      }
      
      .portal-user-empresa {
        font-size: 13px;
        font-weight: 600;
        color: #1e3a5f;
        text-align: right;
      }
      
      .portal-user-cuenta {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 2px;
        text-align: right;
      }
      
      .portal-content {
        max-width: 1400px;
        margin: 0 auto;
        padding: 32px 48px;
      }
      
      .section-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 32px;
        margin-bottom: 24px;
      }
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
      }
      
      .section-title {
        font-size: 17px;
        font-weight: 600;
        color: #1e3a5f;
      }
      
      .badge-activo {
        background: #dbeafe;
        color: #0284c7;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .servicio-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 24px;
      }
      
      .campo-label {
        font-size: 11px;
        color: #6b7280;
        text-transform: uppercase;
        font-weight: 600;
        margin-bottom: 6px;
      }
      
      .campo-valor {
        font-size: 15px;
        color: #1e3a5f;
        font-weight: 500;
      }
      
      .ruta-visual {
        grid-column: 1 / -1;
        padding: 20px 0;
      }
      
      .ruta-linea {
        height: 4px;
        background: #e5e7eb;
        position: relative;
        border-radius: 2px;
      }
      
      .ruta-progreso {
        height: 100%;
        background: #0891b2;
        width: 55%;
        border-radius: 2px;
        position: relative;
      }
      
      .ruta-dot {
        position: absolute;
        right: -5px;
        top: 50%;
        transform: translateY(-50%);
        width: 10px;
        height: 10px;
        background: #0891b2;
        border-radius: 50%;
      }
      
      .btn-detalle {
        background: #1e40af;
        color: white;
        border: none;
        padding: 11px 24px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
      }
      
      .historial-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .historial-tabs {
        display: flex;
        gap: 32px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .historial-tab {
        background: transparent;
        border: none;
        color: #6b7280;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        padding: 12px 0;
        border-bottom: 3px solid transparent;
        margin-bottom: -1px;
        transition: all 0.2s;
      }
      
      .historial-tab.active {
        color: #1e3a5f;
        border-bottom-color: #0891b2;
      }
      
      .historial-tab:hover {
        color: #1e3a5f;
      }
      
      .btn-filtro {
        background: white;
        border: 1px solid #d1d5db;
        padding: 8px 16px;
        border-radius: 6px;
        color: #6b7280;
        font-weight: 500;
        font-size: 13px;
        cursor: pointer;
      }
      
      .historial-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .historial-table thead {
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .historial-table th {
        padding: 14px 20px;
        text-align: left;
        font-size: 10px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .historial-table td {
        padding: 18px 20px;
        border-bottom: 1px solid #f3f4f6;
        font-size: 14px;
        color: #374151;
      }
      
      .historial-table tbody tr {
        transition: background 0.15s;
      }
      
      .historial-table tbody tr:hover {
        background: #f9fafb;
      }
      
      .historial-table tbody tr:last-child td {
        border-bottom: none;
      }
      
      .badge-completado {
        background: #d1fae5;
        color: #065f46;
        padding: 5px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .badge-liquidacion {
        background: #fef3c7;
        color: #92400e;
        padding: 5px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .texto-carga {
        color: #1e3a5f;
        font-weight: 500;
      }
      
      .texto-secundario {
        color: #9ca3af;
        font-size: 13px;
        margin-top: 3px;
      }
      
      .texto-guia {
        font-family: monospace;
        color: #0891b2;
        font-weight: 600;
      }
      
      .footer-text {
        text-align: center;
        padding: 20px 0;
        color: #9ca3af;
        font-size: 12px;
        border-top: 1px solid #f3f4f6;
        margin-top: 20px;
      }
      
      /* Modal */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
      }
      
      .modal-overlay.active {
        opacity: 1;
        pointer-events: all;
      }
      
      .modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 700px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        transform: scale(0.9);
        transition: transform 0.2s;
      }
      
      .modal-overlay.active .modal-content {
        transform: scale(1);
      }
      
      .modal-header {
        padding: 28px 32px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .modal-title {
        font-size: 20px;
        font-weight: 600;
        color: #1e3a5f;
        margin: 0;
      }
      
      .modal-subtitle {
        font-size: 13px;
        color: #94a3b8;
        margin-top: 4px;
      }
      
      .modal-close {
        background: #f3f4f6;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        cursor: pointer;
        color: #6b7280;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      
      .modal-close:hover {
        background: #e5e7eb;
      }
      
      .modal-body {
        padding: 32px;
      }
      
      .modal-badge {
        display: inline-block;
        margin-bottom: 24px;
      }
      
      .modal-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 28px;
      }
      
      .modal-field {
        margin-bottom: 24px;
      }
      
      .modal-field-label {
        font-size: 11px;
        color: #6b7280;
        text-transform: uppercase;
        font-weight: 600;
        margin-bottom: 6px;
      }
      
      .modal-field-value {
        font-size: 15px;
        color: #1e3a5f;
        font-weight: 500;
      }
    </style>

    <div class="portal-wrapper">
      <div class="portal-header">
        <div class="portal-header-content">
          <div>
            <div class="portal-logo-title">VADEXSA</div>
            <div class="portal-logo-subtitle">LOGISTIC · PORTAL DEL CLIENTE</div>
          </div>
          
          <div class="portal-nav">
            <div class="portal-nav-item active">Mis servicios</div>
            <div class="portal-nav-item">Programación</div>
            <div class="portal-nav-item">Mis reportes</div>
          </div>
          
          <div>
            <div class="portal-user-empresa">Corporación Aceros S.A.</div>
            <div class="portal-user-cuenta">Cuenta de ejemplo</div>
          </div>
        </div>
      </div>

      <div class="portal-content">
        <!-- Título fuera del card -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: 600; color: #1e3a5f; margin: 0;">Seguimiento de mi servicio</h1>
          <span class="badge-activo">SERVICIO ACTIVO</span>
        </div>

        <!-- Layout con dos columnas: Card principal + Card lateral -->
        <div style="display: grid; grid-template-columns: 1fr 340px; gap: 24px; margin-bottom: 32px;">
          
          <!-- Card principal - Ruta y estados -->
          <div class="section-card">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
              <div>
                <div class="campo-label">ORIGEN</div>
                <div style="font-size: 17px; color: #1e3a5f; font-weight: 600;">Puerto del Callao, Muelle Sur</div>
              </div>
              
              <div>
                <div class="campo-label">DESTINO ESTIMADO</div>
                <div style="font-size: 17px; color: #1e3a5f; font-weight: 600;">Planta Industrial Lurín, Km 40</div>
              </div>
            </div>

            <div style="position: relative; margin-bottom: 32px;">
              <div class="ruta-linea">
                <div class="ruta-progreso">
                  <div class="ruta-dot"></div>
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;">
              <div>
                <div style="font-size: 11px; color: #0891b2; font-weight: 600; margin-bottom: 6px;">SALIDA · 08:45</div>
                <div style="font-size: 15px; color: #1e3a5f; font-weight: 600;">08 OCT, 2026</div>
              </div>
              
              <div style="text-align: center;">
                <div style="font-size: 11px; color: #0891b2; font-weight: 600; margin-bottom: 6px;">EN TRÁNSITO</div>
                <div style="font-size: 15px; color: #1e3a5f; font-weight: 600;">Extraterrestre</div>
              </div>
              
              <div style="text-align: right;">
                <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 6px;">LLEGADA · 12:30 (EST)</div>
                <div style="font-size: 15px; color: #6b7280; font-weight: 500;">Pendiente de entrega</div>
              </div>
            </div>
          </div>

          <!-- Card lateral - Vehículo y Guía -->
          <div class="section-card">
            <div style="margin-bottom: 28px;">
              <div class="campo-label">VEHÍCULO</div>
              <div style="font-size: 19px; color: #1e3a5f; font-weight: 600; letter-spacing: 0.5px;">V4X-882</div>
            </div>

            <div style="margin-bottom: 28px;">
              <div class="campo-label">GUÍA REMITENTE</div>
              <div style="font-size: 17px; color: #1e3a5f; font-weight: 600; font-family: monospace;">GRR-001-98442</div>
            </div>

            <button class="btn-detalle" style="width: 100%;">Ver detalle completo</button>
          </div>
        </div>

        <!-- Historial de servicios - Título y controles fuera del card -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #1e3a5f; margin: 0;">Historial de servicios</h2>
          <button class="btn-filtro">
            <svg style="width: 16px; height: 16px; margin-right: 6px; display: inline-block; vertical-align: middle;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Filtrar por fecha
          </button>
        </div>

        <div class="historial-tabs" style="margin-bottom: 16px;">
          <button class="historial-tab active">Todos</button>
          <button class="historial-tab">Finalizados</button>
          <button class="historial-tab">En facturación</button>
        </div>

        <div class="section-card" style="padding: 0; overflow: hidden;">
          <table class="historial-table">
            <thead>
              <tr>
                <th>FECHA</th>
                <th>CARGA</th>
                <th>ORIGEN / DESTINO</th>
                <th>GUÍA / FACTURA</th>
                <th>ESTADO</th>
                <th style="text-align: right;">MONTO</th>
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr class="historial-row" data-servicio="1">
                <td>
                  <div style="font-weight: 600; color: #1e3a5f;">07 oct. 2026</div>
                  <div class="texto-secundario">09:15</div>
                </td>
                <td>
                  <div class="texto-carga">Bobinas de acero</div>
                  <div class="texto-secundario">24,5 toneladas</div>
                </td>
                <td>
                  <div style="color: #1e3a5f; font-weight: 500;">Callao</div>
                  <div class="texto-secundario">→ Huachipa</div>
                </td>
                <td>
                  <div class="texto-guia">GRT-001-98440</div>
                  <div class="texto-secundario">F002-00451</div>
                </td>
                <td>
                  <span class="badge-completado">COMPLETADO</span>
                </td>
                <td style="text-align: right;">
                  <div style="font-weight: 700; font-size: 15px; color: #1e3a5f;">S/ 1,298.00</div>
                  <div style="font-size: 12px; color: #10b981; margin-top: 3px;">PAGADO</div>
                </td>
                <td style="text-align: center;">
                  <button class="btn-ver-detalle" data-servicio="1" style="background: none; border: none; cursor: pointer; color: #0891b2; font-size: 20px; padding: 4px 8px;">→</button>
                </td>
              </tr>
              
              <tr class="historial-row" data-servicio="2">
                <td>
                  <div style="font-weight: 600; color: #1e3a5f;">06 oct. 2026</div>
                  <div class="texto-secundario">14:50</div>
                </td>
                <td>
                  <div class="texto-carga">Perfiles estructurales</div>
                  <div class="texto-secundario">18 toneladas</div>
                </td>
                <td>
                  <div style="color: #1e3a5f; font-weight: 500;">Ate Vitarte</div>
                  <div class="texto-secundario">→ Villa El Salvador</div>
                </td>
                <td>
                  <div class="texto-guia">GRT-001-98438</div>
                  <div class="texto-secundario">Pendiente</div>
                </td>
                <td>
                  <span class="badge-liquidacion">LIQUIDACIÓN</span>
                </td>
                <td style="text-align: right;">
                  <div style="font-weight: 700; font-size: 15px; color: #1e3a5f;">S/ 850.00</div>
                  <div style="font-size: 12px; color: #9ca3af; margin-top: 3px;">PENDIENTE DE PAGO</div>
                </td>
                <td style="text-align: center;">
                  <button class="btn-ver-detalle" data-servicio="2" style="background: none; border: none; cursor: pointer; color: #0891b2; font-size: 20px; padding: 4px 8px;">→</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="footer-text">
            Mostrando 2 servicios · Datos de ejemplo
          </div>
        </div>

        <div style="text-align: center; padding: 32px 0; border-top: 1px solid #e5e7eb; margin-top: 32px;">
          <div style="font-size: 12px; color: #6b7280;">VADEXSA LOGISTIC S.A.C. · Portal del cliente</div>
          <div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">Visita de ejemplo · Sin conexión a cuenta de un servicio real</div>
        </div>
      </div>
    </div>

    <!-- Modal de detalle del servicio -->
    <div class="modal-overlay" id="modalDetalle">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Detalle del servicio</h3>
            <div class="modal-subtitle" id="modalSubtitle">SV-00440 · Datos de ejemplo</div>
          </div>
          <button class="modal-close" onclick="cerrarModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="modal-badge">
            <span class="badge-completado" id="modalEstado">COMPLETADO</span>
          </div>
          
          <div class="modal-grid">
            <div class="modal-field">
              <div class="modal-field-label">Fecha y hora</div>
              <div class="modal-field-value" id="modalFecha">07 oct. 2026 · 09:15</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Tipo de carga</div>
              <div class="modal-field-value" id="modalCarga">Bobinas de acero · 24,5 toneladas</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Origen</div>
              <div class="modal-field-value" id="modalOrigen">Callao</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Destino</div>
              <div class="modal-field-value" id="modalDestino">Huachipa</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Guía remitente</div>
              <div class="modal-field-value texto-guia" id="modalGuiaRemitente">GRR-001-98440</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Guía transportista</div>
              <div class="modal-field-value texto-guia" id="modalGuiaTransportista">GRT-001-98440</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Comprobante</div>
              <div class="modal-field-value" id="modalComprobante">F002-000451</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Monto del servicio</div>
              <div class="modal-field-value" id="modalMonto">S/ 1,250.00</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Forma de pago</div>
              <div class="modal-field-value" id="modalFormaPago">Transferencia · Pagado</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Placa</div>
              <div class="modal-field-value" id="modalPlaca">V4X-882</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Agregar funcionalidad de modal después de renderizar
  setTimeout(() => {
    // Funciones globales para el modal
    window.abrirModal = function(servicioId) {
      const modal = document.getElementById('modalDetalle');
      
      // Datos de ejemplo para cada servicio
      const servicios = {
        '1': {
          codigo: 'SV-00440',
          estado: 'COMPLETADO',
          estadoClass: 'badge-completado',
          fecha: '07 oct. 2026 · 09:15',
          carga: 'Bobinas de acero · 24,5 toneladas',
          origen: 'Callao',
          destino: 'Huachipa',
          guiaRemitente: 'GRR-001-98440',
          guiaTransportista: 'GRT-001-98440',
          comprobante: 'F002-000451',
          monto: 'S/ 1,250.00',
          formaPago: 'Transferencia · Pagado',
          placa: 'V4X-882'
        },
        '2': {
          codigo: 'SV-00438',
          estado: 'LIQUIDACIÓN',
          estadoClass: 'badge-liquidacion',
          fecha: '06 oct. 2026 · 14:50',
          carga: 'Perfiles estructurales · 18 toneladas',
          origen: 'Ate Vitarte',
          destino: 'Villa El Salvador',
          guiaRemitente: 'GRR-001-98438',
          guiaTransportista: 'GRT-001-98438',
          comprobante: 'Pendiente',
          monto: 'S/ 850.00',
          formaPago: 'Crédito · Pendiente de pago',
          placa: 'V5X-991'
        }
      };
      
      const data = servicios[servicioId];
      if (data) {
        document.getElementById('modalSubtitle').textContent = `${data.codigo} · Datos de ejemplo`;
        document.getElementById('modalEstado').textContent = data.estado;
        document.getElementById('modalEstado').className = data.estadoClass;
        document.getElementById('modalFecha').textContent = data.fecha;
        document.getElementById('modalCarga').textContent = data.carga;
        document.getElementById('modalOrigen').textContent = data.origen;
        document.getElementById('modalDestino').textContent = data.destino;
        document.getElementById('modalGuiaRemitente').textContent = data.guiaRemitente;
        document.getElementById('modalGuiaTransportista').textContent = data.guiaTransportista;
        document.getElementById('modalComprobante').textContent = data.comprobante;
        document.getElementById('modalMonto').textContent = data.monto;
        document.getElementById('modalFormaPago').textContent = data.formaPago;
        document.getElementById('modalPlaca').textContent = data.placa;
      }
      
      modal.classList.add('active');
    };
    
    window.cerrarModal = function() {
      const modal = document.getElementById('modalDetalle');
      modal.classList.remove('active');
    };
    
    // Cerrar modal al hacer clic fuera
    document.getElementById('modalDetalle').addEventListener('click', function(e) {
      if (e.target === this) {
        cerrarModal();
      }
    });
    
    // Event listeners para botones de detalle
    document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const servicioId = this.getAttribute('data-servicio');
        abrirModal(servicioId);
      });
    });
  }, 100);
}

export async function renderProgramacion(container) {
  container.innerHTML = `<div style="padding: 100px; text-align: center; color: #9ca3af;">Programación - En desarrollo</div>`;
}

export async function renderMisReportes(container) {
  container.innerHTML = `<div style="padding: 100px; text-align: center; color: #9ca3af;">Mis Reportes - En desarrollo</div>`;
}

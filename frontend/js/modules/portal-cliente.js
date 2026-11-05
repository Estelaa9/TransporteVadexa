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
        background: #F3F8F8;
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
        height: 6px;
        background: #e5e7eb;
        position: relative;
        border-radius: 3px;
      }
      
      .ruta-progreso {
        height: 100%;
        background: #0891b2;
        width: 55%;
        border-radius: 3px;
        position: relative;
      }
      
      .ruta-dot {
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        width: 12px;
        height: 12px;
        background: #0891b2;
        border-radius: 50%;
      }
      
      .btn-detalle {
        background: #1e3a5f;
        color: white;
        border: none;
        padding: 11px 24px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .btn-detalle:hover {
        background: #152d47;
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
        padding: 10px 18px;
        border-radius: 8px;
        color: #6b7280;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
      }
      
      .btn-filtro:hover {
        border-color: #0891b2;
        color: #0891b2;
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
      
      .badge-en-ruta {
        background: #cffafe;
        color: #0891b2;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
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
                  <div class="ruta-dot" style="display: flex; align-items: center; justify-content: center;">
                    <svg style="width: 14px; height: 14px;" fill="white" viewBox="0 0 24 24">
                      <path d="M18,18.5A1.5,1.5 0 0,1 16.5,17A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 19.5,17A1.5,1.5 0 0,1 18,18.5M19.5,9.5L21.46,12H17V9.5M6,18.5A1.5,1.5 0 0,1 4.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,17A1.5,1.5 0 0,1 6,18.5M20,8H17V4H3C1.89,4 1,4.89 1,6V17H3A3,3 0 0,0 6,20A3,3 0 0,0 9,17H15A3,3 0 0,0 18,20A3,3 0 0,0 21,17H23V12L20,8Z"/>
                    </svg>
                  </div>
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

            <button class="btn-detalle" style="width: 100%;" onclick="abrirModalSeguimiento()">Ver detalle completo</button>
          </div>
        </div>

        <!-- Historial de servicios - Título y controles fuera del card -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #1e3a5f; margin: 0;">Historial de servicios</h2>
          <button class="btn-filtro" onclick="abrirModalFiltro()" style="background: white; border: 1px solid #d1d5db; padding: 10px 18px; border-radius: 8px; color: #6b7280; font-weight: 500; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <button class="btn-ver-detalle" data-servicio="1" style="background: none; border: none; cursor: pointer; color: #0891b2; font-size: 20px; padding: 4px 8px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7 17L17 7M17 7H7M17 7V17"/>
                    </svg>
                  </button>
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
                  <button class="btn-ver-detalle" data-servicio="2" style="background: none; border: none; cursor: pointer; color: #0891b2; font-size: 20px; padding: 4px 8px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7 17L17 7M17 7H7M17 7V17"/>
                    </svg>
                  </button>
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
            <span id="modalEstadoBadge" class="badge-en-ruta">EN RUTA</span>
          </div>
          
          <div class="modal-grid">
            <div class="modal-field">
              <div class="modal-field-label">Fecha y hora</div>
              <div class="modal-field-value" id="modalFecha">08 oct. 2026 · 08:45</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Tipo de carga</div>
              <div class="modal-field-value" id="modalCarga">Bobinas de acero · 24,5 toneladas</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Origen</div>
              <div class="modal-field-value" id="modalOrigen">Puerto del Callao, Muelle Sur</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Destino</div>
              <div class="modal-field-value" id="modalDestino">Planta Industrial Lurín, Km 40</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Guía remitente</div>
              <div class="modal-field-value texto-guia" id="modalGuiaRemitente">GRR-001-98442</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Guía transportista</div>
              <div class="modal-field-value texto-guia" id="modalGuiaTransportista">GRT-001-98442</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Comprobante</div>
              <div class="modal-field-value" id="modalComprobante">Pendiente</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Monto del servicio</div>
              <div class="modal-field-value" id="modalMonto">S/ 1,450.00</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Forma de pago</div>
              <div class="modal-field-value" id="modalFormaPago">Transferencia · Pendiente</div>
            </div>
            
            <div class="modal-field">
              <div class="modal-field-label">Placa</div>
              <div class="modal-field-value" id="modalPlaca">V4X-882</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de filtro por fecha -->
    <div class="modal-overlay" id="modalFiltro">
      <div class="modal-content" style="max-width: 600px;">
        <div style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #e5e7eb; position: relative;">
          <h3 style="font-size: 20px; font-weight: 600; color: #1e3a5f; margin: 0 0 6px 0;">Filtrar por fecha</h3>
          <p style="font-size: 14px; color: #94a3b8; margin: 0;">Selecciona el rango de fechas</p>
          <button onclick="cerrarModalFiltro()" style="position: absolute; top: 28px; right: 32px; background: transparent; border: none; color: #94a3b8; font-size: 22px; cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">×</button>
        </div>
        <div style="padding: 28px 32px 32px 32px;">
          <div style="margin-bottom: 24px;">
            <label style="display: block; font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Fecha desde</label>
            <div style="position: relative;">
              <input type="text" id="fechaDesdeInput" placeholder="01/10/2026" style="width: 100%; padding: 12px 75px 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; color: #1e3a5f; font-weight: 500; background: white;" value="01/10/2026">
              <input type="date" id="fechaDesde" style="position: absolute; opacity: 0; pointer-events: none;" value="2026-10-01">
              <div style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); display: flex; gap: 8px; align-items: center;">
                <button onclick="document.getElementById('fechaDesde').showPicker()" style="background: none; border: none; cursor: pointer; padding: 0; display: flex;">
                  <svg style="width: 18px; height: 18px; color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </button>
                <button onclick="document.getElementById('fechaDesdeInput').value=''; document.getElementById('fechaDesde').value='';" style="background: none; border: none; cursor: pointer; padding: 0; display: flex;">
                  <svg style="width: 18px; height: 18px; color: #d1d5db;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 28px;">
            <label style="display: block; font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Fecha hasta</label>
            <div style="position: relative;">
              <input type="text" id="fechaHastaInput" placeholder="08/10/2026" style="width: 100%; padding: 12px 75px 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; color: #1e3a5f; font-weight: 500; background: white;" value="08/10/2026">
              <input type="date" id="fechaHasta" style="position: absolute; opacity: 0; pointer-events: none;" value="2026-10-08">
              <div style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); display: flex; gap: 8px; align-items: center;">
                <button onclick="document.getElementById('fechaHasta').showPicker()" style="background: none; border: none; cursor: pointer; padding: 0; display: flex;">
                  <svg style="width: 18px; height: 18px; color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </button>
                <button onclick="document.getElementById('fechaHastaInput').value=''; document.getElementById('fechaHasta').value='';" style="background: none; border: none; cursor: pointer; padding: 0; display: flex;">
                  <svg style="width: 18px; height: 18px; color: #d1d5db;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div style="display: flex; gap: 14px;">
            <button onclick="aplicarFiltroFecha()" style="flex: 2; background: #0891b2; color: white; border: none; padding: 13px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s;">
              Aplicar filtro
            </button>
            <button onclick="limpiarFiltroFecha()" style="flex: 1; background: #f3f4f6; color: #6b7280; border: none; padding: 13px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s;">
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Agregar funcionalidad de modal después de renderizar
  setTimeout(() => {
    // Datos de todos los servicios
    const todosLosServicios = [
      {
        id: '1',
        fecha: '07 oct. 2026',
        hora: '09:15',
        carga: 'Bobinas de acero',
        peso: '24,5 toneladas',
        origen: 'Callao',
        destino: 'Huachipa',
        guia: 'GRT-001-98440',
        factura: 'F002-00451',
        estado: 'completado',
        monto: 'S/ 1,298.00',
        pagado: true
      },
      {
        id: '2',
        fecha: '06 oct. 2026',
        hora: '14:50',
        carga: 'Perfiles estructurales',
        peso: '18 toneladas',
        origen: 'Ate Vitarte',
        destino: 'Villa El Salvador',
        guia: 'GRT-001-98438',
        factura: 'Pendiente',
        estado: 'liquidacion',
        monto: 'S/ 850.00',
        pagado: false
      }
    ];
    
    let filtroActivo = 'todos'; // 'todos', 'finalizados', 'liquidacion'
    
    function renderizarTabla(filtro) {
      filtroActivo = filtro;
      
      // Filtrar servicios
      let serviciosFiltrados = todosLosServicios;
      if (filtro === 'finalizados') {
        serviciosFiltrados = todosLosServicios.filter(s => s.estado === 'completado');
      } else if (filtro === 'liquidacion') {
        serviciosFiltrados = todosLosServicios.filter(s => s.estado === 'liquidacion');
      }
      
      // Actualizar tabs activos
      document.querySelectorAll('.historial-tab').forEach((tab, index) => {
        tab.classList.remove('active');
        if ((index === 0 && filtro === 'todos') ||
            (index === 1 && filtro === 'finalizados') ||
            (index === 2 && filtro === 'liquidacion')) {
          tab.classList.add('active');
        }
      });
      
      // Renderizar filas
      const tbody = document.querySelector('.historial-table tbody');
      if (serviciosFiltrados.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 60px; color: #9ca3af;">
              <div style="font-size: 15px; margin-bottom: 8px;">No hay servicios en esta categoría</div>
              <div style="font-size: 13px;">Intenta con otro filtro</div>
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = serviciosFiltrados.map(s => `
          <tr class="historial-row" data-servicio="${s.id}">
            <td>
              <div style="font-weight: 600; color: #1e3a5f;">${s.fecha}</div>
              <div class="texto-secundario">${s.hora}</div>
            </td>
            <td>
              <div class="texto-carga">${s.carga}</div>
              <div class="texto-secundario">${s.peso}</div>
            </td>
            <td>
              <div style="color: #1e3a5f; font-weight: 500;">${s.origen}</div>
              <div class="texto-secundario">→ ${s.destino}</div>
            </td>
            <td>
              <div class="texto-guia">${s.guia}</div>
              <div class="texto-secundario">${s.factura}</div>
            </td>
            <td>
              <span class="${s.estado === 'completado' ? 'badge-completado' : 'badge-liquidacion'}">
                ${s.estado === 'completado' ? 'COMPLETADO' : 'LIQUIDACIÓN'}
              </span>
            </td>
            <td style="text-align: right;">
              <div style="font-weight: 700; font-size: 15px; color: #1e3a5f;">${s.monto}</div>
              <div style="font-size: 12px; color: ${s.pagado ? '#10b981' : '#9ca3af'}; margin-top: 3px;">
                ${s.pagado ? 'PAGADO' : 'PENDIENTE DE PAGO'}
              </div>
            </td>
            <td style="text-align: center;">
              <button class="btn-ver-detalle" data-servicio="${s.id}" style="background: none; border: none; cursor: pointer; color: #0891b2; font-size: 20px; padding: 4px 8px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
              </button>
            </td>
          </tr>
        `).join('');
        
        // Re-agregar event listeners
        document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const servicioId = this.getAttribute('data-servicio');
            abrirModal(servicioId);
          });
        });
      }
      
      // Actualizar footer
      const footer = document.querySelector('.footer-text');
      footer.textContent = `Mostrando ${serviciosFiltrados.length} servicio${serviciosFiltrados.length !== 1 ? 's' : ''} · Datos de ejemplo`;
    }
    
    // Event listeners para tabs
    document.querySelectorAll('.historial-tab').forEach((tab, index) => {
      tab.addEventListener('click', function() {
        if (index === 0) renderizarTabla('todos');
        else if (index === 1) renderizarTabla('finalizados');
        else if (index === 2) renderizarTabla('liquidacion');
      });
    });
    
    // Funciones globales para el modal de seguimiento activo
    window.abrirModalSeguimiento = function() {
      const modal = document.getElementById('modalDetalle');
      
      // Datos del servicio activo
      document.getElementById('modalSubtitle').textContent = 'SV-00442 · Datos de ejemplo';
      document.getElementById('modalEstadoBadge').textContent = 'EN RUTA';
      document.getElementById('modalEstadoBadge').className = 'badge-en-ruta';
      document.getElementById('modalFecha').textContent = '08 oct. 2026 · 08:45';
      document.getElementById('modalCarga').textContent = 'Bobinas de acero · 24,5 toneladas';
      document.getElementById('modalOrigen').textContent = 'Puerto del Callao, Muelle Sur';
      document.getElementById('modalDestino').textContent = 'Planta Industrial Lurín, Km 40';
      document.getElementById('modalGuiaRemitente').textContent = 'GRR-001-98442';
      document.getElementById('modalGuiaTransportista').textContent = 'GRT-001-98442';
      document.getElementById('modalComprobante').textContent = 'Pendiente';
      document.getElementById('modalMonto').textContent = 'S/ 1,450.00';
      document.getElementById('modalFormaPago').textContent = 'Transferencia · Pendiente';
      document.getElementById('modalPlaca').textContent = 'V4X-882';
      
      modal.classList.add('active');
    };
    
    // Funciones globales para el modal de historial
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
        document.getElementById('modalEstadoBadge').textContent = data.estado;
        document.getElementById('modalEstadoBadge').className = data.estadoClass;
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
    
    // Modal de filtro por fecha
    window.abrirModalFiltro = function() {
      const modal = document.getElementById('modalFiltro');
      modal.classList.add('active');
    };
    
    window.cerrarModalFiltro = function() {
      const modal = document.getElementById('modalFiltro');
      modal.classList.remove('active');
    };
    
    window.aplicarFiltroFecha = function() {
      const desde = document.getElementById('fechaDesde').value;
      const hasta = document.getElementById('fechaHasta').value;
      
      // Aquí iría la lógica de filtrado real
      console.log('Filtrando desde:', desde, 'hasta:', hasta);
      
      // Cerrar modal
      cerrarModalFiltro();
      
      // Mostrar mensaje (temporal)
      if (desde && hasta) {
        alert(`Filtro aplicado: ${desde} a ${hasta}\n(En producción, esto filtraría los servicios)`);
      }
    };
    
    window.limpiarFiltroFecha = function() {
      document.getElementById('fechaDesdeInput').value = '';
      document.getElementById('fechaDesde').value = '';
      document.getElementById('fechaHastaInput').value = '';
      document.getElementById('fechaHasta').value = '';
    };
    
    // Sincronizar inputs de fecha
    window.addEventListener('load', () => {
      const fechaDesdeDate = document.getElementById('fechaDesde');
      const fechaDesdeInput = document.getElementById('fechaDesdeInput');
      const fechaHastaDate = document.getElementById('fechaHasta');
      const fechaHastaInput = document.getElementById('fechaHastaInput');
      
      if (fechaDesdeDate && fechaDesdeInput) {
        fechaDesdeDate.addEventListener('change', function() {
          if (this.value) {
            const [año, mes, dia] = this.value.split('-');
            fechaDesdeInput.value = `${dia}/${mes}/${año}`;
          }
        });
      }
      
      if (fechaHastaDate && fechaHastaInput) {
        fechaHastaDate.addEventListener('change', function() {
          if (this.value) {
            const [año, mes, dia] = this.value.split('-');
            fechaHastaInput.value = `${dia}/${mes}/${año}`;
          }
        });
      }
    });
    
    // Cerrar modales al hacer clic fuera
    document.getElementById('modalDetalle').addEventListener('click', function(e) {
      if (e.target === this) cerrarModal();
    });
    
    document.getElementById('modalFiltro').addEventListener('click', function(e) {
      if (e.target === this) cerrarModalFiltro();
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
        background: #F3F8F8;
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
        padding: 0;
        margin-bottom: 24px;
        overflow: hidden;
      }
      
      .badge-en-ruta {
        background: #cffafe;
        color: #0891b2;
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
      
      .footer-text {
        text-align: center;
        padding: 20px 0;
        color: #9ca3af;
        font-size: 12px;
        margin-top: 0;
      }
      
      .btn-fecha {
        background: white;
        border: 1px solid #d1d5db;
        padding: 8px 16px;
        border-radius: 6px;
        color: #1e3a5f;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .btn-hoy {
        background: white;
        border: 1px solid #d1d5db;
        padding: 8px 20px;
        border-radius: 6px;
        color: #1e3a5f;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
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
            <div class="portal-nav-item">Mis servicios</div>
            <div class="portal-nav-item active">Programación</div>
            <div class="portal-nav-item">Mis reportes</div>
          </div>
          
          <div>
            <div class="portal-user-empresa">Corporación Aceros S.A.</div>
            <div class="portal-user-cuenta">Cuenta de ejemplo</div>
          </div>
        </div>
      </div>

      <div class="portal-content">
        <!-- Título con selector de fecha -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: 600; color: #1e3a5f; margin: 0;">Mi programación diaria</h1>
          <div style="display: flex; gap: 12px; align-items: center;">
            <div style="position: relative;">
              <input type="date" id="fechaProgramacion" value="2026-10-08" style="padding: 10px 14px 10px 40px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; color: #1e3a5f; font-weight: 500; cursor: pointer; background: white;">
              <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #6b7280; pointer-events: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <button class="btn-hoy" onclick="seleccionarHoyProgramacion()">Hoy</button>
          </div>
        </div>

        <div class="section-card">
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
              <tr>
                <td>
                  <div style="font-weight: 600; color: #1e3a5f;">08 oct. 2026</div>
                  <div class="texto-secundario">08:45</div>
                </td>
                <td>
                  <div class="texto-carga">Bobinas de acero</div>
                  <div class="texto-secundario">24,5 toneladas</div>
                </td>
                <td>
                  <div style="color: #1e3a5f; font-weight: 500;">Puerto del Callao, Muelle Sur</div>
                  <div class="texto-secundario">→ Planta Industrial Lurín, Km 40</div>
                </td>
                <td>
                  <div class="texto-guia">GRT-001-98442</div>
                  <div class="texto-secundario">Pendiente</div>
                </td>
                <td>
                  <span class="badge-en-ruta">EN RUTA</span>
                </td>
                <td style="text-align: right;">
                  <div style="font-weight: 700; font-size: 15px; color: #1e3a5f;">S/ 1,450.00</div>
                  <div style="font-size: 12px; color: #9ca3af; margin-top: 3px;">PENDIENTE DE PAGO</div>
                </td>
                <td style="text-align: center;">
                  <button class="btn-ver-detalle-prog" style="background: none; border: none; cursor: pointer; color: #0891b2; font-size: 20px; padding: 4px 8px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7 17L17 7M17 7H7M17 7V17"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="footer-text">
            Mostrando 1 servicio · Datos de ejemplo
          </div>
        </div>

        <div style="text-align: center; padding: 32px 0; border-top: 1px solid #e5e7eb; margin-top: 32px;">
          <div style="font-size: 12px; color: #6b7280;">VADEXSA LOGISTIC S.A.C. · Portal del cliente</div>
          <div style="font-size: 11px; color: #f59e0b; margin-top: 4px;">Vista de ejemplo · Sin conexión a cuenta ni servicios reales</div>
        </div>
      </div>
    </div>
  `;

  // Activar navegación
  setTimeout(() => {
    document.querySelectorAll('.portal-nav-item').forEach((item, index) => {
      item.addEventListener('click', function() {
        if (index === 0) window.location.hash = '#servicios';
        else if (index === 1) window.location.hash = '#programacion';
        else if (index === 2) window.location.hash = '#reportes';
      });
    });
    
    // Agregar evento al botón de detalle
    const btnDetalle = document.querySelector('.btn-ver-detalle-prog');
    if (btnDetalle) {
      btnDetalle.addEventListener('click', function() {
        // Abrir el modal con datos de programación
        if (typeof window.abrirModalProgramacion === 'function') {
          window.abrirModalProgramacion();
        }
      });
    }
    
    // Crear modal de detalle si no existe
    if (!document.getElementById('modalDetalleProg')) {
      const modalHTML = `
        <div class="modal-overlay" id="modalDetalleProg" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 1000;">
          <div style="background: white; border-radius: 12px; width: 90%; max-width: 700px; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="padding: 28px 32px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h3 style="font-size: 20px; font-weight: 600; color: #1e3a5f; margin: 0;">Detalle del servicio</h3>
                <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">SV-00442 · Datos de ejemplo</div>
              </div>
              <button onclick="cerrarModalProgramacion()" style="background: #f3f4f6; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; color: #6b7280; font-size: 20px;">×</button>
            </div>
            <div style="padding: 32px;">
              <div style="margin-bottom: 24px;">
                <span style="background: #cffafe; color: #0891b2; padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase;">EN RUTA</span>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 28px;">
                <div style="margin-bottom: 24px;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Fecha y hora</div>
                  <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">08 oct. 2026 · 08:45</div>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Tipo de carga</div>
                  <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">Bobinas de acero · 24,5 toneladas</div>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Origen</div>
                  <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">Puerto del Callao, Muelle Sur</div>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Destino</div>
                  <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">Planta Industrial Lurín, Km 40</div>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Guía remitente</div>
                  <div style="font-size: 15px; color: #0891b2; font-weight: 600; font-family: monospace;">GRR-001-98442</div>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Guía transportista</div>
                  <div style="font-size: 15px; color: #0891b2; font-weight: 600; font-family: monospace;">GRT-001-98442</div>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Comprobante</div>
                  <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">Pendiente</div>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Monto del servicio</div>
                  <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">S/ 1,450.00</div>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Forma de pago</div>
                  <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">Transferencia · Pendiente</div>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Placa</div>
                  <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">V4X-882</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      // Funciones globales para el modal
      window.abrirModalProgramacion = function() {
        document.getElementById('modalDetalleProg').style.display = 'flex';
      };
      
      window.cerrarModalProgramacion = function() {
        document.getElementById('modalDetalleProg').style.display = 'none';
      };
      
      // Cerrar al hacer clic fuera
      document.getElementById('modalDetalleProg').addEventListener('click', function(e) {
        if (e.target === this) {
          cerrarModalProgramacion();
        }
      });
    }
    
    // Crear modal de calendario
    if (!document.getElementById('modalCalendario')) {
      const calendarioHTML = `
        <div class="modal-overlay" id="modalCalendario" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 1000;">
          <div style="background: white; border-radius: 12px; width: 90%; max-width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <button onclick="cambiarMes(-1)" style="background: none; border: none; cursor: pointer; font-size: 20px; color: #6b7280;">↑</button>
              <h3 style="font-size: 16px; font-weight: 600; color: #1e3a5f; margin: 0;">Octubre de 2026</h3>
              <button onclick="cambiarMes(1)" style="background: none; border: none; cursor: pointer; font-size: 20px; color: #6b7280;">↓</button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 16px;">
              <div style="text-align: center; font-size: 11px; font-weight: 600; color: #6b7280; padding: 8px 0;">DO</div>
              <div style="text-align: center; font-size: 11px; font-weight: 600; color: #6b7280; padding: 8px 0;">LU</div>
              <div style="text-align: center; font-size: 11px; font-weight: 600; color: #6b7280; padding: 8px 0;">MA</div>
              <div style="text-align: center; font-size: 11px; font-weight: 600; color: #6b7280; padding: 8px 0;">MI</div>
              <div style="text-align: center; font-size: 11px; font-weight: 600; color: #6b7280; padding: 8px 0;">JU</div>
              <div style="text-align: center; font-size: 11px; font-weight: 600; color: #6b7280; padding: 8px 0;">VI</div>
              <div style="text-align: center; font-size: 11px; font-weight: 600; color: #6b7280; padding: 8px 0;">SA</div>
              
              ${generarDiasCalendario(2026, 9)}
            </div>
            
            <div style="display: flex; justify-content: space-between; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <button onclick="limpiarFechaCalendario()" style="background: none; border: none; color: #0891b2; font-weight: 600; font-size: 14px; cursor: pointer;">Borrar</button>
              <button onclick="seleccionarHoy()" style="background: none; border: none; color: #0891b2; font-weight: 600; font-size: 14px; cursor: pointer;">Hoy</button>
            </div>
            
            <div style="text-align: center; margin-top: 12px; font-size: 12px; color: #94a3b8;" id="servicioSeleccionado">SV-00438</div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', calendarioHTML);
      
      // Funciones del calendario
      window.generarDiasCalendario = function(year, month) {
        const primerDia = new Date(year, month, 1).getDay();
        const diasEnMes = new Date(year, month + 1, 0).getDate();
        const diasMesAnterior = new Date(year, month, 0).getDate();
        
        let html = '';
        
        // Días del mes anterior
        for (let i = primerDia - 1; i >= 0; i--) {
          html += `<div style="text-align: center; padding: 10px; color: #d1d5db; font-size: 14px;">${diasMesAnterior - i}</div>`;
        }
        
        // Días del mes actual
        for (let dia = 1; dia <= diasEnMes; dia++) {
          const esHoy = (dia === 8);
          const esSeleccionado = (dia === 31);
          const bgColor = esSeleccionado ? '#1e3a5f' : (esHoy ? '#374151' : 'transparent');
          const textColor = (esSeleccionado || esHoy) ? 'white' : '#1e3a5f';
          const cursor = 'pointer';
          
          html += `<div onclick="seleccionarDia(${dia})" style="text-align: center; padding: 10px; background: ${bgColor}; color: ${textColor}; font-size: 14px; font-weight: ${esSeleccionado ? '600' : '400'}; border-radius: 6px; cursor: ${cursor}; transition: background 0.2s;">${dia}</div>`;
        }
        
        return html;
      };
      
      window.cambiarMes = function(direccion) {
        console.log('Cambiar mes:', direccion);
      };
      
      window.seleccionarDia = function(dia) {
        cerrarModalCalendario();
        alert(`Fecha seleccionada: ${dia}/10/2026`);
      };
      
      window.limpiarFechaCalendario = function() {
        cerrarModalCalendario();
      };
      
      window.seleccionarHoy = function() {
        cerrarModalCalendario();
        alert('Fecha seleccionada: Hoy (08/10/2026)');
      };
      
      window.abrirModalCalendario = function() {
        document.getElementById('modalCalendario').style.display = 'flex';
      };
      
      window.cerrarModalCalendario = function() {
        document.getElementById('modalCalendario').style.display = 'none';
      };
      
      document.getElementById('modalCalendario').addEventListener('click', function(e) {
        if (e.target === this) {
          cerrarModalCalendario();
        }
      });
    }
    
    // Evento para el botón de fecha
    const btnFecha = document.querySelector('.btn-fecha');
    if (btnFecha) {
      btnFecha.addEventListener('click', abrirModalCalendario);
    }
    
    // Función para seleccionar "Hoy" en programación
    window.seleccionarHoyProgramacion = function() {
      const inputFecha = document.getElementById('fechaProgramacion');
      if (inputFecha) {
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        inputFecha.value = `${año}-${mes}-${dia}`;
      }
    };
  }, 100);
}

export async function renderMisReportes(container) {
  container.innerHTML = `
    <div style="background: #F3F8F8; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 20px 48px;">
          <div>
            <div style="font-size: 20px; font-weight: 700; color: #1e3a5f;">VADEXSA</div>
            <div style="font-size: 10px; color: #0891b2; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">LOGISTIC · PORTAL DEL CLIENTE</div>
          </div>
          
          <div style="display: flex; gap: 48px;">
            <div style="padding: 8px 0; color: #6b7280; font-weight: 500; font-size: 15px; cursor: pointer; border-bottom: 3px solid transparent;" onclick="window.location.hash='#servicios'">Mis servicios</div>
            <div style="padding: 8px 0; color: #6b7280; font-weight: 500; font-size: 15px; cursor: pointer; border-bottom: 3px solid transparent;" onclick="window.location.hash='#programacion'">Programación</div>
            <div style="padding: 8px 0; color: #1e3a5f; font-weight: 500; font-size: 15px; cursor: pointer; border-bottom: 3px solid #0891b2;">Mis reportes</div>
          </div>
          
          <div>
            <div style="font-size: 13px; font-weight: 600; color: #1e3a5f; text-align: right;">Corporación Aceros S.A.</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px; text-align: right;">Cuenta de ejemplo</div>
          </div>
        </div>
      </div>

      <div style="max-width: 1400px; margin: 0 auto; padding: 32px 48px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #1e3a5f; margin: 0 0 32px 0;">Mis reportes</h1>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <!-- Card Servicios -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 36px; transition: all 0.2s;">
            <div style="width: 48px; height: 48px; background: #dbeafe; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <svg style="width: 28px; height: 28px; color: #0891b2;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
              </svg>
            </div>
            <h3 style="font-size: 19px; font-weight: 600; color: #1e3a5f; margin-bottom: 10px;">Servicios</h3>
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 24px;">Historial de tus servicios, rutas, guías y estados</p>
            <button onclick="window.location.hash='#reportes/servicios'" style="background: #1e3a5f; color: white; border: none; padding: 11px 24px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;">Ver reporte</button>
          </div>

          <!-- Card Facturación -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 36px; transition: all 0.2s;">
            <div style="width: 48px; height: 48px; background: #dbeafe; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <svg style="width: 28px; height: 28px; color: #0891b2;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 style="font-size: 19px; font-weight: 600; color: #1e3a5f; margin-bottom: 10px;">Facturación</h3>
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 24px;">Comprobantes, importes y formas de pago de tus servicios</p>
            <button onclick="window.location.hash='#reportes/facturacion'" style="background: #1e3a5f; color: white; border: none; padding: 11px 24px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;">Ver reporte</button>
          </div>
        </div>

        <div style="text-align: center; padding: 32px 0; border-top: 1px solid #e5e7eb; margin-top: 64px;">
          <div style="font-size: 12px; color: #6b7280;">VADEXSA LOGISTIC S.A.C. · Portal del cliente</div>
          <div style="font-size: 11px; color: #f59e0b; margin-top: 4px;">Vista de ejemplo · Sin conexión a cuenta ni servicios reales</div>
        </div>
      </div>
    </div>
  `;
}


export async function renderReporteServicios(container) {
  container.innerHTML = `
    <div style="background: #F3F8F8; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 20px 48px;">
          <div>
            <div style="font-size: 20px; font-weight: 700; color: #1e3a5f;">VADEXSA</div>
            <div style="font-size: 10px; color: #0891b2; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">LOGISTIC · PORTAL DEL CLIENTE</div>
          </div>
          
          <div style="display: flex; gap: 48px;">
            <div style="padding: 8px 0; color: #6b7280; font-weight: 500; font-size: 15px; cursor: pointer; border-bottom: 3px solid transparent;" onclick="window.location.hash='#servicios'">Mis servicios</div>
            <div style="padding: 8px 0; color: #6b7280; font-weight: 500; font-size: 15px; cursor: pointer; border-bottom: 3px solid transparent;" onclick="window.location.hash='#programacion'">Programación</div>
            <div style="padding: 8px 0; color: #1e3a5f; font-weight: 500; font-size: 15px; cursor: pointer; border-bottom: 3px solid #0891b2;">Mis reportes</div>
          </div>
          
          <div>
            <div style="font-size: 13px; font-weight: 600; color: #1e3a5f; text-align: right;">Corporación Aceros S.A.</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px; text-align: right;">Cuenta de ejemplo</div>
          </div>
        </div>
      </div>

      <div style="max-width: 1400px; margin: 0 auto; padding: 32px 48px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 600; color: #1e3a5f; margin: 0;">Reporte de servicios</h1>
          <button onclick="window.location.hash='#reportes'" style="background: transparent; border: none; color: #0891b2; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            ← Mis reportes
          </button>
        </div>

        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <div style="display: flex; gap: 16px; align-items: end;">
            <div>
              <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">Desde</label>
              <input type="date" value="2026-10-01" style="padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; color: #1e3a5f; width: 160px;">
            </div>
            <div>
              <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">Hasta</label>
              <input type="date" value="2026-10-31" style="padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; color: #1e3a5f; width: 160px;">
            </div>
            <button onclick="descargarCSVServicios()" style="background: #1e3a5f; color: white; border: none; padding: 11px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
              <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Descargar CSV
            </button>
          </div>
        </div>

        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <tr>
                <th style="padding: 14px 20px; text-align: left; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase;">FECHA</th>
                <th style="padding: 14px 20px; text-align: left; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase;">CARGA</th>
                <th style="padding: 14px 20px; text-align: left; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase;">ORIGEN / DESTINO</th>
                <th style="padding: 14px 20px; text-align: left; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase;">GUÍA / FACTURA</th>
                <th style="padding: 14px 20px; text-align: left; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase;">ESTADO</th>
                <th style="padding: 14px 20px; text-align: right; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase;">MONTO</th>
                <th style="padding: 14px 20px; width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 18px 20px;">
                  <div style="font-weight: 600; color: #1e3a5f;">08 oct. 2026</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">08:45</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="color: #1e3a5f; font-weight: 500;">Bobinas de acero</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">24,5 toneladas</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="color: #1e3a5f; font-weight: 500;">Puerto del Callao, Muelle Sur</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">→ Planta Industrial Lurín, Km 40</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="font-family: monospace; color: #0891b2; font-weight: 600;">GRT-001-98442</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">Pendiente</div>
                </td>
                <td style="padding: 18px 20px;">
                  <span style="background: #cffafe; color: #0891b2; padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600;">EN RUTA</span>
                </td>
                <td style="padding: 18px 20px; text-align: right;">
                  <div style="font-weight: 700; font-size: 15px; color: #1e3a5f;">S/ 1,450.00</div>
                  <div style="font-size: 12px; color: #9ca3af; margin-top: 3px;">PENDIENTE DE PAGO</div>
                </td>
                <td style="padding: 18px 20px; text-align: center;">
                  <button onclick="abrirDetalleServicio('1')" style="background: none; border: none; cursor: pointer; color: #0891b2; font-size: 20px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7 17L17 7M17 7H7M17 7V17"/>
                    </svg>
                  </button>
                </td>
              </tr>
              
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 18px 20px;">
                  <div style="font-weight: 600; color: #1e3a5f;">07 oct. 2026</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">09:15</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="color: #1e3a5f; font-weight: 500;">Bobinas de acero</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">24,5 toneladas</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="color: #1e3a5f; font-weight: 500;">Callao</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">→ Huachipa</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="font-family: monospace; color: #0891b2; font-weight: 600;">GRT-001-98440</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">F002-00451</div>
                </td>
                <td style="padding: 18px 20px;">
                  <span style="background: #d1fae5; color: #065f46; padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600;">COMPLETADO</span>
                </td>
                <td style="padding: 18px 20px; text-align: right;">
                  <div style="font-weight: 700; font-size: 15px; color: #1e3a5f;">S/ 1,250.00</div>
                  <div style="font-size: 12px; color: #10b981; margin-top: 3px;">PAGADO</div>
                </td>
                <td style="padding: 18px 20px; text-align: center;">
                  <button onclick="abrirDetalleServicio('2')" style="background: none; border: none; cursor: pointer; color: #0891b2; font-size: 20px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7 17L17 7M17 7H7M17 7V17"/>
                    </svg>
                  </button>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 18px 20px;">
                  <div style="font-weight: 600; color: #1e3a5f;">06 oct. 2026</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">14:30</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="color: #1e3a5f; font-weight: 500;">Perfiles estructurales</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">18 toneladas</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="color: #1e3a5f; font-weight: 500;">Ate Vitarte</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">→ Villa El Salvador</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="font-family: monospace; color: #0891b2; font-weight: 600;">GRT-001-98438</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">Pendiente</div>
                </td>
                <td style="padding: 18px 20px;">
                  <span style="background: #fef3c7; color: #92400e; padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600;">LIQUIDACIÓN</span>
                </td>
                <td style="padding: 18px 20px; text-align: right;">
                  <div style="font-weight: 700; font-size: 15px; color: #1e3a5f;">S/ 850.00</div>
                  <div style="font-size: 12px; color: #9ca3af; margin-top: 3px;">PENDIENTE DE PAGO</div>
                </td>
                <td style="padding: 18px 20px; text-align: center;">
                  <button onclick="abrirDetalleServicio('3')" style="background: none; border: none; cursor: pointer; color: #0891b2; font-size: 20px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7 17L17 7M17 7H7M17 7V17"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div style="text-align: center; padding: 20px 0; color: #9ca3af; font-size: 12px;">
            Mostrando 3 servicios · Datos de ejemplo
          </div>
        </div>
      </div>
    </div>
  `;
  
  window.descargarCSVServicios = function() {
    // Datos de la tabla
    const datos = [
      ['Fecha', 'Hora', 'Carga', 'Peso', 'Origen', 'Destino', 'Guía', 'Factura', 'Estado', 'Monto', 'Estado Pago'],
      ['08 oct. 2026', '08:45', 'Bobinas de acero', '24,5 toneladas', 'Puerto del Callao, Muelle Sur', 'Planta Industrial Lurín, Km 40', 'GRT-001-98442', 'Pendiente', 'EN RUTA', 'S/ 1,450.00', 'PENDIENTE DE PAGO'],
      ['07 oct. 2026', '09:15', 'Bobinas de acero', '24,5 toneladas', 'Callao', 'Huachipa', 'GRT-001-98440', 'F002-00451', 'COMPLETADO', 'S/ 1,250.00', 'PAGADO'],
      ['06 oct. 2026', '14:30', 'Perfiles estructurales', '18 toneladas', 'Ate Vitarte', 'Villa El Salvador', 'GRT-001-98438', 'Pendiente', 'LIQUIDACIÓN', 'S/ 850.00', 'PENDIENTE DE PAGO']
    ];
    
    // Convertir a CSV
    let csvContent = '\uFEFF'; // BOM para Excel UTF-8
    datos.forEach(fila => {
      csvContent += fila.map(campo => `"${campo}"`).join(',') + '\n';
    });
    
    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'reporte_servicios_' + new Date().toISOString().slice(0,10) + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Modal de detalle de servicio
  window.abrirDetalleServicio = function(servicioId) {
    const servicios = {
      '1': {
        codigo: 'SV-00442',
        fecha: '08 oct. 2026 · 08:45',
        carga: 'Bobinas de acero · 24,5 toneladas',
        origen: 'Puerto del Callao, Muelle Sur',
        destino: 'Planta Industrial Lurín, Km 40',
        guiaRemitente: 'GRR-001-98442',
        guiaTransportista: 'GRT-001-98442',
        comprobante: 'Pendiente',
        monto: 'S/ 1,450.00',
        formaPago: 'Transferencia · Pendiente',
        placa: 'V4X-882',
        estado: 'EN RUTA',
        estadoClass: 'badge-en-ruta'
      },
      '2': {
        codigo: 'SV-00440',
        fecha: '07 oct. 2026 · 09:15',
        carga: 'Bobinas de acero · 24,5 toneladas',
        origen: 'Callao',
        destino: 'Huachipa',
        guiaRemitente: 'GRR-001-98440',
        guiaTransportista: 'GRT-001-98440',
        comprobante: 'F002-000451',
        monto: 'S/ 1,250.00',
        formaPago: 'Transferencia · Pagado',
        placa: 'V4X-882',
        estado: 'COMPLETADO',
        estadoClass: 'badge-completado'
      },
      '3': {
        codigo: 'SV-00438',
        fecha: '06 oct. 2026 · 14:30',
        carga: 'Perfiles estructurales · 18 toneladas',
        origen: 'Ate Vitarte',
        destino: 'Villa El Salvador',
        guiaRemitente: 'GRR-001-98438',
        guiaTransportista: 'GRT-001-98438',
        comprobante: 'Pendiente',
        monto: 'S/ 850.00',
        formaPago: 'Crédito · Pendiente de pago',
        placa: 'V5X-991',
        estado: 'LIQUIDACIÓN',
        estadoClass: 'badge-liquidacion'
      }
    };
    
    const data = servicios[servicioId];
    if (!data) return;
    
    // Crear modal si no existe
    let modal = document.getElementById('modalDetalleReporte');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modalDetalleReporte';
      modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 1000;';
      document.body.appendChild(modal);
      
      modal.addEventListener('click', function(e) {
        if (e.target === this) cerrarDetalleServicio();
      });
    }
    
    const badgeStyles = {
      'badge-en-ruta': 'background: #cffafe; color: #0891b2;',
      'badge-completado': 'background: #d1fae5; color: #065f46;',
      'badge-liquidacion': 'background: #fef3c7; color: #92400e;'
    };
    
    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; width: 90%; max-width: 700px; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <div style="padding: 28px 32px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-size: 20px; font-weight: 600; color: #1e3a5f; margin: 0;">Detalle del servicio</h3>
            <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">${data.codigo} · Datos de ejemplo</div>
          </div>
          <button onclick="cerrarDetalleServicio()" style="background: #f3f4f6; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; color: #6b7280; font-size: 20px;">×</button>
        </div>
        <div style="padding: 32px;">
          <div style="margin-bottom: 24px;">
            <span style="${badgeStyles[data.estadoClass]} padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${data.estado}</span>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 28px;">
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Fecha y hora</div>
              <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">${data.fecha}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Tipo de carga</div>
              <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">${data.carga}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Origen</div>
              <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">${data.origen}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Destino</div>
              <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">${data.destino}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Guía remitente</div>
              <div style="font-size: 15px; color: #0891b2; font-weight: 600; font-family: monospace;">${data.guiaRemitente}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Guía transportista</div>
              <div style="font-size: 15px; color: #0891b2; font-weight: 600; font-family: monospace;">${data.guiaTransportista}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Comprobante</div>
              <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">${data.comprobante}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Monto del servicio</div>
              <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">${data.monto}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Forma de pago</div>
              <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">${data.formaPago}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Placa</div>
              <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">${data.placa}</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
  };
  
  window.cerrarDetalleServicio = function() {
    const modal = document.getElementById('modalDetalleReporte');
    if (modal) modal.style.display = 'none';
  };
}

export async function renderReporteFacturacion(container) {
  container.innerHTML = `
    <div style="background: #F3F8F8; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 20px 48px;">
          <div>
            <div style="font-size: 20px; font-weight: 700; color: #1e3a5f;">VADEXSA</div>
            <div style="font-size: 10px; color: #0891b2; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">LOGISTIC · PORTAL DEL CLIENTE</div>
          </div>
          
          <div style="display: flex; gap: 48px;">
            <div style="padding: 8px 0; color: #6b7280; font-weight: 500; font-size: 15px; cursor: pointer; border-bottom: 3px solid transparent;" onclick="window.location.hash='#servicios'">Mis servicios</div>
            <div style="padding: 8px 0; color: #6b7280; font-weight: 500; font-size: 15px; cursor: pointer; border-bottom: 3px solid transparent;" onclick="window.location.hash='#programacion'">Programación</div>
            <div style="padding: 8px 0; color: #1e3a5f; font-weight: 500; font-size: 15px; cursor: pointer; border-bottom: 3px solid #0891b2;">Mis reportes</div>
          </div>
          
          <div>
            <div style="font-size: 13px; font-weight: 600; color: #1e3a5f; text-align: right;">Corporación Aceros S.A.</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px; text-align: right;">Cuenta de ejemplo</div>
          </div>
        </div>
      </div>

      <div style="max-width: 1400px; margin: 0 auto; padding: 32px 48px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 600; color: #1e3a5f; margin: 0;">Reporte de facturación</h1>
          <button onclick="window.location.hash='#reportes'" style="background: transparent; border: none; color: #0891b2; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            ← Mis reportes
          </button>
        </div>

        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <div style="display: flex; gap: 16px; align-items: end;">
            <div>
              <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">Desde</label>
              <input type="date" value="2026-10-01" style="padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; color: #1e3a5f; width: 160px;">
            </div>
            <div>
              <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">Hasta</label>
              <input type="date" value="2026-10-31" style="padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; color: #1e3a5f; width: 160px;">
            </div>
            <button onclick="descargarCSVFacturacion()" style="background: #1e3a5f; color: white; border: none; padding: 11px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
              <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Descargar CSV
            </button>
          </div>
        </div>

        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <tr>
                <th style="padding: 14px 20px; text-align: left; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase;">FECHA</th>
                <th style="padding: 14px 20px; text-align: left; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase;">COMPROBANTE</th>
                <th style="padding: 14px 20px; text-align: left; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase;">FORMA DE PAGO</th>
                <th style="padding: 14px 20px; text-align: right; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase;">MONTO</th>
                <th style="padding: 14px 20px; width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 18px 20px;">
                  <div style="font-weight: 600; color: #1e3a5f;">08 oct. 2026</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">08:45</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="color: #6b7280; font-weight: 500;">Pendiente</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">SV-00442</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="color: #1e3a5f; font-weight: 500;">Transferencia · Pendiente</div>
                </td>
                <td style="padding: 18px 20px; text-align: right;">
                  <div style="font-weight: 700; font-size: 15px; color: #1e3a5f;">S/ 1,450.00</div>
                </td>
                <td style="padding: 18px 20px; text-align: center;">
                  <button onclick="abrirDetalleFacturacion('1')" style="background: none; border: none; cursor: pointer; color: #0891b2; font-size: 20px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7 17L17 7M17 7H7M17 7V17"/>
                    </svg>
                  </button>
                </td>
              </tr>
              
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 18px 20px;">
                  <div style="font-weight: 600; color: #1e3a5f;">07 oct. 2026</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">09:15</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="color: #0891b2; font-weight: 600;">F002-00451</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">SV-00440</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="color: #1e3a5f; font-weight: 500;">Transferencia · Pagado</div>
                </td>
                <td style="padding: 18px 20px; text-align: right;">
                  <div style="font-weight: 700; font-size: 15px; color: #1e3a5f;">S/ 1,250.00</div>
                </td>
                <td style="padding: 18px 20px; text-align: center;">
                  <button onclick="abrirDetalleFacturacion('2')" style="background: none; border: none; cursor: pointer; color: #0891b2; font-size: 20px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7 17L17 7M17 7H7M17 7V17"/>
                    </svg>
                  </button>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 18px 20px;">
                  <div style="font-weight: 600; color: #1e3a5f;">06 oct. 2026</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">14:30</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="color: #6b7280; font-weight: 500;">Pendiente</div>
                  <div style="color: #9ca3af; font-size: 13px; margin-top: 3px;">SV-00438</div>
                </td>
                <td style="padding: 18px 20px;">
                  <div style="color: #1e3a5f; font-weight: 500;">Transferencia · Pendiente</div>
                </td>
                <td style="padding: 18px 20px; text-align: right;">
                  <div style="font-weight: 700; font-size: 15px; color: #1e3a5f;">S/ 850.00</div>
                </td>
                <td style="padding: 18px 20px; text-align: center;">
                  <button onclick="abrirDetalleFacturacion('3')" style="background: none; border: none; cursor: pointer; color: #0891b2; font-size: 20px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7 17L17 7M17 7H7M17 7V17"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div style="text-align: center; padding: 20px 0; color: #9ca3af; font-size: 12px;">
            Mostrando 3 servicios · Datos de ejemplo
          </div>
        </div>
      </div>
    </div>
  `;
  
  window.descargarCSVFacturacion = function() {
    // Datos de la tabla
    const datos = [
      ['Fecha', 'Hora', 'Comprobante', 'Servicio', 'Forma de Pago', 'Monto'],
      ['08 oct. 2026', '08:45', 'Pendiente', 'SV-00442', 'Transferencia · Pendiente', 'S/ 1,450.00'],
      ['07 oct. 2026', '09:15', 'F002-00451', 'SV-00440', 'Transferencia · Pagado', 'S/ 1,250.00'],
      ['06 oct. 2026', '14:30', 'Pendiente', 'SV-00438', 'Transferencia · Pendiente', 'S/ 850.00']
    ];
    
    // Convertir a CSV
    let csvContent = '\uFEFF'; // BOM para Excel UTF-8
    datos.forEach(fila => {
      csvContent += fila.map(campo => `"${campo}"`).join(',') + '\n';
    });
    
    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'reporte_facturacion_' + new Date().toISOString().slice(0,10) + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Modal de detalle de facturación
  window.abrirDetalleFacturacion = function(facturaId) {
    const facturas = {
      '1': {
        codigo: 'SV-00442',
        fecha: '08 oct. 2026 · 08:45',
        comprobante: 'Pendiente',
        formaPago: 'Transferencia',
        estadoPago: 'Pendiente',
        monto: 'S/ 1,450.00',
        cliente: 'Corporación Aceros S.A.',
        ruc: '20123456789'
      },
      '2': {
        codigo: 'SV-00440',
        fecha: '07 oct. 2026 · 09:15',
        comprobante: 'F002-00451',
        formaPago: 'Transferencia',
        estadoPago: 'Pagado',
        monto: 'S/ 1,250.00',
        cliente: 'Corporación Aceros S.A.',
        ruc: '20123456789'
      },
      '3': {
        codigo: 'SV-00438',
        fecha: '06 oct. 2026 · 14:30',
        comprobante: 'Pendiente',
        formaPago: 'Transferencia',
        estadoPago: 'Pendiente',
        monto: 'S/ 850.00',
        cliente: 'Corporación Aceros S.A.',
        ruc: '20123456789'
      }
    };
    
    const data = facturas[facturaId];
    if (!data) return;
    
    // Crear modal si no existe
    let modal = document.getElementById('modalDetalleFactura');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modalDetalleFactura';
      modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 1000;';
      document.body.appendChild(modal);
      
      modal.addEventListener('click', function(e) {
        if (e.target === this) cerrarDetalleFacturacion();
      });
    }
    
    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <div style="padding: 28px 32px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-size: 20px; font-weight: 600; color: #1e3a5f; margin: 0;">Detalle de facturación</h3>
            <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">${data.codigo} · Datos de ejemplo</div>
          </div>
          <button onclick="cerrarDetalleFacturacion()" style="background: #f3f4f6; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; color: #6b7280; font-size: 20px;">×</button>
        </div>
        <div style="padding: 32px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 28px;">
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Fecha y hora</div>
              <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">${data.fecha}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Servicio</div>
              <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">${data.codigo}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Comprobante</div>
              <div style="font-size: 15px; color: ${data.comprobante === 'Pendiente' ? '#6b7280' : '#0891b2'}; font-weight: 600;">${data.comprobante}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Monto del servicio</div>
              <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">${data.monto}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Forma de pago</div>
              <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">${data.formaPago}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Estado de pago</div>
              <div style="font-size: 15px; color: ${data.estadoPago === 'Pagado' ? '#10b981' : '#9ca3af'}; font-weight: 600;">${data.estadoPago}</div>
            </div>
            
            <div style="margin-bottom: 24px; grid-column: 1 / -1;">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Cliente</div>
              <div style="font-size: 15px; color: #1e3a5f; font-weight: 500;">${data.cliente}</div>
              <div style="font-size: 13px; color: #9ca3af; margin-top: 3px;">RUC: ${data.ruc}</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
  };
  
  window.cerrarDetalleFacturacion = function() {
    const modal = document.getElementById('modalDetalleFactura');
    if (modal) modal.style.display = 'none';
  };
}

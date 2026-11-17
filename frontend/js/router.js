// frontend/js/router.js - Enrutador dinámico SPA para Transporte Vadexa
import { auth } from './modules/auth.js?v=20261112-permissions-2';
import { renderDashboard } from './modules/dashboard.js';
import { renderServicios } from './modules/servicios.js?v=20261112-wizard-2';
import { renderProgramacion } from './modules/programacion.js';
import { renderClientes } from './modules/clientes.js';
import { renderVehiculos } from './modules/vehiculos.js';
import { renderConductores } from './modules/conductores.js';
import { renderProveedores } from './modules/proveedores.js';
import { renderGastos } from './modules/gastos.js';
import { renderReportes } from './modules/reportes.js';
import { renderFacturas } from './modules/facturas.js';
import { renderCuentas } from './modules/cuentas.js';
import { renderOperacion, renderCierre, renderUsuarios } from './modules/gestion.js?v=20261112-permissions-2';
import { initChatbot } from './modules/chatbot.js';

const routes = {
  '#dashboard': renderDashboard,
  '#operacion': renderOperacion,
  '#servicios': renderServicios,
  '#programacion': renderProgramacion,
  '#clientes': renderClientes,
  '#vehiculos': renderVehiculos,
  '#conductores': renderConductores,
  '#proveedores': renderProveedores,
  '#gastos-operativos': (c) => renderGastos(c, 'operativos'),
  '#gastos-admin': (c) => renderGastos(c, 'administrativos'),
  '#reportes': renderReportes,
  '#facturas': renderFacturas,
  '#cuentas': renderCuentas,
  '#cierre': renderCierre,
  '#usuarios': renderUsuarios,
  '#login': (c) => auth.renderLogin(c),
  '#logout': () => auth.logout(),
};

export async function initRouter() {
  const container = document.getElementById('tms-content-container');
  if (!container) {
    throw new Error('No se encontró el contenedor principal de módulos.');
  }
  let navigationId = 0;
  initChatbot();

  // Sidebar toggle
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebar = document.querySelector('.tms-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }

  // Submenús del sidebar
  document.querySelectorAll('.nav-has-submenu').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const submenu = item.nextElementSibling;
      if (submenu && submenu.classList.contains('nav-submenu')) {
        submenu.classList.toggle('open');
      }
    });
  });

  async function handleRoute() {
    const currentNavigationId = ++navigationId;
    let hash = window.location.hash || '#dashboard';

    // Verificar sesión
    let user;
    try {
      user = await auth.checkSession(true);
    } catch (err) {
      if (currentNavigationId !== navigationId) return;
      console.error('No se pudo validar la sesión:', err);
      container.innerHTML = `
        <div role="alert" style="background:#fee2e2;border:1px solid #fecdd3;color:#991b1b;padding:20px;border-radius:8px;">
          <h5><i class="bi bi-exclamation-octagon-fill"></i> No se pudo validar el acceso</h5>
          <p>${err.message || 'El servidor no pudo comprobar la sesión. Verifique que WampServer y MySQL estén activos.'}</p>
          <button class="btn-tms btn-tms-primary" type="button" onclick="window.location.reload()">Reintentar</button>
        </div>`;
      return;
    }
    if (currentNavigationId !== navigationId) return;
    
    if (!user) {
      if (hash !== '#login') {
        window.location.hash = '#login';
        return;
      }
    } else {
      if (hash === '#login' || !hash || hash === '#') {
        window.location.hash = '#dashboard';
        return;
      }
    }

    if (hash === '#logout') {
      await auth.logout();
      return;
    }

    // Actualizar sidebar activo
    document.querySelectorAll('.nav-item, .nav-subitem').forEach(el => {
      el.classList.remove('active');
      if (el.getAttribute('href') === hash) {
        el.classList.add('active');
        // Si está en un submenú, abrirlo
        const parentSub = el.closest('.nav-submenu');
        if (parentSub) parentSub.classList.add('open');
      }
    });

    const routeHandler = routes[hash];
    if (routeHandler) {
      const moduleName = {
        '#dashboard': 'dashboard', '#operacion': 'operacion', '#servicios': 'servicios',
        '#programacion': 'programacion', '#clientes': 'clientes', '#vehiculos': 'vehiculos',
        '#conductores': 'conductores', '#proveedores': 'proveedores',
        '#gastos-operativos': 'gastos_operativos', '#gastos-admin': 'gastos_administrativos',
        '#reportes': 'reportes', '#facturas': 'facturas', '#cuentas': 'cuentas',
        '#cierre': 'cierre', '#usuarios': 'usuarios'
      }[hash];
      if (moduleName && !auth.canAccessModule(moduleName)) {
        container.innerHTML = `
          <div role="alert" style="background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;padding:20px;border-radius:8px;">
            <h5><i class="bi bi-shield-lock-fill"></i> Acceso restringido</h5>
            <p>Tu cuenta no tiene habilitado el módulo solicitado. Pide al administrador que revise tus permisos.</p>
            <a class="btn-tms btn-tms-primary" href="#dashboard">Ir al dashboard</a>
          </div>`;
        return;
      }
      // Limpiar contenedor y montar módulo
      container.innerHTML = `<div style="text-align: center; padding: 40px; color: #94a3b8;"><div class="spinner-border text-primary" role="status"></div><div class="mt-2">Cargando módulo...</div></div>`;
      try {
        await routeHandler(container);
        if (currentNavigationId !== navigationId) return;
      } catch (err) {
        if (currentNavigationId !== navigationId) return;
        console.error('Error renderizando ruta:', err);
        container.innerHTML = `
          <div style="background: #fee2e2; border: 1px solid #fecdd3; color: #991b1b; padding: 20px; border-radius: 8px;">
            <h5><i class="bi bi-exclamation-octagon-fill"></i> Error al cargar el módulo</h5>
            <p>${err.message || 'Ocurrió un error inesperado.'}</p>
            <button class="btn-tms btn-tms-primary" onclick="window.location.reload()"><i class="bi bi-arrow-clockwise"></i> Reintentar</button>
          </div>
        `;
      }
    } else {
      container.innerHTML = `
        <div role="alert" style="background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;padding:20px;border-radius:8px;">
          <h5><i class="bi bi-exclamation-triangle-fill"></i> Módulo no encontrado</h5>
          <p>La ruta <code>${hash}</code> no está registrada. Vuelva al dashboard o use una opción del menú.</p>
          <a class="btn-tms btn-tms-primary" href="#dashboard">Ir al dashboard</a>
        </div>`;
    }
  }

  window.addEventListener('hashchange', handleRoute);
  await handleRoute();
}

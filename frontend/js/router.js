// frontend/js/router.js - Enrutador SPA. El acceso a cada ruta depende de los permisos del rol.
import { auth, routeModules } from './modules/auth.js';
import { esc } from './api.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderServicios } from './modules/servicios.js';
import { renderProgramacion } from './modules/programacion.js';
import { renderClientes } from './modules/clientes.js';
import { renderVehiculos } from './modules/vehiculos.js';
import { renderConductores } from './modules/conductores.js';
import { renderProveedores } from './modules/proveedores.js';
import { renderGastos } from './modules/gastos.js';
import { renderReportes } from './modules/reportes.js';
import { renderFacturas } from './modules/facturas.js';
import { renderCuentas } from './modules/cuentas.js';
import { renderOperacion, renderCierre, renderUsuarios } from './modules/gestion.js';
import { renderAnalisis } from './modules/analisis.js';
import { renderAuditoria } from './modules/auditoria.js';
import { initChatbot } from './modules/chatbot.js';
import { iniciarPaginacion } from './paginacion.js';

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
  '#analisis': renderAnalisis,
  '#auditoria': renderAuditoria,
  '#usuarios': renderUsuarios,
  '#mi-cuenta': (c) => auth.renderMiCuenta(c),
  '#login': (c) => auth.renderLogin(c),
};

const aviso = (tipo, icono, titulo, texto, extra = '') => `
  <div role="alert" class="alert-tms ${tipo}">
    <h5><i class="bi ${icono}"></i> ${esc(titulo)}</h5><p>${esc(texto)}</p>${extra}
  </div>`;

export async function initRouter() {
  const container = document.getElementById('tms-content-container');
  if (!container) throw new Error('No se encontró el contenedor principal de módulos.');
  let navigationId = 0;
  initChatbot();
  iniciarPaginacion();

  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebar = document.querySelector('.tms-sidebar');
  if (toggleBtn && sidebar) toggleBtn.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));
  document.querySelectorAll('.nav-has-submenu').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const submenu = item.nextElementSibling;
      if (submenu && submenu.classList.contains('nav-submenu')) submenu.classList.toggle('open');
    });
  });

  async function handleRoute() {
    const currentNavigationId = ++navigationId;
    const hash = window.location.hash || '#';

    if (hash === '#logout') {
      await auth.logout();
      return;
    }

    let user;
    try {
      user = await auth.checkSession(true);
    } catch (err) {
      if (currentNavigationId !== navigationId) return;
      container.innerHTML = aviso('danger', 'bi-exclamation-octagon-fill', 'No se pudo validar el acceso',
        err.message || 'Verifique que el servidor web y MySQL estén activos.',
        '<button class="btn-tms btn-tms-primary" type="button" onclick="window.location.reload()">Reintentar</button>');
      return;
    }
    if (currentNavigationId !== navigationId) return;

    if (!user) {
      if (hash !== '#login') { window.location.hash = '#login'; return; }
    } else {
      auth.showShell(user.rol !== 'cliente');
      if (user.debe_cambiar_password && hash !== '#mi-cuenta') { window.location.hash = '#mi-cuenta'; return; }
      if (hash === '#login' || hash === '#' || hash === '') { window.location.hash = auth.homeRoute(); return; }
    }

    document.querySelectorAll('.nav-item, .nav-subitem').forEach(el => {
      el.classList.toggle('active', el.getAttribute('href') === hash);
    });
    if (sidebar) sidebar.classList.remove('mobile-open');

    const routeHandler = routes[hash];
    if (!routeHandler) {
      container.innerHTML = aviso('warning', 'bi-exclamation-triangle-fill', 'Módulo no encontrado', `La ruta ${hash} no está registrada.`,
        `<a class="btn-tms btn-tms-primary" href="${esc(auth.homeRoute())}">Ir al inicio</a>`);
      return;
    }
    const moduleName = routeModules[hash];
    if (moduleName && !auth.canAccessModule(moduleName)) {
      container.innerHTML = aviso('warning', 'bi-shield-lock-fill', 'Acceso restringido',
        'Su rol no tiene permiso para este módulo. Si lo necesita, solicítelo al administrador.',
        `<a class="btn-tms btn-tms-primary" href="${esc(auth.homeRoute())}">Ir al inicio</a>`);
      return;
    }
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#94a3b8;"><div class="spinner-border text-primary" role="status"></div><div class="mt-2">Cargando módulo...</div></div>`;
    try {
      await routeHandler(container);
    } catch (err) {
      if (currentNavigationId !== navigationId) return;
      console.error('Error renderizando ruta:', err);
      container.innerHTML = aviso('danger', 'bi-exclamation-octagon-fill', 'Error al cargar el módulo', err.message || 'Ocurrió un error inesperado.',
        '<button class="btn-tms btn-tms-primary" onclick="window.location.reload()"><i class="bi bi-arrow-clockwise"></i> Reintentar</button>');
    }
  }

  window.addEventListener('hashchange', handleRoute);
  await handleRoute();
}

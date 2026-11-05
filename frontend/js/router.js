// frontend/js/router.js - Enrutador dinámico SPA para Transporte Vadexa
import { auth } from './modules/auth.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderServicios } from './modules/servicios.js';
import { renderProgramacion } from './modules/programacion.js';
import { renderClientes } from './modules/clientes.js';
import { renderVehiculos } from './modules/vehiculos.js';
import { renderConductores } from './modules/conductores.js';
import { renderProveedores } from './modules/proveedores.js';
import { renderGastos } from './modules/gastos.js';
import { renderReportes } from './modules/reportes.js';
import { initChatbot } from './modules/chatbot.js';

const routes = {
  '#dashboard': renderDashboard,
  '#servicios': renderServicios,
  '#programacion': renderProgramacion,
  '#clientes': renderClientes,
  '#vehiculos': renderVehiculos,
  '#conductores': renderConductores,
  '#proveedores': renderProveedores,
  '#gastos-operativos': (c) => renderGastos(c, 'operativos'),
  '#gastos-admin': (c) => renderGastos(c, 'administrativos'),
  '#reportes': renderReportes,
  '#login': (c) => auth.renderLogin(c),
  '#logout': () => auth.logout(),
};

export async function initRouter() {
  const container = document.getElementById('tms-content-container');
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
    let hash = window.location.hash || '#dashboard';

    // Verificar sesión
    const user = await auth.checkSession();
    
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
      // Limpiar contenedor y montar módulo
      container.innerHTML = `<div style="text-align: center; padding: 40px; color: #94a3b8;"><div class="spinner-border text-primary" role="status"></div><div class="mt-2">Cargando módulo...</div></div>`;
      try {
        await routeHandler(container);
      } catch (err) {
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
      window.location.hash = '#dashboard';
    }
  }

  window.addEventListener('hashchange', handleRoute);
  await handleRoute();
}

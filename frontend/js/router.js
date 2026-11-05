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
import { renderFacturas } from './modules/facturas.js';
import { initChatbot } from './modules/chatbot.js';
import { renderOperacion, renderCierre, renderUsuarios } from './modules/gestion.js';
import { renderCuentas } from './modules/cuentas.js';

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
  '#facturas': renderFacturas,
  '#operacion': renderOperacion,
  '#cierre': renderCierre,
  '#usuarios': renderUsuarios,
  '#cuentas': renderCuentas,
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
    const isAdmin = ['admin', 'administrador'].includes(String(user?.rol || '').toLowerCase());
    const adminRoutes = ['#facturas', '#cuentas', '#cierre', '#usuarios', '#gastos-admin', '#reportes'];
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
      link.hidden = !isAdmin && adminRoutes.includes(link.getAttribute('href'));
    });
    if (user && !isAdmin && adminRoutes.includes(hash)) {
      window.location.hash = '#operacion';
      return;
    }
    if (user && !isAdmin && hash === '#dashboard') {
      container.innerHTML = '<div class="page-title-box"><div class="page-title-main">Mi operación<span class="page-title-sub">Registro y seguimiento de servicios</span></div></div><p><a class="btn-tms btn-tms-primary" href="#operacion">Ver servicios y pendientes</a> <a class="btn-tms btn-tms-default" href="#programacion">Programación diaria</a></p>';
      const res = await (await import('./api.js')).api.get('servicios/index.php');
      const counts = {};
      for (const s of res.data || []) counts[s.estado_servicio] = (counts[s.estado_servicio] || 0) + 1;
      const summary = document.createElement('p');
      summary.textContent = `Programados: ${counts.programado || 0} · En ruta: ${counts.en_ruta || 0} · Finalizados: ${counts.finalizado || 0}`;
      container.appendChild(summary);
      return;
    }
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

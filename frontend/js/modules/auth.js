// frontend/js/modules/auth.js - Sesión, permisos por rol (módulo × acción), inicio de sesión y cambio de contraseña.
import { api, showToast, esc } from '../api.js';

let currentUser = null;

// Ruta del menú → módulo de permisos.
export const routeModules = {
  '#dashboard': 'dashboard',
  '#operacion': 'operacion',
  '#servicios': 'servicios',
  '#programacion': 'programacion',
  '#clientes': 'clientes',
  '#vehiculos': 'vehiculos',
  '#conductores': 'conductores',
  '#proveedores': 'proveedores',
  '#gastos-operativos': 'gastos_operativos',
  '#gastos-admin': 'gastos_administrativos',
  '#reportes': 'reportes',
  '#facturas': 'facturas',
  '#cuentas': 'cuentas',
  '#cierre': 'cierre',
  '#analisis': 'analisis',
  '#auditoria': 'auditoria',
  '#usuarios': 'usuarios'
};

export const auth = {
  getUser() {
    return currentUser;
  },

  /** ¿Puede el usuario hacer $accion en $modulo? La decisión final siempre la toma el servidor. */
  can(modulo, accion = 'ver') {
    if (!currentUser) return false;
    return (currentUser.permisos?.[modulo] || []).includes(accion);
  },

  canAccessModule(modulo) {
    return this.can(modulo, 'ver');
  },

  /** Primera ruta del menú a la que el usuario tiene acceso. */
  homeRoute() {
    const route = Object.keys(routeModules).find(r => this.canAccessModule(routeModules[r]));
    return route || '#mi-cuenta';
  },

  async checkSession(force = false) {
    if (currentUser && !force) return currentUser;
    let res;
    try {
      res = await api.get('login/validar.php', { action: 'me' });
    } catch (error) {
      currentUser = null;
      if (error.status === 401 && error.data?.auth_required) return null;
      throw error;
    }
    if (res.success && res.logged_in && res.user) {
      currentUser = res.user;
      if (currentUser.rol === 'cliente') {
        // El cliente usa el portal; aquí solo puede cambiar su contraseña.
        if (window.location.hash !== '#mi-cuenta') {
          window.location.href = 'portal.html';
          return null;
        }
        this.showShell(false);
        return currentUser;
      }
      this.updateUserUI(currentUser);
      return currentUser;
    }
    if (res.logged_in === false) {
      currentUser = null;
      return null;
    }
    throw new Error(res.error || 'No se pudo validar la sesión.');
  },

  updateUserUI(user) {
    if (!user) return;
    const nombre = user.nombre || user.usuario;
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    set('sidebar-user-name', nombre);
    set('sidebar-user-role', String(user.rol || '').toUpperCase());
    set('sidebar-user-avatar', nombre.charAt(0).toUpperCase());
    set('topbar-user-name', nombre.toUpperCase());
    document.querySelectorAll('.sidebar-nav a[href^="#"]').forEach(link => {
      const moduleName = routeModules[link.getAttribute('href')];
      link.hidden = moduleName ? !this.canAccessModule(moduleName) : false;
    });
    // Ocultar categorías del menú sin enlaces visibles.
    document.querySelectorAll('.sidebar-nav .nav-category').forEach(cat => {
      let el = cat.nextElementSibling, visible = false;
      while (el && !el.classList.contains('nav-category')) {
        if (el.tagName === 'A' && !el.hidden) visible = true;
        el = el.nextElementSibling;
      }
      cat.hidden = !visible;
    });
    const chat = document.getElementById('tms-chat-fab');
    if (chat) chat.style.display = user.rol === 'cliente' ? 'none' : '';
  },

  showShell(visible) {
    const sidebar = document.querySelector('.tms-sidebar');
    const topbar = document.querySelector('.tms-topbar');
    const mainWrapper = document.querySelector('.tms-main-wrapper');
    const chatFab = document.querySelector('.tms-chat-fab');
    if (sidebar) sidebar.style.display = visible ? '' : 'none';
    if (topbar) topbar.style.display = visible ? '' : 'none';
    if (chatFab) chatFab.style.display = visible ? '' : 'none';
    if (mainWrapper) mainWrapper.style.marginLeft = visible ? '' : '0';
  },

  renderLogin(container) {
    this.showShell(false);
    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0d1320 0%, #1e293b 100%); padding: 20px;">
        <div style="background: #ffffff; width: 100%; max-width: 420px; border-radius: 12px; box-shadow: 0 20px 35px rgba(0,0,0,0.3); overflow: hidden;">
          <div style="background: #111827; padding: 28px 24px; text-align: center; border-bottom: 3px solid #1d4ed8;">
            <img src="../assets/img/logo.png" alt="VADEXSA LOGISTIC" style="height: 52px; background: #fff; padding: 4px 8px; border-radius: 6px; margin-bottom: 12px; object-fit: contain;">
            <h4 style="color: #ffffff; font-weight: 700; margin: 0; font-size: 17px; letter-spacing: 0.5px;">VADEXSA LOGISTIC</h4>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 4px; margin-bottom: 0;">Sistema de Gestión de Transporte · Portal de clientes</p>
          </div>
          <div style="padding: 28px 24px;">
            <form id="form-login">
              <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label" for="login-usuario" style="font-size: 12px;"><i class="bi bi-person-fill"></i> Usuario</label>
                <input type="text" id="login-usuario" class="form-control-tms" placeholder="Ingrese su usuario" required autofocus autocomplete="username" maxlength="50" style="padding: 9px 12px; font-size: 13px;">
              </div>
              <div class="form-group" style="margin-bottom: 22px;">
                <label class="form-label" for="login-password" style="font-size: 12px;"><i class="bi bi-lock-fill"></i> Contraseña</label>
                <input type="password" id="login-password" class="form-control-tms" placeholder="Ingrese su contraseña" required autocomplete="current-password" maxlength="128" style="padding: 9px 12px; font-size: 13px;">
              </div>
              <p id="login-error" role="alert" style="color:#b91c1c;font-size:12px;min-height:16px;margin:0 0 10px;"></p>
              <button type="submit" id="btn-login-submit" class="btn-tms btn-tms-primary" style="width: 100%; justify-content: center; padding: 10px; font-size: 13px; font-weight: 700; border-radius: 6px;">
                <i class="bi bi-box-arrow-in-right"></i> Ingresar al Sistema
              </button>
            </form>
          </div>
          <div style="background: #f8fafc; padding: 12px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            VADEXSA LOGISTIC S.A.C. &copy; ${new Date().getFullYear()} — Los datos personales se tratan conforme a la Ley N.° 29733.
          </div>
        </div>
      </div>`;

    document.getElementById('form-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const usuario = document.getElementById('login-usuario').value.trim();
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('btn-login-submit');
      const error = document.getElementById('login-error');
      error.textContent = '';
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Validando...`;
      try {
        await api.get('login/validar.php', { action: 'me' }); // obtiene el token CSRF de la sesión
        const res = await api.post('login/validar.php', { usuario, password });
        if (res.redirect) { window.location.href = res.redirect; return; }
        currentUser = res.user;
        this.showShell(true);
        showToast(`Bienvenido ${res.user.nombre || res.user.usuario}`, 'success');
        window.location.hash = res.user.debe_cambiar_password ? '#mi-cuenta' : this.homeRoute();
      } catch (err) {
        error.textContent = err.message || 'Error al iniciar sesión';
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-box-arrow-in-right"></i> Ingresar al Sistema`;
      }
    });
  },

  /** Cambio de contraseña propio (obligatorio en el primer ingreso, SEG-28). */
  renderMiCuenta(container) {
    const u = currentUser || {};
    container.innerHTML = `
      <div class="page-title-box"><div class="page-title-main"><i class="bi bi-person-lock text-primary"></i> Mi cuenta
        <span class="page-title-sub">${esc(u.nombre)} · ${esc(u.usuario)} · rol ${esc(u.rol)}</span></div></div>
      ${u.debe_cambiar_password ? '<div class="alert-tms warning" role="alert"><strong>Debe cambiar su contraseña</strong> antes de usar el sistema.</div>' : ''}
      ${u.rol === 'cliente' ? '<p><a href="portal.html" class="btn-tms btn-tms-default">Volver al portal</a></p>' : ''}
      <section class="users-admin-card" style="max-width:520px">
        <h3>Cambiar contraseña</h3>
        <form id="mc-form" class="gestion-grid" style="grid-template-columns:1fr">
          <label>Contraseña actual<input class="form-control-tms" type="password" name="actual" required autocomplete="current-password"></label>
          <label>Nueva contraseña<input class="form-control-tms" type="password" name="nueva" required minlength="10" autocomplete="new-password"></label>
          <label>Repita la nueva contraseña<input class="form-control-tms" type="password" name="repetir" required minlength="10" autocomplete="new-password"></label>
          <p style="font-size:12px;color:#64748b;margin:0">Mínimo 10 caracteres, con letras y números, sin incluir su usuario.</p>
          <p id="mc-error" role="alert" class="text-danger"></p>
          <button class="btn-tms btn-tms-primary" id="mc-save">Guardar contraseña</button>
        </form>
      </section>`;
    const form = container.querySelector('#mc-form');
    form.onsubmit = async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const err = container.querySelector('#mc-error');
      err.textContent = '';
      if (data.nueva !== data.repetir) { err.textContent = 'Las contraseñas nuevas no coinciden.'; return; }
      container.querySelector('#mc-save').disabled = true;
      try {
        await api.post('usuarios/mi_password.php', { actual: data.actual, nueva: data.nueva });
        showToast('Contraseña actualizada.');
        if (currentUser?.rol === 'cliente') { window.location.href = 'portal.html'; return; }
        await this.checkSession(true);
        window.location.hash = this.homeRoute();
      } catch (error) {
        err.textContent = error.message;
      } finally {
        container.querySelector('#mc-save').disabled = false;
      }
    };
  },

  async logout() {
    try {
      await api.post('login/logout.php');
    } catch (e) {
      console.warn('Error en logout:', e);
    }
    currentUser = null;
    showToast('Sesión finalizada', 'info');
    window.location.hash = '#login';
  }
};

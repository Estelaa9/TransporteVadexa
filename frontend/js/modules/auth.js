// frontend/js/modules/auth.js - Gestión de autenticación, login y sesión de usuario
import { api, showToast } from '../api.js';

let currentUser = null;

export const auth = {
  getUser() {
    return currentUser;
  },

  async checkSession() {
    try {
      const res = await api.get('login/validar.php?action=me');
      if (res.success && res.user) {
        currentUser = res.user;
        this.updateUserUI(currentUser);
        return currentUser;
      }
      currentUser = null;
      return null;
    } catch (e) {
      currentUser = null;
      return null;
    }
  },

  updateUserUI(user) {
    if (!user) return;
    
    // Actualizar sidebar
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-user-avatar');
    
    if (nameEl) nameEl.textContent = user.nombre || user.usuario;
    if (roleEl) roleEl.textContent = (user.rol || 'ADMIN').toUpperCase();
    if (avatarEl) {
      const initial = (user.nombre || user.usuario || 'U').charAt(0).toUpperCase();
      avatarEl.textContent = initial;
    }

    // Actualizar topbar
    const topNameEl = document.getElementById('topbar-user-name');
    if (topNameEl) topNameEl.textContent = (user.nombre || user.usuario).toUpperCase();
  },

  renderLogin(container) {
    const sidebar = document.querySelector('.tms-sidebar');
    const topbar = document.querySelector('.tms-topbar');
    const mainWrapper = document.querySelector('.tms-main-wrapper');
    const chatFab = document.querySelector('.tms-chat-fab');
    
    if (sidebar) sidebar.style.display = 'none';
    if (topbar) topbar.style.display = 'none';
    if (chatFab) chatFab.style.display = 'none';
    if (mainWrapper) mainWrapper.style.marginLeft = '0';

    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0d1320 0%, #1e293b 100%); padding: 20px;">
        <div style="background: #ffffff; width: 100%; max-width: 420px; border-radius: 12px; box-shadow: 0 20px 35px rgba(0,0,0,0.3); overflow: hidden;">
          
          <div style="background: #111827; padding: 28px 24px; text-align: center; border-bottom: 3px solid #1d4ed8;">
            <img src="../assets/img/logo.png" alt="VADEXSA LOGISTIC" style="height: 52px; background: #fff; padding: 4px 8px; border-radius: 6px; margin-bottom: 12px; object-fit: contain;">
            <h4 style="color: #ffffff; font-weight: 700; margin: 0; font-size: 17px; letter-spacing: 0.5px;">VADEXSA LOGISTIC</h4>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 4px; margin-bottom: 0;">Sistema de Gestión de Transporte y Logística</p>
          </div>

          <div style="padding: 28px 24px;">
            <form id="form-login">
              <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label" style="font-size: 12px;"><i class="bi bi-person-fill"></i> Usuario</label>
                <input type="text" id="login-usuario" class="form-control-tms" placeholder="Ingrese su usuario" required autofocus style="padding: 9px 12px; font-size: 13px;">
              </div>

              <div class="form-group" style="margin-bottom: 22px;">
                <label class="form-label" style="font-size: 12px;"><i class="bi bi-lock-fill"></i> Contraseña</label>
                <input type="password" id="login-password" class="form-control-tms" placeholder="Ingrese su contraseña" required style="padding: 9px 12px; font-size: 13px;">
              </div>

              <button type="submit" id="btn-login-submit" class="btn-tms btn-tms-primary" style="width: 100%; justify-content: center; padding: 10px; font-size: 13px; font-weight: 700; border-radius: 6px;">
                <i class="bi bi-box-arrow-in-right"></i> Ingresar al Sistema
              </button>
            </form>
          </div>

          <div style="background: #f8fafc; padding: 12px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            VADEXSA LOGISTIC S.A.C. &copy; ${new Date().getFullYear()} — Todos los derechos reservados
          </div>

        </div>
      </div>
    `;

    document.getElementById('form-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const usuario = document.getElementById('login-usuario').value.trim();
      const password = document.getElementById('login-password').value.trim();
      const btn = document.getElementById('btn-login-submit');

      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Validando...`;

      try {
        const res = await api.post('login/validar.php', { usuario, password });
        if (res.success) {
          currentUser = res.user;
          showToast(`¡Bienvenido ${res.user.nombre || res.user.usuario}!`, 'success');
          
          if (sidebar) sidebar.style.display = 'flex';
          if (topbar) topbar.style.display = 'flex';
          if (chatFab) chatFab.style.display = 'flex';
          if (mainWrapper) mainWrapper.style.marginLeft = '';

          window.location.hash = '#dashboard';
        }
      } catch (err) {
        showToast(err.message || 'Error al iniciar sesión', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-box-arrow-in-right"></i> Ingresar al Sistema`;
      }
    });
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

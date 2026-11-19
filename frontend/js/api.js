// frontend/js/api.js - Cliente centralizado de la API del sistema.
// Envía el token CSRF en cada petición que modifica datos (SEG-07) y usa solo GET y POST (SEG-06).

const BASE_URL = '..';
let csrfToken = '';

/** Escapa texto para insertarlo en plantillas HTML (SEG-12). Úselo con TODO dato que venga de la base. */
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function setCsrfToken(token) {
  if (token) csrfToken = token;
}

export const api = {
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('..') ? endpoint : `${BASE_URL}/${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }
    if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken;

    const response = await fetch(url, { method, headers, body, credentials: 'same-origin' });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('Respuesta no JSON:', text);
      throw new Error('Respuesta no válida del servidor.');
    }
    if (data && data.csrf_token) setCsrfToken(data.csrf_token);

    if (!response.ok) {
      if (response.status === 401 && data.auth_required) {
        if (window.location.pathname.endsWith('portal.html')) window.location.href = 'index.html#login';
        else window.location.hash = '#login';
      }
      if (response.status === 403 && data.password_change_required) {
        window.location.hash = '#mi-cuenta';
      }
      const error = new Error(data.error || data.message || `Error del servidor (${response.status})`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(query ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}${query}` : endpoint, { method: 'GET' });
  },

  post(endpoint, data = {}) {
    return this.request(endpoint, { method: 'POST', body: data });
  },

  // Compatibilidad: las operaciones de baja/anulación también usan POST.
  delete(endpoint, data = {}) {
    return this.request(endpoint, { method: 'POST', body: data });
  }
};

/**
 * Notificaciones. Los errores quedan visibles hasta que el usuario los cierra (UX-06).
 * El mensaje se inserta como texto, nunca como HTML.
 */
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
  const toast = document.createElement('div');
  toast.className = `tms-toast ${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  const icon = document.createElement('i');
  icon.className = `bi ${icons[type] || icons.info}`;
  const span = document.createElement('span');
  span.textContent = String(message ?? '');
  toast.append(icon, span);

  const cerrar = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  };
  if (type === 'error' || type === 'warning') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '×';
    btn.setAttribute('aria-label', 'Cerrar notificación');
    btn.style.cssText = 'margin-left:auto;background:none;border:none;font-size:18px;cursor:pointer;color:inherit;';
    btn.onclick = cerrar;
    toast.append(btn);
  } else {
    setTimeout(cerrar, 4000);
  }
  container.appendChild(toast);
}

export const fmt = {
  moneda(val) {
    const num = parseFloat(val) || 0;
    return 'S/ ' + num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  numero(val, dec = 0) {
    if (val === null || val === undefined || val === '') return '—';
    return Number(val).toLocaleString('es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  },

  fecha(val) {
    if (!val) return '-';
    const parts = String(val).slice(0, 10).split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(val);
  },

  hora(val) {
    if (!val) return '-';
    return String(val).substring(0, 5);
  },

  badgeEstado(estado) {
    const st = String(estado || '').toLowerCase().replace(/[^a-z_]/g, '_');
    const labels = { en_ruta: 'En ruta', finalizado: 'Finalizado', cancelado: 'Anulado', programado: 'Programado' };
    return `<span class="badge-status badge-${st}">${esc(labels[st] || estado || 'Programado')}</span>`;
  }
};

/** Fecha local de hoy en formato AAAA-MM-DD. */
export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Neutraliza fórmulas al exportar a CSV (SEG-30). */
export const csvCell = value => {
  let text = String(value ?? '');
  if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
};

/**
 * Descarga un CSV separado por punto y coma (Excel en español, UX-04) a partir de los DATOS, no del DOM (UX-05).
 * rows: arreglo de arreglos; la primera fila son los encabezados.
 */
export function downloadCsv(rows, filename) {
  const csv = '﻿' + rows.map(r => r.map(csvCell).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exporta una tabla del DOM. Se conserva por compatibilidad; las celdas se neutralizan (SEG-30).
 * Exporta lo que está visible en la tabla.
 */
export function exportTableToExcel(tableId, filename = 'reporte_vadexsa.csv') {
  const table = document.getElementById(tableId);
  if (!table) {
    showToast('No se encontró la tabla para exportar', 'error');
    return;
  }
  const rows = [...table.querySelectorAll('tr')].map(row =>
    [...row.querySelectorAll('th, td')].filter(col => !col.classList.contains('no-export')).map(col => col.innerText.trim())
  ).filter(r => r.length);
  downloadCsv(rows, filename);
  showToast('Archivo CSV descargado (incluye solo las filas visibles con los filtros actuales).', 'success');
}

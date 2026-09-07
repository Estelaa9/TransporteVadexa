// frontend/js/api.js - Cliente centralizado de conexión a los archivos PHP del sistema

const BASE_URL = '..';

export const api = {
  /**
   * Realizar petición HTTP genérica a los endpoints PHP
   */
  async request(endpoint, options = {}) {
    // Si la ruta ya incluye ../ o empieza con /, ajustar
    const url = endpoint.startsWith('..') ? endpoint : `${BASE_URL}/${endpoint}`;
    
    const defaultHeaders = {
      'Accept': 'application/json',
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'same-origin', // Conservar cookies de sesión PHP
    };

    try {
      const response = await fetch(url, config);
      const text = await response.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('Error parseando JSON de respuesta:', text);
        throw new Error('Respuesta no válida del servidor.');
      }

      if (!response.ok) {
        if (response.status === 401 && data.auth_required) {
          window.location.hash = '#login';
        }
        throw new Error(data.error || data.message || `Error del servidor (${response.status})`);
      }

      return data;
    } catch (error) {
      console.error(`Error en petición [${endpoint}]:`, error);
      throw error;
    }
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const fullEndpoint = query ? `${endpoint}?${query}` : endpoint;
    return this.request(fullEndpoint, { method: 'GET' });
  },

  post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  },

  put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  },

  delete(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: data,
    });
  }
};

/**
 * Sistema de Notificaciones Toast
 */
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `tms-toast ${type}`;
  
  let icon = 'bi-check-circle-fill';
  if (type === 'error') icon = 'bi-x-circle-fill';
  if (type === 'warning') icon = 'bi-exclamation-triangle-fill';
  if (type === 'info') icon = 'bi-info-circle-fill';

  toast.innerHTML = `
    <i class="bi ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Formatters de ayuda
 */
export const fmt = {
  moneda(val) {
    const num = parseFloat(val) || 0;
    return 'S/ ' + num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  fecha(val) {
    if (!val) return '-';
    const parts = val.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return val;
  },

  hora(val) {
    if (!val) return '-';
    return val.substring(0, 5);
  },

  badgeEstado(estado) {
    const st = (estado || '').toLowerCase().replace(/\s+/g, '_');
    let label = estado || 'Programado';
    if (st === 'en_ruta') label = 'En Ruta';
    if (st === 'finalizado') label = 'Finalizado';
    if (st === 'cancelado') label = 'Cancelado';
    if (st === 'programado') label = 'Programado';

    return `<span class="badge-status badge-${st}">${label}</span>`;
  }
};

/**
 * Exportar tablas a Excel (.csv UTF-8)
 */
export function exportTableToExcel(tableId, filename = 'reporte_vadexsa.csv') {
  const table = document.getElementById(tableId);
  if (!table) {
    showToast('No se encontró la tabla para exportar', 'error');
    return;
  }

  let csv = '\uFEFF';
  const rows = table.querySelectorAll('tr');

  rows.forEach(row => {
    const cols = row.querySelectorAll('th, td');
    const rowData = [];
    cols.forEach(col => {
      if (col.classList.contains('no-export')) return;
      let text = col.innerText.replace(/"/g, '""').trim();
      rowData.push(`"${text}"`);
    });
    if (rowData.length > 0) {
      csv += rowData.join(';') + '\r\n';
    }
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Archivo Excel descargado con éxito', 'success');
}

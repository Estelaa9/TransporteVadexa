import { api, fmt, showToast } from '../api.js';

export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
export const hoy = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const input = (name, label, type = 'text', extra = '') => `<label class="form-group">${label}<input class="form-control-tms" name="${name}" type="${type}" ${extra}></label>`;
const button = (label, id = '', type = 'button') => `<button type="${type}" id="${id}" class="btn-tms btn-tms-primary">${label}</button>`;

export function filtrarOperacion(rows, f) {
  const query = (f.buscar || '').trim().toLocaleLowerCase('es');
  return rows.filter(s => (!f.desde || s.fecha_servicio >= f.desde) && (!f.hasta || s.fecha_servicio <= f.hasta) &&
    (!f.estado || s.estado_servicio === f.estado) && (!f.modalidad || s.modalidad === f.modalidad) &&
    (!f.tipo || s.tipo_servicio === f.tipo) && (!f.facturacion || (f.facturacion === 'pendiente' ? !s.numero_factura && s.estado_servicio !== 'cancelado' : !!s.numero_factura)) &&
    (!query || [s.id,s.cliente,s.placa,s.conductor,s.origen,s.destino,s.guia_remitente,s.guia_transportista].some(v => String(v ?? '').toLocaleLowerCase('es').includes(query))));
}

export async function renderOperacion(container) {
  let rows = [], proveedores = [], csrf = '', selected;
  container.innerHTML = `<div class="page-title-box"><div class="page-title-main">Control operativo<span class="page-title-sub">Lima, provincias, mudanzas y servicios de terceros</span></div><a href="#servicios" class="btn-tms btn-tms-primary">Registrar viaje</a></div>
    <form id="op-filter" class="gestion-grid">${input('buscar','Cliente, placa, conductor o guía')}${input('desde','Desde','date')}${input('hasta','Hasta','date')}
    <label>Estado<select name="estado" class="form-control-tms"><option value="">Todos</option><option value="programado">Programado</option><option value="en_ruta">En ruta</option><option value="finalizado">Finalizado</option><option value="cancelado">Cancelado</option></select></label>
    <label>Flota<select name="modalidad" class="form-control-tms"><option value="">Todas</option><option value="propio">Propia</option><option value="tercerizado">Terceros</option></select></label>
    <label>Servicio<select name="tipo" class="form-control-tms"><option value="">Todos</option>${['Local','Provincia','Mudanza','Distribución','Especial'].map(t=>`<option>${t}</option>`).join('')}</select></label>
    <label>Facturación<select name="facturacion" class="form-control-tms"><option value="">Todos</option><option value="pendiente">Por facturar</option><option value="registrado">Con comprobante</option></select></label></form>
    <p id="op-info" role="status"></p><p class="gestion-legend">Programado: pendiente de salida · En ruta: en ejecución · Finalizado: viaje terminado · Cancelado: excluido de pendientes.</p>
    <div class="tms-table-container"><table class="tms-table"><thead><tr><th>Fecha / servicio</th><th>Cliente</th><th>Ruta</th><th>Placa / conductor</th><th>Modalidad</th><th>Estado</th><th>Comprobante</th><th>Acciones</th></tr></thead><tbody id="op-body"></tbody></table></div>
    <dialog id="op-dialog" class="gestion-dialog"><form id="op-form"><h3>Ficha operativa <span id="op-id"></span></h3><p>El vehículo y conductor asignados se modifican desde Servicios.</p><div class="gestion-grid">
    <label>Proveedor<select name="proveedor_id" class="form-control-tms"><option value="">Flota propia / seleccionar</option></select></label>
    ${input('provincia','Provincia','text','maxlength="100"')}${input('distrito','Distrito','text','maxlength="100"')}${input('referencia','Referencia de destino','text','maxlength="255"')}${input('contacto','Contacto','text','maxlength="150"')}${input('telefono','Teléfono','tel','maxlength="40"')}${input('almacen','Almacén de origen','text','maxlength="150"')}${input('temporada','Temporada / campaña','text','maxlength="100"')}${input('frecuencia','Frecuencia acordada','text','maxlength="100"')}
    <label>Observaciones<textarea name="observaciones" class="form-control-tms" maxlength="4000"></textarea></label></div><p id="op-error" role="alert"></p><div class="tms-toolbar">${button('Guardar ficha','op-save','submit')}${button('Cerrar','op-close')}</div></form></dialog>`;
  const find = s => container.querySelector(s), filters = find('#op-filter'), form = find('#op-form'), dialog = find('#op-dialog');
  function render() {
    const f = Object.fromEntries(new FormData(filters));
    if (f.desde && f.hasta && f.desde > f.hasta) { find('#op-info').textContent = 'Revise el rango de fechas.'; find('#op-body').innerHTML = ''; return; }
    const visible = filtrarOperacion(rows, f);
    find('#op-info').textContent = `${visible.length} servicios · ${visible.filter(s=>!s.numero_factura && s.estado_servicio !== 'cancelado').length} por facturar`;
    find('#op-body').innerHTML = visible.map(s=>`<tr><td>${esc(s.fecha_servicio)} ${esc(s.hora_servicio)}<br>#${esc(s.id)}</td><td>${esc(s.cliente)}</td><td>${esc(s.origen)} → ${esc(s.destino)}</td><td>${esc(s.placa)}<br>${esc(s.conductor)}</td><td>${esc(s.modalidad)}</td><td>${esc(s.estado_servicio)}</td><td>${esc(s.numero_factura || (s.estado_servicio === 'cancelado' ? 'No corresponde' : 'Por facturar'))}</td><td><button class="btn-tms btn-tms-default" data-ficha="${esc(s.id)}">Ficha</button> <a class="btn-tms btn-tms-default" target="_blank" rel="noopener" href="../servicios/imprimir.php?id=${encodeURIComponent(s.id)}">Imprimir</a></td></tr>`).join('') || '<tr><td colspan="8">No hay servicios para estos filtros.</td></tr>';
  }
  filters.addEventListener('input', render); filters.addEventListener('submit', e=>e.preventDefault());
  find('#op-close').onclick = () => dialog.close();
  find('#op-body').onclick = async e => {
    const b = e.target.closest('[data-ficha]'); if (!b) return;
    selected = rows.find(s=>String(s.id) === b.dataset.ficha);
    try {
      const res = await api.get('servicios/operacion.php', {id:selected.id}); csrf = res.csrf_token;
      form.reset(); find('#op-id').textContent = `#${selected.id}`;
      form.elements.proveedor_id.disabled = selected.modalidad === 'propio';
      form.elements.proveedor_id.required = selected.modalidad === 'tercerizado';
      for (const [key,value] of Object.entries(res.data || {})) if (form.elements[key]) form.elements[key].value = value ?? '';
      find('#op-error').textContent = ''; dialog.showModal();
    } catch (err) { showToast(err.message,'error'); }
  };
  form.onsubmit = async e => {
    e.preventDefault(); find('#op-save').disabled = true;
    try { await api.post('servicios/operacion.php',{...Object.fromEntries(new FormData(form)),servicio_id:selected.id,csrf_token:csrf}); dialog.close(); showToast('Ficha guardada.'); }
    catch(err) { find('#op-error').textContent=err.message; }
    finally { find('#op-save').disabled=false; }
  };
  dialog.addEventListener('cancel',e=>{if(find('#op-save').disabled)e.preventDefault();});
  const [s,p] = await Promise.all([api.get('servicios/index.php'),api.get('proveedores/index.php')]);
  rows=s.data || []; proveedores=p.data || [];
  form.elements.proveedor_id.innerHTML += proveedores.map(p=>`<option value="${esc(p.id)}">${esc(p.nombre || p.razon_social)}</option>`).join(''); render();
}

export async function renderCierre(container) {
  let csrf='';
  container.innerHTML=`<div class="page-title-box"><div class="page-title-main">Cierre y gastos adicionales<span class="page-title-sub">Resultado de servicios finalizados y cobros del período</span></div></div>
  <form id="ci-filter" class="gestion-grid">${input('desde','Desde','date',`required value="${hoy()}"`)}${input('hasta','Hasta','date',`required value="${hoy()}"`)}${button('Consultar','ci-load','submit')}${button('Imprimir','ci-print')}</form>
  <p id="ci-error" role="alert"></p><div class="facturas-summary" id="ci-summary"></div><div id="ci-chart" class="gestion-chart" aria-label="Comparación de ingresos y gastos"></div>
  <p>Resultado operativo = precio de servicios finalizados − proveedores − gastos operativos − administrativos − adicionales. Los cobros se muestran por fecha de pago y no se suman de nuevo al resultado. No registre el mismo gasto en dos categorías.</p>
  <details><summary>Registrar gasto adicional</summary><form id="ci-form" class="gestion-grid">${input('fecha','Fecha','date',`required value="${hoy()}"`)}${input('concepto','Concepto','text','required maxlength="255"')}${input('monto','Importe S/','number','required min="0.01" max="99999999.99" step="0.01"')}${input('servicio_id','Servicio (opcional)','number','min="1"')}${button('Guardar gasto','ci-save','submit')}</form></details>
  <h3>Gastos adicionales del período</h3><div class="tms-table-container"><table class="tms-table"><thead><tr><th>Fecha</th><th>Concepto</th><th>Servicio</th><th>Importe</th><th>Registrado por</th></tr></thead><tbody id="ci-body"></tbody></table></div>`;
  const find=s=>container.querySelector(s), filter=find('#ci-filter'), form=find('#ci-form');
  async function load(){
    find('#ci-load').disabled=true; find('#ci-error').textContent='';
    try { const r=await api.get('reportes/cierre.php',Object.fromEntries(new FormData(filter))); csrf=r.csrf_token;
      const labels={servicios:'Servicios finalizados',proveedores:'Costo de terceros',operativos:'Gastos operativos',administrativos:'Gastos administrativos',adicionales:'Gastos adicionales',resultado:'Resultado operativo',cobrado:'Cobros registrados'};
      find('#ci-summary').innerHTML=Object.entries(labels).map(([k,l])=>`<div><span>${l}</span><strong>${fmt.moneda(r.resumen[k])}</strong></div>`).join('');
      const chartKeys=['servicios','proveedores','operativos','administrativos','adicionales'];
      const max=Math.max(1,...chartKeys.map(k=>Number(r.resumen[k])));
      find('#ci-chart').innerHTML='<h3>Ingresos y gastos del período</h3><p>Azul: servicios finalizados · Naranja: costos y gastos</p>'+chartKeys.map(k=>`<div><span>${labels[k]}</span><meter min="0" max="${max}" value="${Number(r.resumen[k])}" class="${k==='servicios'?'ingreso':'gasto'}">${fmt.moneda(r.resumen[k])}</meter><strong>${fmt.moneda(r.resumen[k])}</strong></div>`).join('');
      find('#ci-body').innerHTML=r.data.map(g=>`<tr><td>${esc(g.fecha)}</td><td>${esc(g.concepto)}</td><td>${esc(g.servicio_id || 'General')}</td><td>${fmt.moneda(g.monto)}</td><td>${esc(g.registrado_por)}</td></tr>`).join('') || '<tr><td colspan="5">Sin gastos adicionales.</td></tr>';
    } catch(e){csrf='';find('#ci-error').textContent=e.message;find('#ci-summary').innerHTML='';find('#ci-chart').innerHTML='';find('#ci-body').innerHTML='';} finally{find('#ci-load').disabled=false;find('#ci-save').disabled=!csrf;}
  }
  filter.onsubmit=e=>{e.preventDefault();load();}; find('#ci-print').onclick=()=>window.print();
  form.onsubmit=async e=>{e.preventDefault();find('#ci-save').disabled=true;try{await api.post('gastos_adicionales/guardar.php',{...Object.fromEntries(new FormData(form)),csrf_token:csrf});form.reset();showToast('Gasto registrado.');await load();}catch(err){showToast(err.message,'error');}finally{find('#ci-save').disabled=!csrf;}};
  await load();
}

export async function renderUsuarios(container) {
  let rows = [], moduleCatalog = [], csrf = '', selectedUserId = '';
  container.innerHTML = `
    <div class="page-title-box"><div class="page-title-main">Administración de usuarios y permisos
      <span class="page-title-sub">Cuentas activas, roles y acceso individual por módulo</span></div></div>
    <section class="users-admin-card">
      <h3 id="us-form-title">Crear usuario</h3>
      <form id="us-form" class="gestion-grid">
        <input type="hidden" name="id">
        ${input('nombre','Nombre','text','required maxlength="100"')}
        ${input('usuario','Usuario','text','required pattern="[a-zA-Z0-9_.-]{3,50}" autocomplete="off"')}
        ${input('password','Contraseña','password','required minlength="10" autocomplete="new-password"')}
        <label>Rol<select name="rol" class="form-control-tms"><option value="usuario">Usuario</option><option value="admin">Administrador</option></select></label>
        <label>Estado de cuenta<select name="estado" class="form-control-tms"><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></label>
        <div class="users-admin-actions">${button('Guardar usuario','us-save','submit')}${button('Nuevo / limpiar','us-clear')}</div>
      </form>
      <p id="us-error" role="alert" class="text-danger"></p>
    </section>
    <section class="users-admin-card">
      <div class="users-admin-heading"><div><h3>Cuentas registradas</h3><p>Desactive una cuenta para revocar su acceso inmediatamente.</p></div><button id="us-refresh" class="btn-tms btn-tms-default" type="button">Actualizar</button></div>
      <div class="tms-table-container"><table class="tms-table"><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Cuenta</th><th>Acción</th></tr></thead><tbody id="us-body"></tbody></table></div>
    </section>
    <section id="us-permissions-panel" class="users-admin-card" hidden>
      <div class="users-admin-heading"><div><h3>Permisos por módulo</h3><p id="us-selected-label"></p></div><button id="us-permissions-save" class="btn-tms btn-tms-primary" type="button">Guardar permisos</button></div>
      <div id="us-modules-grid" class="users-module-grid"></div>
      <p id="us-permissions-message" role="status"></p>
    </section>`;
  const find = selector => container.querySelector(selector);
  const form = find('#us-form');
  const permissionsPanel = find('#us-permissions-panel');

  function setSelectedUser(user) {
    selectedUserId = String(user.id);
    find('#us-selected-label').textContent = `${user.nombre} · ${user.usuario} · ${user.estado}`;
    permissionsPanel.hidden = false;
    const activeModules = new Set((user.modulos || []).filter(module => module.activo).map(module => module.modulo));
    find('#us-modules-grid').innerHTML = moduleCatalog.map(module => `
      <label class="users-module-card">
        <span class="users-module-copy"><strong>${esc(module.nombre)}</strong><small>${esc(module.descripcion)}</small></span>
        <span class="users-switch"><input type="checkbox" name="module" value="${esc(module.modulo)}" ${activeModules.has(module.modulo) ? 'checked' : ''}><span aria-hidden="true"></span></span>
      </label>`).join('');
    find('#us-permissions-message').textContent = '';
  }

  async function load() {
    find('#us-refresh').disabled = true;
    try {
      const response = await api.get('usuarios/index.php');
      rows = response.data || [];
      moduleCatalog = response.module_catalog || [];
      csrf = response.csrf_token;
      find('#us-body').innerHTML = rows.map(user => `
        <tr>
          <td>${esc(user.nombre)}</td><td>${esc(user.usuario)}</td><td>${esc(user.rol)}</td>
          <td><label class="users-switch" aria-label="Cuenta ${user.estado === 'activo' ? 'activa' : 'inactiva'}"><input type="checkbox" data-account-toggle="${esc(user.id)}" ${user.estado === 'activo' ? 'checked' : ''}><span aria-hidden="true"></span></label><span>${esc(user.estado)}</span></td>
          <td><button class="btn-tms btn-tms-default" type="button" data-edit-user="${esc(user.id)}">Editar y permisos</button></td>
        </tr>`).join('') || '<tr><td colspan="5">No hay cuentas registradas.</td></tr>';
      if (selectedUserId) {
        const selected = rows.find(user => String(user.id) === selectedUserId);
        if (selected) setSelectedUser(selected);
        else { selectedUserId = ''; permissionsPanel.hidden = true; }
      }
    } finally {
      find('#us-refresh').disabled = false;
    }
  }

  function resetForm() {
    form.reset();
    form.elements.id.value = '';
    form.elements.password.required = true;
    form.elements.password.value = '';
    find('#us-form-title').textContent = 'Crear usuario';
    find('#us-error').textContent = '';
  }

  find('#us-clear').onclick = resetForm;
  find('#us-refresh').onclick = () => load().catch(error => showToast(error.message, 'error'));
  find('#us-body').onclick = event => {
    const button = event.target.closest('[data-edit-user]');
    if (!button) return;
    const user = rows.find(entry => String(entry.id) === button.dataset.editUser);
    if (!user) return;
    form.reset();
    for (const [key, value] of Object.entries(user)) {
      if (form.elements[key]) form.elements[key].value = key === 'rol' && value === 'administrador' ? 'admin' : value;
    }
    form.elements.password.value = '';
    form.elements.password.required = false;
    find('#us-form-title').textContent = `Editar usuario: ${user.nombre}`;
    find('#us-error').textContent = '';
    setSelectedUser(user);
  };
  find('#us-body').onchange = async event => {
    const toggle = event.target.closest('[data-account-toggle]');
    if (!toggle) return;
    const user = rows.find(entry => String(entry.id) === toggle.dataset.accountToggle);
    if (!user) return;
    toggle.disabled = true;
    try {
      await api.post('usuarios/gestionar.php', {
        id: user.id, nombre: user.nombre, usuario: user.usuario,
        rol: ['admin', 'administrador'].includes(user.rol) ? 'admin' : 'usuario',
        estado: toggle.checked ? 'activo' : 'inactivo', password: '', csrf_token: csrf
      });
      selectedUserId = String(user.id);
      showToast(`Cuenta ${toggle.checked ? 'activada' : 'desactivada'}.`);
      await load();
    } catch (error) {
      toggle.checked = !toggle.checked;
      showToast(error.message, 'error');
    } finally {
      toggle.disabled = false;
    }
  };
  form.onsubmit = async event => {
    event.preventDefault();
    find('#us-save').disabled = true;
    find('#us-error').textContent = '';
    try {
      const payload = Object.fromEntries(new FormData(form));
      await api.post('usuarios/gestionar.php', {...payload, csrf_token: csrf});
      await load();
      const saved = rows.find(user => String(user.id) === String(payload.id)) ||
        rows.find(user => user.usuario === payload.usuario);
      resetForm();
      if (saved) setSelectedUser(saved);
      showToast('Usuario guardado.');
    } catch (error) {
      find('#us-error').textContent = error.message;
    } finally {
      find('#us-save').disabled = false;
    }
  };
  find('#us-permissions-save').onclick = async () => {
    const saveButton = find('#us-permissions-save');
    saveButton.disabled = true;
    find('#us-permissions-message').textContent = '';
    const modules = [...find('#us-modules-grid').querySelectorAll('input[name="module"]:checked')].map(input => input.value);
    try {
      await api.post('usuarios/permisos.php', {user_id: selectedUserId, modulos: modules, csrf_token: csrf});
      await load();
      find('#us-permissions-message').textContent = 'Permisos guardados. El cambio se aplica en la siguiente petición del usuario.';
      showToast('Permisos actualizados.');
    } catch (error) {
      find('#us-permissions-message').textContent = error.message;
    } finally {
      saveButton.disabled = false;
    }
  };
  await load();
}

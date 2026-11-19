import { api, fmt, showToast } from '../api.js';
import { auth } from './auth.js';

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
  <p>Resultado operativo = base imponible (sin IGV) de servicios finalizados − costo de terceros − gastos operativos − administrativos − adicionales. No es utilidad neta (no descuenta impuesto a la renta). Los cobros se muestran por fecha de pago y no se suman de nuevo al resultado. No registre el mismo gasto en dos categorías.</p>
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

// Usuarios y roles (Mejora 1): usuario → rol → permisos (módulo × acción). El servidor valida cada operación.
export async function renderUsuarios(container) {
  let users = [], roles = [], clientes = [], catalogo = {}, acciones = {}, rolSel = null;
  const puedeCrear = auth.can('usuarios', 'crear');
  const puedeEditar = auth.can('usuarios', 'editar');
  container.innerHTML = `
    <div class="page-title-box"><div class="page-title-main">Usuarios y roles
      <span class="page-title-sub">Cada usuario tiene un rol; cada rol define qué puede hacer en cada módulo</span></div></div>
    <div class="tabs-tms" role="tablist">
      <button role="tab" aria-selected="true" data-tab="us">Cuentas</button>
      <button role="tab" aria-selected="false" data-tab="ro">Roles y permisos</button>
    </div>
    <section id="tab-us">
      ${puedeCrear || puedeEditar ? `<section class="users-admin-card">
        <h3 id="us-form-title">Crear usuario</h3>
        <form id="us-form" class="gestion-grid">
          <input type="hidden" name="id">
          ${input('nombre', 'Nombre', 'text', 'required maxlength="100"')}
          ${input('usuario', 'Usuario', 'text', 'required pattern="[a-zA-Z0-9_.\\-]{3,50}" autocomplete="off"')}
          ${input('password', 'Contraseña inicial', 'password', 'required minlength="10" autocomplete="new-password"')}
          <label>Rol<select name="rol" class="form-control-tms" required></select></label>
          <label id="us-cliente-wrap" hidden>Cliente vinculado<select name="cliente_id" class="form-control-tms"><option value="">Seleccione</option></select></label>
          <label>Estado<select name="estado" class="form-control-tms"><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></label>
          <label><input type="checkbox" name="desbloquear" value="1"> Desbloquear cuenta</label>
          <div class="users-admin-actions">${button('Guardar usuario', 'us-save', 'submit')}${button('Nuevo / limpiar', 'us-clear')}</div>
        </form>
        <p class="muted">Las cuentas nuevas deben cambiar su contraseña en el primer ingreso. Mínimo 10 caracteres con letras y números.</p>
        <p id="us-error" role="alert" class="text-danger"></p>
      </section>` : ''}
      <section class="users-admin-card">
        <div class="users-admin-heading"><div><h3>Cuentas registradas</h3><p>Desactivar una cuenta revoca su acceso en la siguiente petición.</p></div></div>
        <div class="tms-table-container"><table class="tms-table"><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Cliente</th><th>Estado</th><th>Último acceso</th><th></th></tr></thead><tbody id="us-body"></tbody></table></div>
      </section>
    </section>
    <section id="tab-ro" hidden>
      <div class="users-admin-card">
        <div class="users-admin-heading"><div><h3>Roles</h3><p>Seleccione un rol para ver o editar su matriz de permisos.</p></div>
          ${puedeEditar ? '<button class="btn-tms btn-tms-primary" id="ro-new" type="button">Nuevo rol</button>' : ''}</div>
        <div class="tms-table-container"><table class="tms-table"><thead><tr><th>Rol</th><th>Descripción</th><th>Usuarios</th><th>Estado</th><th></th></tr></thead><tbody id="ro-body"></tbody></table></div>
      </div>
      <form id="ro-form" class="users-admin-card" hidden>
        <h3 id="ro-title"></h3>
        <div class="gestion-grid">
          ${input('nombre', 'Nombre del rol', 'text', 'required maxlength="80"')}
          ${input('descripcion', 'Descripción', 'text', 'maxlength="255"')}
          <label><input type="checkbox" name="activo" value="1" checked> Rol activo</label>
        </div>
        <p id="ro-nota" class="muted"></p>
        <div class="tms-table-container"><table class="perm-matrix"><thead id="ro-head"></thead><tbody id="ro-matrix"></tbody></table></div>
        <p id="ro-error" role="alert" class="text-danger"></p>
        ${puedeEditar ? '<div class="users-admin-actions" style="margin-top:12px"><button class="btn-tms btn-tms-primary" id="ro-save">Guardar rol y permisos</button></div>' : ''}
      </form>
    </section>`;

  const $ = s => container.querySelector(s);
  const form = $('#us-form');
  container.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    container.querySelectorAll('[data-tab]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    $('#tab-us').hidden = b.dataset.tab !== 'us';
    $('#tab-ro').hidden = b.dataset.tab !== 'ro';
  });
  const rolNombre = codigo => roles.find(r => r.codigo === codigo)?.nombre || codigo;

  function renderUsers() {
    $('#us-body').innerHTML = users.map(u => `<tr>
      <td>${esc(u.nombre)}</td><td>${esc(u.usuario)}</td><td>${esc(rolNombre(u.rol))}</td><td>${esc(u.cliente || '')}</td>
      <td>${esc(u.estado)}${Number(u.bloqueado) ? ' · <strong>bloqueada</strong>' : ''}${Number(u.debe_cambiar_password) ? '<br><small>debe cambiar contraseña</small>' : ''}</td>
      <td>${esc(u.ultimo_acceso || '—')}</td>
      <td>${puedeEditar ? `<button class="btn-tms btn-tms-default" type="button" data-edit-user="${esc(u.id)}">Editar</button>` : ''}</td></tr>`).join('')
      || '<tr><td colspan="7">No hay cuentas registradas.</td></tr>';
  }
  function renderRoles() {
    $('#ro-body').innerHTML = roles.map(r => `<tr><td><strong>${esc(r.nombre)}</strong><br><small>${esc(r.codigo)}</small></td><td>${esc(r.descripcion)}</td>
      <td>${esc(r.usuarios ?? '')}</td><td>${Number(r.activo) ? 'Activo' : 'Inactivo'}</td>
      <td><button class="btn-tms btn-tms-default" type="button" data-rol="${esc(r.id)}">${puedeEditar ? 'Ver / editar' : 'Ver'} permisos</button></td></tr>`).join('');
  }
  function abrirRol(r) {
    rolSel = r;
    const f = $('#ro-form');
    f.hidden = false;
    f.reset();
    f.elements.nombre.value = r?.nombre || '';
    f.elements.descripcion.value = r?.descripcion || '';
    f.elements.activo.checked = r ? Number(r.activo) === 1 : true;
    $('#ro-error').textContent = '';
    const esAdmin = r?.codigo === 'administrador';
    const esCliente = r?.codigo === 'cliente';
    $('#ro-title').textContent = r ? `Rol: ${r.nombre}` : 'Nuevo rol';
    $('#ro-nota').textContent = esAdmin ? 'El administrador siempre tiene todos los permisos; no se edita.' :
      esCliente ? 'El rol Cliente solo puede acceder al portal del cliente, con sus propios datos.' : 'Marque las acciones permitidas en cada módulo. «Ver» se añade automáticamente si marca otra acción.';
    const accs = Object.keys(acciones);
    $('#ro-head').innerHTML = `<tr><th>Módulo</th>${accs.map(a => `<th>${esc(acciones[a])}</th>`).join('')}</tr>`;
    $('#ro-matrix').innerHTML = Object.entries(catalogo).filter(([m]) => esCliente ? m === 'portal' : m !== 'portal').map(([m, def]) => `<tr>
      <td>${esc(def.nombre)}<small>${esc(def.descripcion)}</small></td>
      ${accs.map(a => def.acciones.includes(a) ? `<td><input type="checkbox" data-mod="${esc(m)}" data-acc="${esc(a)}" aria-label="${esc(def.nombre)}: ${esc(acciones[a])}"
        ${esAdmin || (r?.permisos?.[m] || []).includes(a) ? 'checked' : ''} ${esAdmin || !puedeEditar ? 'disabled' : ''}></td>` : '<td>—</td>').join('')}</tr>`).join('');
    if ($('#ro-save')) $('#ro-save').disabled = esAdmin;
    f.scrollIntoView({ behavior: 'smooth' });
  }

  async function load() {
    const [u, r] = await Promise.all([api.get('usuarios/index.php'), api.get('usuarios/roles.php')]);
    users = u.data; clientes = u.clientes; roles = r.roles; catalogo = r.modulos; acciones = r.acciones;
    if (form) {
      form.elements.rol.innerHTML = roles.filter(x => Number(x.activo)).map(x => `<option value="${esc(x.codigo)}">${esc(x.nombre)}</option>`).join('');
      form.elements.cliente_id.innerHTML = '<option value="">Seleccione</option>' + clientes.map(c => `<option value="${esc(c.id)}">${esc(c.nombre)} · ${esc(c.documento)}</option>`).join('');
    }
    renderUsers();
    renderRoles();
    if (rolSel?.id) abrirRol(roles.find(x => String(x.id) === String(rolSel.id)) || null);
  }

  function resetForm() {
    if (!form) return;
    form.reset();
    form.elements.id.value = '';
    form.elements.password.required = true;
    form.elements.password.placeholder = '';
    $('#us-cliente-wrap').hidden = true;
    $('#us-form-title').textContent = 'Crear usuario';
    $('#us-error').textContent = '';
  }
  if (form) {
    form.elements.rol.onchange = () => { $('#us-cliente-wrap').hidden = form.elements.rol.value !== 'cliente'; };
    $('#us-clear').onclick = resetForm;
    form.onsubmit = async e => {
      e.preventDefault();
      $('#us-save').disabled = true;
      $('#us-error').textContent = '';
      try {
        await api.post('usuarios/gestionar.php', Object.fromEntries(new FormData(form)));
        showToast('Usuario guardado.');
        resetForm();
        await load();
      } catch (err) { $('#us-error').textContent = err.message; } finally { $('#us-save').disabled = false; }
    };
  }
  $('#us-body').onclick = e => {
    const b = e.target.closest('[data-edit-user]');
    if (!b || !form) return;
    const u = users.find(x => String(x.id) === b.dataset.editUser);
    resetForm();
    ['id', 'nombre', 'usuario', 'rol', 'estado'].forEach(k => { form.elements[k].value = u[k] ?? ''; });
    form.elements.cliente_id.value = u.cliente_id || '';
    $('#us-cliente-wrap').hidden = u.rol !== 'cliente';
    form.elements.password.required = false;
    form.elements.password.placeholder = 'Dejar vacío para no cambiarla';
    $('#us-form-title').textContent = `Editar usuario: ${u.nombre}`;
    form.scrollIntoView({ behavior: 'smooth' });
  };
  $('#ro-body').onclick = e => { const b = e.target.closest('[data-rol]'); if (b) abrirRol(roles.find(r => String(r.id) === b.dataset.rol)); };
  $('#ro-new')?.addEventListener('click', () => abrirRol(null));
  $('#ro-form').onsubmit = async e => {
    e.preventDefault();
    const f = e.currentTarget;
    const permisos = {};
    f.querySelectorAll('[data-mod]:checked').forEach(c => { (permisos[c.dataset.mod] = permisos[c.dataset.mod] || []).push(c.dataset.acc); });
    for (const [m, accs] of Object.entries(permisos)) if (!accs.includes('ver') && catalogo[m].acciones.includes('ver')) accs.push('ver');
    try {
      const res = await api.post('usuarios/roles.php', { id: rolSel?.id || '', nombre: f.elements.nombre.value, descripcion: f.elements.descripcion.value, activo: f.elements.activo.checked ? 1 : 0, permisos });
      showToast('Rol guardado. Los cambios se aplican en la siguiente petición de cada usuario.');
      rolSel = { id: res.id };
      await load();
    } catch (err) { $('#ro-error').textContent = err.message; }
  };
  await load();
}

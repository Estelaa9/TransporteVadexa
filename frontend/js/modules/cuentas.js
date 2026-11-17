import {api,fmt,showToast} from '../api.js';
import {esc,hoy} from './gestion.js';

export async function renderCuentas(container) {
  let rows=[],abonos=[],csrf='',selected;
  container.innerHTML=`<div class="page-title-box"><div class="page-title-main">Cuentas por cobrar<span class="page-title-sub">Adelantos, pagos parciales y saldo por servicio</span></div><a href="#facturas" class="btn-tms btn-tms-default">Comprobantes</a></div>
  <div class="gestion-grid"><label>Buscar cliente o comprobante<input id="cc-search" class="form-control-tms"></label><label>Saldo<select id="cc-status" class="form-control-tms"><option value="pendiente">Con saldo pendiente</option><option value="todos">Todos</option><option value="pagado">Sin saldo</option></select></label><button id="cc-refresh" class="btn-tms btn-tms-default">Actualizar</button></div>
  <p>Los abonos se pueden registrar antes de facturar. Marcar un comprobante como pagado confirma la cancelación del saldo restante, incluidos sus adelantos.</p>
  <p id="cc-error" role="alert"></p><div id="cc-summary" class="facturas-summary"></div>
  <div class="tms-table-container"><table class="tms-table"><thead><tr><th>Servicio / fecha</th><th>Cliente</th><th>Comprobante</th><th>Precio</th><th>Abonos registrados</th><th>Saldo</th><th>Acción</th></tr></thead><tbody id="cc-body"></tbody></table></div>
  <h3>Historial de abonos de los servicios filtrados</h3><div class="tms-table-container"><table class="tms-table"><thead><tr><th>Fecha</th><th>Servicio</th><th>Cliente</th><th>Referencia</th><th>Importe</th><th>Registrado por</th></tr></thead><tbody id="cc-history"></tbody></table></div>
  <dialog id="cc-dialog" class="facturas-dialog"><form id="cc-form"><h3>Registrar abono</h3><p id="cc-selected"></p><label>Fecha<input name="fecha" type="date" class="form-control-tms" required max="${hoy()}"></label><label>Importe S/<input name="monto" type="number" class="form-control-tms" required min="0.01" step="0.01"></label><label>Referencia / operación<input name="referencia" class="form-control-tms" required maxlength="255"></label><p id="cc-form-error" role="alert"></p><button id="cc-save" class="btn-tms btn-tms-primary">Guardar abono</button><button type="button" id="cc-close" class="btn-tms btn-tms-default">Cancelar</button></form></dialog>`;
  const find=s=>container.querySelector(s), form=find('#cc-form'), dialog=find('#cc-dialog');
  function render(){
    const q=find('#cc-search').value.trim().toLocaleLowerCase('es'),state=find('#cc-status').value;
    const visible=rows.filter(s=>(!q || [s.id,s.cliente,s.numero_factura].some(v=>String(v??'').toLocaleLowerCase('es').includes(q))) && (state==='todos' || (state==='pendiente'?Number(s.saldo)>0:Number(s.saldo)===0)));
    const total=visible.reduce((a,s)=>a+Number(s.saldo),0);
    find('#cc-summary').innerHTML=`<div><span>Servicios filtrados</span><strong>${visible.length}</strong></div><div><span>Saldo por cobrar</span><strong>${fmt.moneda(total)}</strong></div>`;
    find('#cc-body').innerHTML=visible.map(s=>`<tr><td>#${esc(s.id)}<br>${esc(s.fecha_servicio)}</td><td>${esc(s.cliente)}</td><td>${esc(s.numero_factura||'Por facturar')}</td><td>${fmt.moneda(s.precio_cliente)}</td><td>${fmt.moneda(s.abonado)}</td><td>${fmt.moneda(s.saldo)}</td><td>${Number(s.saldo)>0?`<button class="btn-tms btn-tms-primary" data-id="${esc(s.id)}">Abonar</button>`:'Saldado'}</td></tr>`).join('')||'<tr><td colspan="7">No hay cuentas para estos filtros.</td></tr>';
    const ids=new Set(visible.map(s=>String(s.id)));
    find('#cc-history').innerHTML=abonos.filter(a=>ids.has(String(a.servicio_id))).map(a=>`<tr><td>${esc(a.fecha)}</td><td>#${esc(a.servicio_id)}</td><td>${esc(a.cliente)}</td><td>${esc(a.referencia)}</td><td>${fmt.moneda(a.monto)}</td><td>${esc(a.registrado_por)}</td></tr>`).join('')||'<tr><td colspan="6">Sin abonos en esta selección.</td></tr>';
  }
  async function load(){find('#cc-refresh').disabled=true;find('#cc-error').textContent='';try{const r=await api.get('facturas/cuentas.php');rows=r.data;abonos=r.abonos;csrf=r.csrf_token;render();}catch(e){rows=[];abonos=[];csrf='';render();find('#cc-error').textContent=e.message;}finally{find('#cc-refresh').disabled=false;}}
  find('#cc-search').oninput=render;find('#cc-status').onchange=render;find('#cc-refresh').onclick=load;
  find('#cc-body').onclick=e=>{const b=e.target.closest('[data-id]');if(!b)return;selected=rows.find(s=>String(s.id)===b.dataset.id);form.reset();form.elements.fecha.value=hoy();form.elements.monto.max=selected.saldo;find('#cc-selected').textContent=`Servicio #${selected.id} · ${selected.cliente} · Saldo ${fmt.moneda(selected.saldo)}`;find('#cc-form-error').textContent='';dialog.showModal();};
  find('#cc-close').onclick=()=>dialog.close();dialog.addEventListener('cancel',e=>{if(find('#cc-save').disabled)e.preventDefault();});
  form.onsubmit=async e=>{e.preventDefault();find('#cc-save').disabled=true;find('#cc-close').disabled=true;try{await api.post('facturas/abonar.php',{...Object.fromEntries(new FormData(form)),servicio_id:selected.id,csrf_token:csrf});dialog.close();showToast('Abono registrado.');await load();}catch(err){find('#cc-form-error').textContent=err.message;}finally{find('#cc-save').disabled=false;find('#cc-close').disabled=false;}};
  await load();
}

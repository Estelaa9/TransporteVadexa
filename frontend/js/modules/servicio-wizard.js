// frontend/js/modules/servicio-wizard.js - Asistente de registro y edición de servicios en 4 pasos.
// 1 Cliente · 2 Modalidad del servicio · 3 Asignación · 4 Confirmación (solo revisión).
// Al avanzar, los datos del paso anterior quedan bloqueados (resumen con candado) y solo se cambian con «Editar».
// En Asignación se elige Flota propia o Tercerizado; las listas muestran primero lo disponible para el horario
// y lo no disponible aparece deshabilitado con el motivo. El servidor vuelve a validar todo al guardar.
import { api, showToast, fmt, esc, isoLocal } from '../api.js';

const PASOS = ['Cliente', 'Modalidad del servicio', 'Asignación', 'Confirmación'];
const AYUDA = [
  'Seleccione el cliente y programe la fecha y el horario del servicio.',
  'Indique el tipo de servicio, la ruta, la carga y la tarifa.',
  'Elija si el servicio se atiende con flota propia o con un proveedor tercerizado y asigne la unidad.',
  'Revise los datos. Para corregir algo use «Editar» en la sección correspondiente.',
];

function intervalo(fecha, horaIni, horaFin) {
  if (!fecha || !horaIni) return [null, null];
  const i = new Date(`${fecha}T${String(horaIni).slice(0, 5)}:00`);
  const fTxt = String(horaFin || '').slice(0, 5);
  let f = fTxt ? new Date(`${fecha}T${fTxt}:00`) : new Date(i.getTime() + 4 * 3600e3);
  if (f <= i) f = new Date(f.getTime() + 24 * 3600e3);
  return [i, f];
}
const hhmm = d => d.toTimeString().slice(0, 5);

export function crearAsistenteServicio({ getServicios, onGuardado }) {
  let clientes = [], vehiculos = [], conductores = [], proveedores = [];
  let paso = 1, editId = '', version = null, bloqueadoPorComprobante = false, catalogosCargados = false;

  const host = document.createElement('div');
  host.innerHTML = `
  <div class="tms-modal-backdrop" id="srvw-modal">
    <div class="tms-modal-dialog" style="max-width: 900px;">
      <div class="tms-modal-header">
        <div class="tms-modal-title" id="srvw-titulo"><i class="bi bi-truck"></i> Registrar servicio</div>
        <button type="button" class="tms-modal-close" data-cerrar aria-label="Cerrar">&times;</button>
      </div>
      <form id="srvw-form" novalidate>
        <div class="srv-wizard-progress" aria-label="Pasos del registro">
          ${PASOS.map((p, i) => `<div class="srv-wizard-step" data-ind="${i + 1}"><span>${i + 1}</span><strong>${p}</strong></div>`).join('')}
        </div>
        <div class="tms-modal-body">
          <p id="srvw-ayuda" class="srv-wizard-help" role="status"></p>
          <div id="srvw-bloqueado"></div>

          <section data-paso="1" class="form-grid">
            <div class="col-12 form-group"><label class="form-label" for="w-cliente">Cliente *</label>
              <select id="w-cliente" class="form-control-tms" required><option value="">Seleccione un cliente</option></select></div>
            <div class="col-4 form-group"><label class="form-label" for="w-fecha">Fecha del servicio *</label>
              <input type="date" id="w-fecha" class="form-control-tms" required></div>
            <div class="col-4 form-group"><label class="form-label" for="w-hora">Hora de inicio *</label>
              <input type="time" id="w-hora" class="form-control-tms" required></div>
            <div class="col-4 form-group"><label class="form-label" for="w-hora-fin">Hora fin estimada *</label>
              <input type="time" id="w-hora-fin" class="form-control-tms" required>
              <small class="muted">Si es menor que el inicio, termina al día siguiente.</small></div>
          </section>

          <section data-paso="2" class="form-grid" hidden>
            <div class="col-4 form-group"><label class="form-label" for="w-tipo-servicio">Tipo de servicio *</label>
              <select id="w-tipo-servicio" class="form-control-tms">${['Local', 'Provincia', 'Mudanza', 'Distribución', 'Especial'].map(t => `<option>${t}</option>`).join('')}</select></div>
            <div class="col-4 form-group"><label class="form-label" for="w-tipo-carga">Tipo de carga</label>
              <select id="w-tipo-carga" class="form-control-tms">${[['General', 'General'], ['Frágil', 'Frágil'], ['Refrigerada', 'Refrigerada'], ['Maquinaria', 'Maquinaria'], ['Enseres', 'Enseres / Muebles']].map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
            <div class="col-4 form-group"><label class="form-label" for="w-peso">Peso de la carga (kg)</label>
              <input type="number" id="w-peso" min="0" step="0.01" class="form-control-tms" placeholder="Opcional"></div>
            <div class="col-6 form-group"><label class="form-label" for="w-origen">Origen *</label>
              <input type="text" id="w-origen" class="form-control-tms" maxlength="500" required placeholder="Dirección o almacén de origen"></div>
            <div class="col-6 form-group"><label class="form-label" for="w-destino">Destino *</label>
              <input type="text" id="w-destino" class="form-control-tms" maxlength="500" required placeholder="Dirección de destino"></div>
            <div class="col-4 form-group"><label class="form-label" for="w-precio">Precio al cliente con IGV (S/) *</label>
              <input type="number" id="w-precio" min="0.01" step="0.01" class="form-control-tms" required style="font-weight:700"></div>
            <div class="col-4 form-group"><label class="form-label" for="w-comprobante">Comprobante a emitir *</label>
              <select id="w-comprobante" class="form-control-tms"><option value="FACTURA">Factura</option><option value="BOLETA">Boleta</option><option value="SIN_COMPROBANTE">Sin comprobante</option></select></div>
            <div class="col-4 form-group"><label class="form-label" for="w-forma-pago">Forma de pago</label>
              <select id="w-forma-pago" class="form-control-tms">${['Contado', 'Crédito 15 días', 'Crédito 30 días', 'Contra entrega'].map(t => `<option>${t}</option>`).join('')}</select></div>
            <div class="col-4 form-group"><label class="form-label" for="w-guia-rem">Guía de remitente</label>
              <input type="text" id="w-guia-rem" class="form-control-tms" maxlength="30" placeholder="T001-XXXXXX"></div>
            <div class="col-4 form-group"><label class="form-label" for="w-estado">Estado inicial</label>
              <select id="w-estado" class="form-control-tms"><option value="programado">Programado</option><option value="en_ruta">En ruta</option><option value="finalizado">Finalizado</option></select></div>
            <div class="col-4 form-group"><label class="form-label">Base sin IGV · IGV</label>
              <div id="w-igv" class="form-control-tms" style="background:#f8fafc">—</div></div>
            <div class="col-12"><small class="muted" id="w-nota-precio">El servidor recalcula los montos al guardar. El comprobante se registra en Facturación cuando el servicio finaliza.</small></div>
          </section>

          <section data-paso="3" hidden>
            <div class="srvw-opciones" role="radiogroup" aria-label="Tipo de asignación">
              <label class="srvw-opcion"><input type="radio" name="w-modalidad" value="propio" checked>
                <span><i class="bi bi-truck"></i><strong>Flota propia</strong><small>Vehículo y conductor de la empresa</small></span></label>
              <label class="srvw-opcion"><input type="radio" name="w-modalidad" value="tercerizado">
                <span><i class="bi bi-building"></i><strong>Tercerizado</strong><small>Unidad de un proveedor</small></span></label>
            </div>
            <p id="w-disponibilidad" class="muted" style="margin:10px 0"></p>
            <div class="form-grid" data-modo="propio">
              <div class="col-6 form-group"><label class="form-label" for="w-vehiculo">Vehículo propio *</label>
                <select id="w-vehiculo" class="form-control-tms"></select></div>
              <div class="col-6 form-group"><label class="form-label" for="w-conductor">Conductor de la empresa *</label>
                <select id="w-conductor" class="form-control-tms"></select></div>
            </div>
            <div class="form-grid" data-modo="tercerizado" hidden>
              <div class="col-8 form-group"><label class="form-label" for="w-proveedor">Vehículo del proveedor *</label>
                <select id="w-proveedor" class="form-control-tms"></select></div>
              <div class="col-4 form-group"><label class="form-label" for="w-costo">Costo del proveedor sin IGV (S/) *</label>
                <input type="number" id="w-costo" min="0" step="0.01" class="form-control-tms"></div>
            </div>
            <p id="w-aviso" class="muted"></p>
          </section>

          <section data-paso="4" hidden><div id="srvw-revision"></div></section>
          <p id="srvw-error" role="alert" class="text-danger" style="margin-top:8px"></p>
        </div>
        <div class="tms-modal-footer">
          <button type="button" class="btn-tms btn-tms-default" data-cerrar>Cancelar</button>
          <button type="button" class="btn-tms btn-tms-default" id="srvw-ant">‹ Anterior</button>
          <button type="button" class="btn-tms btn-tms-primary" id="srvw-sig">Siguiente ›</button>
          <button type="submit" class="btn-tms btn-tms-primary" id="srvw-guardar" hidden><i class="bi bi-save"></i> Guardar servicio</button>
        </div>
      </form>
    </div>
  </div>`;
  document.body.appendChild(host);
  const $ = id => host.querySelector('#' + id);
  const modal = $('srvw-modal');
  const modalidad = () => host.querySelector('input[name="w-modalidad"]:checked').value;

  /* ---------- datos derivados ---------- */
  const clienteSel = () => clientes.find(c => String(c.id) === $('w-cliente').value);
  const ocupados = () => {
    const [ini, fin] = intervalo($('w-fecha').value, $('w-hora').value, $('w-hora-fin').value);
    if (!ini) return [];
    return getServicios().filter(s => {
      if (String(s.id) === String(editId) || s.estado_servicio === 'cancelado') return false;
      const [i2, f2] = intervalo(s.fecha_servicio, s.hora_servicio, s.hora_fin_estimada);
      return i2 && ini < f2 && fin > i2;
    });
  };
  const textoHorario = s => `#${s.id} ${fmt.hora(s.hora_servicio)}–${fmt.hora(s.hora_fin_estimada)}`;

  function motivoVehiculo(v, fecha, peso, busy) {
    if (String(v.estado || 'activo').trim().toLowerCase() !== 'activo') return `en ${v.estado}`;
    if (v.soat_vencimiento && v.soat_vencimiento < fecha) return 'SOAT vencido';
    if (v.revision_vencimiento && v.revision_vencimiento < fecha) return 'revisión técnica vencida';
    const s = busy.find(x => String(x.vehiculo_id) === String(v.id));
    if (s) return `ocupado en ${textoHorario(s)}`;
    if (peso && v.capacidad_kg && peso > Number(v.capacidad_kg)) return `capacidad ${fmt.numero(v.capacidad_kg)} kg insuficiente`;
    return '';
  }
  function motivoConductor(c, fecha, busy) {
    if (String(c.estado || 'activo').trim().toLowerCase() !== 'activo') return `en ${c.estado}`;
    if (c.licencia_vencimiento && c.licencia_vencimiento < fecha) return 'licencia vencida';
    const s = busy.find(x => String(x.conductor_id) === String(c.id));
    return s ? `ocupado en ${textoHorario(s)}` : '';
  }
  function motivoProveedor(p, busy) {
    if (String(p.estado || 'activo').trim().toLowerCase() !== 'activo') return 'inactivo';
    const s = busy.find(x => String(x.proveedor_id) === String(p.id));
    return s ? `unidad ocupada en ${textoHorario(s)}` : '';
  }

  // Lista ordenada: primero disponibles, luego no disponibles (deshabilitadas con el motivo).
  function llenarSelect(sel, items, etiqueta, motivo, vacio) {
    const actual = sel.value || sel.dataset.valor || '';
    const disp = [], nodisp = [];
    items.forEach(it => (motivo(it) ? nodisp : disp).push(it));
    sel.innerHTML = `<option value="">${disp.length ? vacio : 'No hay unidades disponibles en este horario'}</option>`
      + (disp.length ? `<optgroup label="Disponibles (${disp.length})">${disp.map(it => `<option value="${esc(it.id)}">${esc(etiqueta(it))}</option>`).join('')}</optgroup>` : '')
      + (nodisp.length ? `<optgroup label="No disponibles (${nodisp.length})">${nodisp.map(it => `<option value="${esc(it.id)}" disabled>${esc(etiqueta(it))} — ${esc(motivo(it))}</option>`).join('')}</optgroup>` : '');
    if (disp.some(it => String(it.id) === String(actual))) sel.value = actual;
    delete sel.dataset.valor;
    return disp.length;
  }

  function renderAsignacion() {
    const modo = modalidad();
    host.querySelector('[data-modo="propio"]').hidden = modo !== 'propio';
    host.querySelector('[data-modo="tercerizado"]').hidden = modo !== 'tercerizado';
    $('w-vehiculo').required = $('w-conductor').required = modo === 'propio';
    $('w-proveedor').required = $('w-costo').required = modo === 'tercerizado';
    const fecha = $('w-fecha').value;
    const peso = Number($('w-peso').value) || 0;
    const busy = ocupados();
    if (modo === 'propio') {
      const nv = llenarSelect($('w-vehiculo'), vehiculos, v => `${v.placa} · ${v.modelo || v.tipo || 'Unidad'}${v.capacidad_kg ? ' · ' + fmt.numero(v.capacidad_kg) + ' kg' : ''}`,
        v => motivoVehiculo(v, fecha, peso, busy), 'Seleccione un vehículo');
      const nc = llenarSelect($('w-conductor'), conductores, c => `${c.nombre}${c.categoria_licencia ? ' · ' + c.categoria_licencia : ''}`,
        c => motivoConductor(c, fecha, busy), 'Seleccione un conductor');
      $('w-disponibilidad').textContent = `Para el ${fmt.fecha(fecha)} de ${$('w-hora').value} a ${$('w-hora-fin').value}: ${nv} de ${vehiculos.length} vehículos y ${nc} de ${conductores.length} conductores disponibles.`;
    } else {
      const np = llenarSelect($('w-proveedor'), proveedores, p => `${p.nombre}${p.vehiculo ? ' · ' + p.vehiculo : ''}${p.placa ? ' · ' + p.placa : ''}`,
        p => motivoProveedor(p, busy), 'Seleccione el vehículo del proveedor');
      $('w-disponibilidad').textContent = `Para el ${fmt.fecha(fecha)} de ${$('w-hora').value} a ${$('w-hora-fin').value}: ${np} de ${proveedores.length} unidades de proveedores disponibles.`;
    }
    avisoCapacidad();
  }

  function avisoCapacidad() {
    const v = vehiculos.find(x => String(x.id) === $('w-vehiculo').value);
    const peso = Number($('w-peso').value) || 0;
    const c = conductores.find(x => String(x.id) === $('w-conductor').value);
    const avisos = [];
    if (modalidad() === 'propio' && v) {
      for (const [k, l] of [['soat_vencimiento', 'SOAT'], ['revision_vencimiento', 'revisión técnica']]) {
        if (v[k] && v[k] <= isoLocal(new Date(Date.now() + 30 * 864e5))) avisos.push(`El ${l} de ${v.placa} vence el ${fmt.fecha(v[k])}.`);
      }
      if (!v.capacidad_kg && peso) avisos.push(`${v.placa} no tiene capacidad registrada.`);
    }
    if (modalidad() === 'propio' && c && !c.licencia_vencimiento) avisos.push(`No se registró el vencimiento de la licencia de ${c.nombre}.`);
    $('w-aviso').textContent = avisos.join(' ');
  }

  function igvPreview() {
    const monto = parseFloat($('w-precio').value) || 0;
    const base = Math.round(monto / 1.18 * 100) / 100;
    $('w-igv').textContent = `${fmt.moneda(base)} · ${fmt.moneda(monto - base)}`;
  }

  /* ---------- resúmenes bloqueados ---------- */
  const optTxt = id => $(id).selectedOptions[0]?.textContent?.replace(/ — .*$/, '') || '—';
  function secciones() {
    const c = clienteSel();
    const terc = modalidad() === 'tercerizado';
    const precio = parseFloat($('w-precio').value) || 0;
    const base = Math.round(precio / 1.18 * 100) / 100;
    const costo = terc ? (parseFloat($('w-costo').value) || 0) : 0;
    return [
      [1, 'Cliente', [['Cliente', c ? `${c.nombre} (${c.documento || c.tipo_cliente})` : '—'], ['Fecha', fmt.fecha($('w-fecha').value)], ['Horario', `${$('w-hora').value} – ${$('w-hora-fin').value}`]]],
      [2, 'Modalidad del servicio', [['Servicio', `${$('w-tipo-servicio').value} · carga ${optTxt('w-tipo-carga')}${$('w-peso').value ? ' · ' + fmt.numero($('w-peso').value) + ' kg' : ''}`],
        ['Ruta', `${$('w-origen').value || '—'} → ${$('w-destino').value || '—'}`], ['Precio', `${fmt.moneda(precio)} (base ${fmt.moneda(base)})`],
        ['Comprobante y pago', `${optTxt('w-comprobante')} · ${$('w-forma-pago').value}`], ['Estado inicial', optTxt('w-estado')],
        ...($('w-guia-rem').value ? [['Guía de remitente', $('w-guia-rem').value]] : [])]],
      [3, 'Asignación', terc
        ? [['Modalidad', 'Tercerizado'], ['Unidad del proveedor', optTxt('w-proveedor')], ['Costo del proveedor', fmt.moneda(costo)], ['Margen estimado sin IGV', fmt.moneda(base - costo)]]
        : [['Modalidad', 'Flota propia'], ['Vehículo', optTxt('w-vehiculo')], ['Conductor', optTxt('w-conductor')], ['Margen estimado sin IGV', fmt.moneda(base)]]],
    ];
  }
  const tarjeta = ([n, titulo, filas]) => `<div class="srvw-bloque">
      <div class="srvw-bloque-tit"><span><i class="bi bi-lock-fill"></i> ${n}. ${esc(titulo)}</span>
        <button type="button" class="btn-tms btn-tms-default" data-editar="${n}"><i class="bi bi-pencil"></i> Editar</button></div>
      <dl>${filas.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>`;

  /* ---------- navegación ---------- */
  function irA(n) {
    paso = Math.min(4, Math.max(1, n));
    host.querySelectorAll('[data-paso]').forEach(s => { s.hidden = Number(s.dataset.paso) !== paso; });
    host.querySelectorAll('[data-ind]').forEach(el => {
      const i = Number(el.dataset.ind);
      el.classList.toggle('active', i === paso);
      el.classList.toggle('complete', i < paso);
      el.setAttribute('aria-current', i === paso ? 'step' : 'false');
    });
    $('srvw-ayuda').textContent = `Paso ${paso} de 4: ${AYUDA[paso - 1]}`;
    const sec = secciones();
    $('srvw-bloqueado').innerHTML = paso > 1 && paso < 4 ? `<div class="srvw-bloqueados">${sec.slice(0, paso - 1).map(tarjeta).join('')}</div>` : '';
    if (paso === 3) renderAsignacion();
    if (paso === 4) $('srvw-revision').innerHTML = sec.map(tarjeta).join('');
    $('srvw-ant').hidden = paso === 1;
    $('srvw-sig').hidden = paso === 4;
    $('srvw-guardar').hidden = paso !== 4;
    $('srvw-error').textContent = '';
  }

  function validarPaso(n) {
    const sec = host.querySelector(`[data-paso="${n}"]`);
    const campos = [...sec.querySelectorAll('input, select')].filter(f => !f.disabled && f.offsetParent !== null);
    const malo = campos.find(f => !f.checkValidity());
    if (malo) { malo.reportValidity(); return false; }
    if (n === 1 && $('w-hora').value === $('w-hora-fin').value) { $('srvw-error').textContent = 'La hora de fin debe ser distinta de la hora de inicio.'; return false; }
    if (n === 2 && $('w-comprobante').value === 'FACTURA' && !/^(10|15|16|17|20)\d{9}$/.test(String(clienteSel()?.documento || ''))) {
      $('srvw-error').textContent = 'Para emitir factura el cliente debe tener RUC. Elija boleta o corrija el cliente.';
      return false;
    }
    return true;
  }

  $('srvw-sig').onclick = () => { if (validarPaso(paso)) irA(paso + 1); };
  $('srvw-ant').onclick = () => irA(paso - 1);
  host.addEventListener('click', e => {
    const ed = e.target.closest('[data-editar]');
    if (ed) irA(Number(ed.dataset.editar));
    if (e.target.closest('[data-cerrar]')) modal.classList.remove('show');
  });
  host.querySelectorAll('input[name="w-modalidad"]').forEach(r => r.addEventListener('change', renderAsignacion));
  $('w-vehiculo').addEventListener('change', avisoCapacidad);
  $('w-conductor').addEventListener('change', avisoCapacidad);
  $('w-precio').addEventListener('input', igvPreview);

  /* ---------- carga y apertura ---------- */
  async function cargarCatalogos() {
    if (catalogosCargados) return;
    const [c, v, co, p] = await Promise.all([api.get('clientes/index.php'), api.get('vehiculos/index.php'), api.get('conductores/index.php'), api.get('proveedores/index.php')]);
    clientes = c.data || []; vehiculos = v.data || []; conductores = co.data || []; proveedores = p.data || [];
    $('w-cliente').innerHTML = '<option value="">Seleccione un cliente</option>' +
      [...clientes].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es')).map(x => `<option value="${esc(x.id)}">${esc(x.nombre)} (${esc(x.documento || x.tipo_cliente)})</option>`).join('');
    catalogosCargados = true;
  }

  function bloquearMontos(bloq, comprobante) {
    bloqueadoPorComprobante = bloq;
    ['w-cliente', 'w-precio', 'w-comprobante'].forEach(id => { $(id).disabled = bloq; });
    host.querySelectorAll('input[name="w-modalidad"]').forEach(r => { r.disabled = bloq; });
    $('w-costo').disabled = bloq;
    $('w-nota-precio').textContent = bloq
      ? `Servicio facturado (${comprobante}): cliente, importes, comprobante y modalidad no se pueden cambiar. Corrija con nota de crédito en Facturación.`
      : 'El servidor recalcula los montos al guardar. El comprobante se registra en Facturación cuando el servicio finaliza.';
  }

  async function abrir(id = null) {
    try { await cargarCatalogos(); } catch (err) { showToast(`No se pudieron cargar los catálogos: ${err.message}`, 'error'); return; }
    $('srvw-form').reset();
    editId = ''; version = null;
    bloquearMontos(false);
    $('w-estado').innerHTML = '<option value="programado">Programado</option><option value="en_ruta">En ruta</option><option value="finalizado">Finalizado</option>';
    if (id) {
      let s;
      try { s = (await api.get('servicios/index.php', { id })).data; } catch (err) { showToast(err.message, 'error'); return; }
      editId = String(s.id); version = s.version;
      $('srvw-titulo').innerHTML = `<i class="bi bi-pencil-square"></i> Editar servicio #${esc(s.id)}`;
      const set = (k, v) => { $(k).value = v ?? ''; };
      set('w-cliente', s.cliente_id); set('w-fecha', s.fecha_servicio); set('w-hora', String(s.hora_servicio || '').slice(0, 5));
      set('w-hora-fin', String(s.hora_fin_estimada || '').slice(0, 5)); set('w-tipo-servicio', s.tipo_servicio || 'Local');
      set('w-tipo-carga', s.tipo_carga || 'General'); set('w-peso', s.peso_kg); set('w-origen', s.origen); set('w-destino', s.destino);
      set('w-precio', s.precio_cliente); set('w-comprobante', s.tipo_comprobante || 'FACTURA'); set('w-forma-pago', s.forma_pago || 'Contado');
      set('w-guia-rem', s.guia_remitente); set('w-costo', Number(s.costo_proveedor) || '');
      // Solo se ofrecen los estados permitidos desde el actual.
      const permitidos = { programado: ['programado', 'en_ruta', 'finalizado'], en_ruta: ['en_ruta', 'finalizado'], finalizado: ['finalizado'] }[s.estado_servicio] || ['programado'];
      [...$('w-estado').options].forEach(o => { if (!permitidos.includes(o.value)) o.remove(); });
      set('w-estado', s.estado_servicio);
      host.querySelector(`input[name="w-modalidad"][value="${s.modalidad === 'tercerizado' ? 'tercerizado' : 'propio'}"]`).checked = true;
      $('w-vehiculo').dataset.valor = s.vehiculo_id || '';
      $('w-conductor').dataset.valor = s.conductor_id || '';
      $('w-proveedor').dataset.valor = s.proveedor_id || '';
      bloquearMontos(Boolean(s.comprobante_id), s.comprobante);
    } else {
      $('srvw-titulo').innerHTML = '<i class="bi bi-truck"></i> Registrar nuevo servicio';
      const ahora = new Date();
      $('w-fecha').value = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
      $('w-hora').value = hhmm(ahora);
      $('w-hora-fin').value = hhmm(new Date(ahora.getTime() + 4 * 3600e3));
    }
    igvPreview();
    irA(1);
    modal.classList.add('show');
  }

  /* ---------- guardar ---------- */
  $('srvw-form').addEventListener('submit', async e => {
    e.preventDefault();
    for (const n of [1, 2]) {
      irA(n);
      if (!validarPaso(n)) return;
    }
    irA(3);
    if (!validarPaso(3)) return;
    irA(4);
    const terc = modalidad() === 'tercerizado';
    const payload = {
      id: editId || undefined, version: version ?? undefined,
      cliente_id: $('w-cliente').value, fecha_servicio: $('w-fecha').value, hora_servicio: $('w-hora').value, hora_fin_estimada: $('w-hora-fin').value,
      tipo_servicio: $('w-tipo-servicio').value, tipo_carga: $('w-tipo-carga').value, peso_kg: $('w-peso').value,
      origen: $('w-origen').value, destino: $('w-destino').value, precio_cliente: $('w-precio').value,
      tipo_comprobante: $('w-comprobante').value, forma_pago: $('w-forma-pago').value, guia_remitente: $('w-guia-rem').value,
      estado_servicio: $('w-estado').value, modalidad: modalidad(),
      vehiculo_id: terc ? '' : $('w-vehiculo').value, conductor_id: terc ? '' : $('w-conductor').value,
      proveedor_id: terc ? $('w-proveedor').value : '', costo_proveedor: terc ? $('w-costo').value : 0,
    };
    const btn = $('srvw-guardar');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
    try {
      const res = await api.post(editId ? 'servicios/actualizar.php' : 'servicios/guardar.php', payload);
      modal.classList.remove('show');
      showToast(res.message || 'Servicio guardado.', res.avisos?.length ? 'warning' : 'success');
      onGuardado?.(res);
    } catch (err) {
      $('srvw-error').textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-save"></i> Guardar servicio';
    }
  });

  return {
    abrirNuevo: () => abrir(null),
    abrirEdicion: id => abrir(id),
    destruir: () => host.remove(),
    get bloqueado() { return bloqueadoPorComprobante; },
  };
}

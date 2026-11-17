import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtrarOperacion, esc } from '../frontend/js/modules/gestion.js';
const rows = [
  {id:1,fecha_servicio:'2026-09-01',estado_servicio:'programado',modalidad:'propio',tipo_servicio:'Local',placa:'ABC-123',numero_factura:''},
  {id:2,fecha_servicio:'2026-09-02',estado_servicio:'finalizado',modalidad:'tercerizado',tipo_servicio:'Provincia',conductor:'José',numero_factura:'F001-1'},
  {id:3,fecha_servicio:'2026-09-02',estado_servicio:'cancelado',numero_factura:''}
];
test('pendientes de facturar excluyen cancelados y son independientes del viaje',()=>{
  assert.deepEqual(filtrarOperacion(rows,{facturacion:'pendiente'}).map(s=>s.id),[1]);
  assert.deepEqual(filtrarOperacion(rows,{facturacion:'registrado',estado:'finalizado'}).map(s=>s.id),[2]);
});
test('filtros combinados por placa, conductor, modalidad y fechas inclusivas',()=>{
  assert.deepEqual(filtrarOperacion(rows,{buscar:' abc-123 ',desde:'2026-09-01',hasta:'2026-09-01'}).map(s=>s.id),[1]);
  assert.deepEqual(filtrarOperacion(rows,{buscar:'JOSÉ',modalidad:'tercerizado',tipo:'Provincia'}).map(s=>s.id),[2]);
  assert.equal(filtrarOperacion(rows,{modalidad:'propio',tipo:'Provincia'}).length,0);
});
test('datos operativos no se interpretan como HTML',()=>{
  assert.equal(esc('<script>"&\''),'&lt;script&gt;&quot;&amp;&#39;');
});

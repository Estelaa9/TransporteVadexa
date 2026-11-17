import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtrarFacturas, resumirFacturas } from '../frontend/js/modules/facturas.js';

const rows = [
  { id: 1, numero_factura: 'F001-001', tipo_comprobante: 'FACTURA', cliente: 'Transportes Álvarez', documento: '20123456789', fecha_servicio: '2026-09-01', estado_pago: 'pagada' },
  { id: 2, numero_factura: 'F001-002', tipo_comprobante: 'FACTURA', cliente: 'Cliente B', fecha_servicio: '2026-09-15', estado_pago: 'por_pagar' },
  { id: 3, numero_factura: '', tipo_comprobante: 'FACTURA', fecha_servicio: '2026-08-31', estado_pago: 'sin_registrar' },
  { id: 4, numero_factura: 'B001-001', tipo_comprobante: 'BOLETA', fecha_servicio: '2026-09-15', estado_pago: 'sin_registrar' }
];

test('emisión y pago son independientes: las pagadas también están emitidas', () => {
  assert.deepEqual(filtrarFacturas(rows, { tipo: 'FACTURA', emision: 'emitida' }).map(r => r.id), [1, 2]);
  assert.deepEqual(filtrarFacturas(rows, { emision: 'emitida', pago: 'pagada' }).map(r => r.id), [1]);
});
test('no interpreta comprobantes sin registro como pagos pendientes', () => {
  assert.deepEqual(filtrarFacturas(rows, { pago: 'por_pagar' }).map(r => r.id), [2]);
  assert.deepEqual(filtrarFacturas(rows, { emision: 'pendiente' }).map(r => r.id), [3]);
});
test('combina búsqueda y fechas inclusivas', () => {
  assert.deepEqual(filtrarFacturas(rows, { buscar: ' ÁLVAREZ ', desde: '2026-09-01', hasta: '2026-09-01' }).map(r => r.id), [1]);
  assert.equal(filtrarFacturas(rows, { buscar: '20123456789' }).length, 1);
  assert.equal(filtrarFacturas(rows, { buscar: 'inexistente' }).length, 0);
  assert.equal(filtrarFacturas([], {}).length, 0);
});

test('resume solo comprobantes emitidos y calcula cobros y saldos parciales', () => {
  const summary = resumirFacturas([
    { numero_factura: 'F001-001', precio_cliente: '118.00', abonado: '20.00', saldo: '98.00' },
    { numero_factura: 'B001-001', precio_cliente: '50.00', abonado: '50.00', saldo: '0.00' },
    { numero_factura: '', precio_cliente: '75.00', abonado: '10.00', saldo: '65.00' }
  ]);
  assert.deepEqual(summary, {
    servicios: 3,
    emitidas: 2,
    totalEmitido: 16800,
    cobrado: 7000,
    saldo: 9800,
    pendientesEmision: 1,
    totalPendienteEmision: 7500
  });
});

test('filtra por fechas de emisión sin mezclar fechas del servicio', () => {
  const rowsWithIssueDates = [
    { id: 1, fecha_servicio: '2026-08-01', fecha_emision: '2026-09-02', numero_factura: 'F001-001' },
    { id: 2, fecha_servicio: '2026-09-02', fecha_emision: null, numero_factura: '' }
  ];
  assert.deepEqual(filtrarFacturas(rowsWithIssueDates, { emisionDesde: '2026-09-01', emisionHasta: '2026-09-30' }).map(r => r.id), [1]);
  assert.deepEqual(filtrarFacturas(rowsWithIssueDates, { desde: '2026-09-01' }).map(r => r.id), [2]);
});

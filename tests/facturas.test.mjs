import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtrarComprobantes } from '../frontend/js/modules/facturas.js';
import { csvCell } from '../frontend/js/api.js';

const rows = [
  { id: 1, tipo: 'FACTURA', estado: 'emitida', estado_pago: 'parcial', fecha_emision: '2026-11-01', numero_completo: 'F001-000001', cliente: 'Andes SAC', documento: '20600000001', servicios: '10,11' },
  { id: 2, tipo: 'NOTA_CREDITO', estado: 'emitida', estado_pago: 'no_aplica', fecha_emision: '2026-11-05', numero_completo: 'FC01-000001', cliente: 'Andes SAC', documento: '20600000001', servicios: '12' },
  { id: 3, tipo: 'BOLETA', estado: 'anulada', estado_pago: 'no_aplica', fecha_emision: '2026-10-20', numero_completo: 'B001-000003', cliente: 'Juan Pérez', documento: '45678912', servicios: '13' },
];

test('filtra comprobantes por tipo, estado, pago y rango de emisión', () => {
  assert.deepEqual(filtrarComprobantes(rows, { tipo: 'FACTURA' }).map(r => r.id), [1]);
  assert.deepEqual(filtrarComprobantes(rows, { estado: 'anulada' }).map(r => r.id), [3]);
  assert.deepEqual(filtrarComprobantes(rows, { pago: 'parcial' }).map(r => r.id), [1]);
  assert.deepEqual(filtrarComprobantes(rows, { desde: '2026-11-01', hasta: '2026-11-30' }).map(r => r.id), [1, 2]);
});

test('busca por número, cliente, documento o servicio', () => {
  assert.deepEqual(filtrarComprobantes(rows, { buscar: 'pérez' }).map(r => r.id), [3]);
  assert.deepEqual(filtrarComprobantes(rows, { buscar: '11' }).map(r => r.id), [1]);
  assert.deepEqual(filtrarComprobantes(rows, { buscar: 'fc01' }).map(r => r.id), [2]);
});

test('el CSV neutraliza fórmulas (SEG-30) y escapa comillas', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell('-10'), `"'-10"`);
  assert.equal(csvCell('Normal'), '"Normal"');
});

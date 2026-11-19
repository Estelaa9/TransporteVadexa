<?php
// reportes/facturacion.php - Comprobantes por fecha de emisión (NEG-22), incluidas notas de crédito.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/lib.php';
require_once __DIR__ . '/../facturas/lib.php';
require_auth();
require_method('GET');
[$desde, $hasta] = periodo_desde_get();
$rows = db_all($conn, 'SELECT x.id, x.fecha_emision, x.numero_completo AS numero_factura, x.tipo AS tipo_comprobante, x.estado, x.cliente, x.documento,
        x.base_imponible, x.igv, x.total AS precio_cliente, x.pagado, x.saldo, x.estado_pago, x.referencia
    FROM (' . comprobantes_select() . ') x WHERE x.fecha_emision BETWEEN ? AND ? ORDER BY x.fecha_emision DESC, x.id DESC', 'ss', [$desde, $hasta]);
$t = ['total' => 0.0, 'base' => 0.0, 'igv' => 0.0];
foreach ($rows as $r) {
    if ($r['estado'] !== 'emitida' || $r['tipo_comprobante'] === 'NOTA_CREDITO') continue;
    $t['total'] += (float)$r['precio_cliente'];
    $t['base'] += (float)$r['base_imponible'];
    $t['igv'] += (float)$r['igv'];
}
json_response(['success' => true, 'tipo' => 'facturacion', 'total_registros' => count($rows),
    'total_facturado' => round($t['total'], 2), 'total_base' => round($t['base'], 2), 'total_igv' => round($t['igv'], 2), 'data' => $rows]);

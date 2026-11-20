<?php
// reportes/utilidad.php - Margen por servicio = base imponible − costo de terceros − gastos operativos vinculados (NEG-01, NEG-03).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/lib.php';
require_auth();
require_method('GET');
[$desde, $hasta] = periodo_desde_get();
$rows = db_all($conn, "SELECT s.id, s.fecha_servicio, s.modalidad, c.nombre AS cliente, s.precio_cliente, s.base_imponible, s.igv, s.costo_proveedor,
        COALESCE(g.gastos, 0) AS gastos_vinculados,
        ROUND(s.base_imponible - s.costo_proveedor - COALESCE(g.gastos, 0), 2) AS utilidad
    FROM servicios s LEFT JOIN clientes c ON c.id = s.cliente_id
    LEFT JOIN (SELECT servicio_id, SUM(monto) AS gastos FROM gastos_operativos WHERE servicio_id IS NOT NULL GROUP BY servicio_id) g ON g.servicio_id = s.id
    WHERE s.estado_servicio = 'finalizado' AND s.fecha_servicio BETWEEN ? AND ? ORDER BY s.fecha_servicio DESC, s.id DESC", 'ss', [$desde, $hasta]);
$t = ['base' => 0, 'costos' => 0, 'gastos' => 0, 'utilidad' => 0, 'cobrado' => 0];
foreach ($rows as $r) {
    $t['cobrado'] += (float)$r['precio_cliente'];
    $t['base'] += (float)$r['base_imponible'];
    $t['costos'] += (float)$r['costo_proveedor'];
    $t['gastos'] += (float)$r['gastos_vinculados'];
    $t['utilidad'] += (float)$r['utilidad'];
}
json_response(['success' => true, 'tipo' => 'utilidad', 'total_registros' => count($rows),
    'total_facturado' => round($t['cobrado'], 2), 'total_base' => round($t['base'], 2), 'total_costos' => round($t['costos'], 2),
    'total_gastos_vinculados' => round($t['gastos'], 2), 'total_utilidad' => round($t['utilidad'], 2),
    'nota' => 'Margen por servicio sin IGV. Los gastos generales no vinculados a un servicio se descuentan en el cierre del período.',
    'data' => $rows]);

<?php
// reportes/clientes.php - Ventas por cliente (servicios finalizados, sin IGV) y saldo por cobrar.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/lib.php';
require_auth();
require_method('GET');
[$desde, $hasta] = periodo_desde_get();
$rows = db_all($conn, "SELECT c.id, c.nombre AS cliente, c.documento, COUNT(s.id) AS total_viajes,
        COALESCE(SUM(s.base_imponible), 0) AS total_base, COALESCE(SUM(s.precio_cliente), 0) AS total_facturado
    FROM clientes c JOIN servicios s ON s.cliente_id = c.id AND s.estado_servicio = 'finalizado' AND s.fecha_servicio BETWEEN ? AND ?
    GROUP BY c.id, c.nombre, c.documento ORDER BY total_base DESC", 'ss', [$desde, $hasta]);
$gran = array_sum(array_map(fn($r) => (float)$r['total_facturado'], $rows));
json_response(['success' => true, 'tipo' => 'clientes', 'total_clientes' => count($rows), 'gran_total' => round($gran, 2), 'data' => $rows]);

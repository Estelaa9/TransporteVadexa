<?php
// reportes/servicios.php - Servicios del período (todos los estados; el total suma solo los no cancelados).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/lib.php';
require_auth();
require_method('GET');
[$desde, $hasta] = periodo_desde_get();
$rows = db_all($conn, 'SELECT s.*, c.nombre AS cliente, v.placa, co.nombre AS conductor, p.nombre AS proveedor
    FROM servicios s LEFT JOIN clientes c ON c.id = s.cliente_id LEFT JOIN vehiculos v ON v.id = s.vehiculo_id
    LEFT JOIN conductores co ON co.id = s.conductor_id LEFT JOIN proveedores p ON p.id = s.proveedor_id
    WHERE s.fecha_servicio BETWEEN ? AND ? ORDER BY s.fecha_servicio DESC, s.id DESC', 'ss', [$desde, $hasta]);
$total = 0.0;
foreach ($rows as $r) if ($r['estado_servicio'] !== 'cancelado') $total += (float)$r['precio_cliente'];
json_response(['success' => true, 'tipo' => 'servicios', 'total_registros' => count($rows), 'total_monto' => round($total, 2), 'data' => $rows]);

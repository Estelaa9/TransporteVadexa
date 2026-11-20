<?php
// clientes/servicios.php - Historial de servicios de un cliente.
require_once __DIR__ . '/../config/conexion.php';
require_auth();
require_method('GET');
$id = (int)($_GET['id'] ?? 0);
$cliente = db_one($conn, 'SELECT * FROM clientes WHERE id = ?', 'i', [$id]);
if (!$cliente) json_response(['success' => false, 'error' => 'Cliente no encontrado.'], 404);
$servicios = db_all($conn, "SELECT s.*, v.placa, co.nombre AS conductor, CONCAT(c.serie, '-', LPAD(c.numero, 6, '0')) AS comprobante
    FROM servicios s LEFT JOIN vehiculos v ON v.id = s.vehiculo_id LEFT JOIN conductores co ON co.id = s.conductor_id
    LEFT JOIN comprobantes c ON c.id = s.comprobante_id
    WHERE s.cliente_id = ? ORDER BY s.fecha_servicio DESC, s.id DESC", 'i', [$id]);
$facturado = 0.0;
foreach ($servicios as $s) {
    if ($s['comprobante_id'] && $s['estado_servicio'] !== 'cancelado') $facturado += (float)$s['precio_cliente'];
}
json_response(['success' => true, 'cliente' => $cliente, 'total_servicios' => count($servicios), 'total_facturado' => round($facturado, 2), 'servicios' => $servicios]);

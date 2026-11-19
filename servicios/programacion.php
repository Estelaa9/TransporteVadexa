<?php
// servicios/programacion.php - Programación diaria de servicios.
require_once __DIR__ . '/../config/conexion.php';
require_auth();
require_method('GET');
$fecha = (string)($_GET['fecha'] ?? date('Y-m-d'));
if (!validar_fecha($fecha)) json_response(['success' => false, 'error' => 'Fecha no válida.'], 422);
$rows = db_all($conn, 'SELECT s.*, c.nombre AS cliente, v.placa, co.nombre AS conductor, p.nombre AS proveedor
    FROM servicios s LEFT JOIN clientes c ON c.id = s.cliente_id LEFT JOIN vehiculos v ON v.id = s.vehiculo_id
    LEFT JOIN conductores co ON co.id = s.conductor_id LEFT JOIN proveedores p ON p.id = s.proveedor_id
    WHERE s.fecha_servicio = ? ORDER BY s.hora_servicio', 's', [$fecha]);
json_response(['success' => true, 'fecha' => $fecha, 'total' => count($rows), 'data' => $rows]);

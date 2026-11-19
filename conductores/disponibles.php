<?php
// conductores/disponibles.php - Conductores activos, con licencia vigente y sin viajes en la fecha.
require_once __DIR__ . '/../config/conexion.php';
require_auth();
require_method('GET');
$fecha = (string)($_GET['fecha'] ?? date('Y-m-d'));
if (!validar_fecha($fecha)) json_response(['success' => false, 'error' => 'Fecha no válida.'], 422);
$rows = db_all($conn, "SELECT * FROM conductores
    WHERE estado = 'activo' AND (licencia_vencimiento IS NULL OR licencia_vencimiento >= ?)
      AND id NOT IN (SELECT conductor_id FROM servicios WHERE fecha_servicio = ? AND estado_servicio <> 'cancelado' AND conductor_id IS NOT NULL)
    ORDER BY nombre", 'ss', [$fecha, $fecha]);
json_response(['success' => true, 'fecha' => $fecha, 'total' => count($rows), 'data' => $rows]);

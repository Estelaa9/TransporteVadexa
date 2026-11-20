<?php
// facturas/index.php - Comprobantes registrados y servicios finalizados pendientes de facturar.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/lib.php';
require_auth();
require_method('GET');

$where = ['1 = 1'];
$types = '';
$params = [];
if (($_GET['desde'] ?? '') !== '' && validar_fecha($_GET['desde'])) { $where[] = 'x.fecha_emision >= ?'; $types .= 's'; $params[] = $_GET['desde']; }
if (($_GET['hasta'] ?? '') !== '' && validar_fecha($_GET['hasta'])) { $where[] = 'x.fecha_emision <= ?'; $types .= 's'; $params[] = $_GET['hasta']; }

if (isset($_GET['id'])) {
    $c = db_one($conn, 'SELECT * FROM (' . comprobantes_select() . ') x WHERE x.id = ?', 'i', [(int)$_GET['id']]);
    if (!$c) json_response(['success' => false, 'error' => 'Comprobante no encontrado.'], 404);
    $c['detalle'] = db_all($conn, 'SELECT cs.*, s.fecha_servicio, s.origen, s.destino, s.tipo_servicio FROM comprobante_servicios cs JOIN servicios s ON s.id = cs.servicio_id WHERE cs.comprobante_id = ?', 'i', [$c['id']]);
    $c['pagos'] = db_all($conn, 'SELECT * FROM pagos WHERE comprobante_id = ? ORDER BY fecha, id', 'i', [$c['id']]);
    json_response(['success' => true, 'data' => $c, 'csrf_token' => csrf_token()]);
}

$comprobantes = db_all($conn, 'SELECT * FROM (' . comprobantes_select() . ') x WHERE ' . implode(' AND ', $where) . ' ORDER BY x.fecha_emision DESC, x.id DESC LIMIT 5000', $types, $params);
$porFacturar = db_all($conn, "SELECT s.id, s.fecha_servicio, s.cliente_id, c.nombre AS cliente, c.documento, c.tipo_cliente, c.dias_credito,
        s.tipo_comprobante, s.forma_pago, s.precio_cliente, s.base_imponible, s.igv, s.origen, s.destino
    FROM servicios s JOIN clientes c ON c.id = s.cliente_id
    WHERE s.estado_servicio = 'finalizado' AND s.comprobante_id IS NULL AND s.tipo_comprobante <> 'SIN_COMPROBANTE'
    ORDER BY c.nombre, s.fecha_servicio");
$series = db_all($conn, 'SELECT serie, tipo, aplica_a, ultimo_numero FROM series_comprobante WHERE activo = 1 ORDER BY tipo, serie');

json_response(['success' => true, 'data' => $comprobantes, 'por_facturar' => $porFacturar, 'series' => $series,
    'medios_pago' => PAGO_MEDIOS, 'csrf_token' => csrf_token()]);

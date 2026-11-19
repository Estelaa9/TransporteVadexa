<?php
// servicios/index.php - Listado y consulta de servicios.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
require_method('GET');

$select = "SELECT s.*, c.nombre AS cliente, c.documento AS cliente_documento, v.placa, co.nombre AS conductor, p.nombre AS proveedor,
    CASE WHEN cp.id IS NULL THEN NULL ELSE CONCAT(cp.serie, '-', LPAD(cp.numero, 6, '0')) END AS comprobante
    FROM servicios s
    LEFT JOIN clientes c ON c.id = s.cliente_id
    LEFT JOIN vehiculos v ON v.id = s.vehiculo_id
    LEFT JOIN conductores co ON co.id = s.conductor_id
    LEFT JOIN proveedores p ON p.id = s.proveedor_id
    LEFT JOIN comprobantes cp ON cp.id = s.comprobante_id";

if (($_GET['action'] ?? '') === 'get' || isset($_GET['id'])) {
    crud_obtener($conn, "$select WHERE s.id = ?", (int)($_GET['id'] ?? 0), 'Servicio');
}

$where = ['1 = 1'];
$types = '';
$params = [];
if (($_GET['fecha'] ?? '') !== '' && validar_fecha($_GET['fecha'])) { $where[] = 's.fecha_servicio = ?'; $types .= 's'; $params[] = $_GET['fecha']; }
if (($_GET['desde'] ?? '') !== '' && validar_fecha($_GET['desde'])) { $where[] = 's.fecha_servicio >= ?'; $types .= 's'; $params[] = $_GET['desde']; }
if (($_GET['hasta'] ?? '') !== '' && validar_fecha($_GET['hasta'])) { $where[] = 's.fecha_servicio <= ?'; $types .= 's'; $params[] = $_GET['hasta']; }
if (($_GET['estado'] ?? '') !== '') { $where[] = 's.estado_servicio = ?'; $types .= 's'; $params[] = (string)$_GET['estado']; }
if (($_GET['cliente_id'] ?? '') !== '') { $where[] = 's.cliente_id = ?'; $types .= 'i'; $params[] = (int)$_GET['cliente_id']; }
if (($_GET['por_facturar'] ?? '') === '1') { $where[] = "s.estado_servicio = 'finalizado' AND s.comprobante_id IS NULL AND s.tipo_comprobante <> 'SIN_COMPROBANTE'"; }
[$limit, $offset] = crud_paginacion();
$order = ($_GET['fecha'] ?? '') !== '' ? 's.hora_servicio ASC' : 's.fecha_servicio DESC, s.id DESC';
$rows = db_all($conn, "$select WHERE " . implode(' AND ', $where) . " ORDER BY $order LIMIT ? OFFSET ?", $types . 'ii', array_merge($params, [$limit, $offset]));
json_response(['success' => true, 'total' => count($rows), 'data' => $rows]);

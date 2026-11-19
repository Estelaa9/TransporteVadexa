<?php
// gastos_operativos/index.php - Gastos de la flota (por vehículo y, opcionalmente, por servicio).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
require_method('GET');
$select = 'SELECT g.*, g.tipo_gasto AS tipo, v.placa, v.modelo FROM gastos_operativos g LEFT JOIN vehiculos v ON v.id = g.vehiculo_id';
if (($_GET['action'] ?? '') === 'get' || isset($_GET['id'])) {
    crud_obtener($conn, "$select WHERE g.id = ?", (int)($_GET['id'] ?? 0), 'Gasto');
}
$where = ['1 = 1'];
$types = '';
$params = [];
if (($_GET['mes'] ?? '') !== '') { $where[] = 'MONTH(g.fecha) = ?'; $types .= 'i'; $params[] = (int)$_GET['mes']; }
if (($_GET['anio'] ?? '') !== '') { $where[] = 'YEAR(g.fecha) = ?'; $types .= 'i'; $params[] = (int)$_GET['anio']; }
if (($_GET['vehiculo_id'] ?? '') !== '') { $where[] = 'g.vehiculo_id = ?'; $types .= 'i'; $params[] = (int)$_GET['vehiculo_id']; }
$rows = db_all($conn, "$select WHERE " . implode(' AND ', $where) . ' ORDER BY g.fecha DESC, g.id DESC', $types, $params);
$total = array_sum(array_map(fn($r) => (float)$r['monto'], $rows));
json_response(['success' => true, 'total' => count($rows), 'total_monto' => round($total, 2), 'data' => $rows]);

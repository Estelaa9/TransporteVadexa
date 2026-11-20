<?php
// gastos_administrativos/index.php - Gastos generales de la empresa.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
require_method('GET');
$select = 'SELECT g.*, g.tipo_gasto AS tipo FROM gastos_administrativos g';
if (($_GET['action'] ?? '') === 'get' || isset($_GET['id'])) {
    crud_obtener($conn, "$select WHERE g.id = ?", (int)($_GET['id'] ?? 0), 'Gasto');
}
$where = ['1 = 1'];
$types = '';
$params = [];
if (($_GET['mes'] ?? '') !== '') { $where[] = 'MONTH(g.fecha) = ?'; $types .= 'i'; $params[] = (int)$_GET['mes']; }
if (($_GET['anio'] ?? '') !== '') { $where[] = 'YEAR(g.fecha) = ?'; $types .= 'i'; $params[] = (int)$_GET['anio']; }
$rows = db_all($conn, "$select WHERE " . implode(' AND ', $where) . ' ORDER BY g.fecha DESC, g.id DESC', $types, $params);
$total = array_sum(array_map(fn($r) => (float)$r['monto'], $rows));
json_response(['success' => true, 'total' => count($rows), 'total_monto' => round($total, 2), 'data' => $rows]);

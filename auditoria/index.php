<?php
// auditoria/index.php - Consulta del registro de auditoría (quién hizo qué y cuándo).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
require_method('GET');
$where = ['1 = 1'];
$types = '';
$params = [];
if (($_GET['desde'] ?? '') !== '' && validar_fecha($_GET['desde'])) { $where[] = 'fecha >= ?'; $types .= 's'; $params[] = $_GET['desde'] . ' 00:00:00'; }
if (($_GET['hasta'] ?? '') !== '' && validar_fecha($_GET['hasta'])) { $where[] = 'fecha <= ?'; $types .= 's'; $params[] = $_GET['hasta'] . ' 23:59:59'; }
foreach (['tabla', 'accion', 'usuario'] as $campo) {
    if (($_GET[$campo] ?? '') !== '') { $where[] = "$campo = ?"; $types .= 's'; $params[] = (string)$_GET[$campo]; }
}
if (($_GET['registro_id'] ?? '') !== '') { $where[] = 'registro_id = ?'; $types .= 's'; $params[] = (string)$_GET['registro_id']; }
[$limit, $offset] = crud_paginacion(1000);
$rows = db_all($conn, 'SELECT * FROM auditoria WHERE ' . implode(' AND ', $where) . ' ORDER BY id DESC LIMIT ? OFFSET ?', $types . 'ii', array_merge($params, [$limit, $offset]));
$tablas = array_column(db_all($conn, 'SELECT DISTINCT tabla FROM auditoria ORDER BY tabla'), 'tabla');
json_response(['success' => true, 'data' => $rows, 'tablas' => $tablas]);

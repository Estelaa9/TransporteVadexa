<?php
// proveedores/index.php - Listado y consulta de proveedores.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
require_method('GET');
if (($_GET['action'] ?? '') === 'get' || isset($_GET['id'])) {
    crud_obtener($conn, 'SELECT * FROM proveedores WHERE id = ?', (int)($_GET['id'] ?? 0), 'Proveedor');
}
[$limit, $offset] = crud_paginacion();
$rows = db_all($conn, 'SELECT * FROM proveedores ORDER BY id DESC LIMIT ? OFFSET ?', 'ii', [$limit, $offset]);
json_response(['success' => true, 'total' => count($rows), 'data' => $rows]);

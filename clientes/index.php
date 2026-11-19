<?php
// clientes/index.php - Listado y consulta de clientes.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
require_method('GET');

if (($_GET['action'] ?? '') === 'get' || isset($_GET['id'])) {
    crud_obtener($conn, 'SELECT * FROM clientes WHERE id = ?', (int)($_GET['id'] ?? 0), 'Cliente');
}
[$limit, $offset] = crud_paginacion();
$tipo = (string)($_GET['tipo'] ?? '');
if ($tipo !== '') {
    $rows = db_all($conn, 'SELECT * FROM clientes WHERE tipo_cliente = ? ORDER BY id DESC LIMIT ? OFFSET ?', 'sii', [$tipo, $limit, $offset]);
} else {
    $rows = db_all($conn, 'SELECT * FROM clientes ORDER BY id DESC LIMIT ? OFFSET ?', 'ii', [$limit, $offset]);
}
json_response(['success' => true, 'total' => (int)db_value($conn, 'SELECT COUNT(*) FROM clientes'), 'data' => $rows]);

<?php
// conductores/index.php - Listado y consulta de conductores, con alerta de licencia.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
require_method('GET');
$alerta = "CASE WHEN licencia_vencimiento IS NULL THEN 'sin_dato' WHEN licencia_vencimiento < CURDATE() THEN 'vencido'
    WHEN licencia_vencimiento <= CURDATE() + INTERVAL 30 DAY THEN 'por_vencer' ELSE 'vigente' END AS estado_licencia";
if (($_GET['action'] ?? '') === 'get' || isset($_GET['id'])) {
    crud_obtener($conn, "SELECT *, $alerta FROM conductores WHERE id = ?", (int)($_GET['id'] ?? 0), 'Conductor');
}
[$limit, $offset] = crud_paginacion();
$rows = db_all($conn, "SELECT *, $alerta FROM conductores ORDER BY id DESC LIMIT ? OFFSET ?", 'ii', [$limit, $offset]);
json_response(['success' => true, 'total' => count($rows), 'data' => $rows]);

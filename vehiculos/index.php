<?php
// vehiculos/index.php - Listado y consulta de la flota, con alertas de documentos.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
require_method('GET');
$alertas = "CASE WHEN soat_vencimiento < CURDATE() OR revision_vencimiento < CURDATE() THEN 'vencido'
    WHEN soat_vencimiento <= CURDATE() + INTERVAL 30 DAY OR revision_vencimiento <= CURDATE() + INTERVAL 30 DAY THEN 'por_vencer'
    ELSE 'vigente' END AS estado_documentos";
if (($_GET['action'] ?? '') === 'get' || isset($_GET['id'])) {
    crud_obtener($conn, "SELECT *, $alertas FROM vehiculos WHERE id = ?", (int)($_GET['id'] ?? 0), 'Vehículo');
}
[$limit, $offset] = crud_paginacion();
$rows = db_all($conn, "SELECT *, $alertas FROM vehiculos ORDER BY id DESC LIMIT ? OFFSET ?", 'ii', [$limit, $offset]);
json_response(['success' => true, 'total' => count($rows), 'data' => $rows]);

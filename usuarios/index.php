<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/gestion.php';
require_admin();
$res = mysqli_query($conn, 'SELECT id, nombre, usuario, rol, estado FROM usuarios ORDER BY nombre, id');
$users = [];
while ($row = mysqli_fetch_assoc($res)) {
    $row['modulos'] = get_user_module_access((int)$row['id']);
    $users[] = $row;
}
json_response([
    'success' => true,
    'data' => $users,
    'module_catalog' => get_default_user_modules(),
    'csrf_token' => gestion_csrf()
]);

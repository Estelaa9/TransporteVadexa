<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/gestion.php';
require_admin();

$data = get_request_data();
gestion_post($data);
$user_id = (int)($data['user_id'] ?? 0);
$selected = $data['modulos'] ?? [];
if ($user_id <= 0 || !is_array($selected)) {
    json_response(['success' => false, 'error' => 'Usuario no válido.'], 422);
}

$catalog = get_default_user_modules();
$knownModules = array_column($catalog, 'modulo');
if (array_diff($selected, $knownModules)) {
    json_response(['success' => false, 'error' => 'La selección contiene módulos no válidos.'], 422);
}

$userCheck = mysqli_prepare($conn, 'SELECT id FROM usuarios WHERE id = ? LIMIT 1');
mysqli_stmt_bind_param($userCheck, 'i', $user_id);
mysqli_stmt_execute($userCheck);
if (!mysqli_fetch_assoc(mysqli_stmt_get_result($userCheck))) {
    json_response(['success' => false, 'error' => 'El usuario seleccionado no existe.'], 404);
}

$updatedBy = $_SESSION['usuario'] ?? 'system';
try {
    mysqli_begin_transaction($conn);
    foreach ($catalog as $module) {
        $key = $module['modulo'];
        $enabled = in_array($key, $selected, true) ? 1 : 0;
        $stmt = mysqli_prepare($conn, 'INSERT INTO usuario_modulos (user_id, modulo, nombre, descripcion, activo, actualizado_por) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion), activo = VALUES(activo), actualizado_por = VALUES(actualizado_por)');
        mysqli_stmt_bind_param($stmt, 'isssis', $user_id, $key, $module['nombre'], $module['descripcion'], $enabled, $updatedBy);
        mysqli_stmt_execute($stmt);
    }
    mysqli_commit($conn);
} catch (Throwable $error) {
    mysqli_rollback($conn);
    error_log($error->getMessage());
    json_response(['success' => false, 'error' => 'No se pudieron guardar los permisos.'], 500);
}

json_response([
    'success' => true,
    'user_id' => $user_id,
    'modulos' => get_user_module_access($user_id)
]);

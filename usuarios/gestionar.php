<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/gestion.php';
require_admin();
$data = get_request_data();
gestion_post($data);
$id = (int)($data['id'] ?? 0);
$nombre = trim($data['nombre'] ?? '');
$usuario = trim($data['usuario'] ?? '');
$rol = $data['rol'] ?? '';
$estado = $data['estado'] ?? 'activo';
$password = (string)($data['password'] ?? '');
if ($nombre === '' || mb_strlen($nombre) > 100 || !preg_match('/^[a-zA-Z0-9_.-]{3,50}$/', $usuario) || !in_array($rol, ['admin', 'usuario'], true) || !in_array($estado, ['activo', 'inactivo'], true) || ((!$id || $password !== '') && strlen($password) < 10)) {
    json_response(['success' => false, 'error' => 'Revise nombre, usuario, rol y estado. La contraseña debe tener al menos 10 caracteres.'], 422);
}
try {
    mysqli_begin_transaction($conn);
    $all = mysqli_fetch_all(mysqli_query($conn, 'SELECT id, usuario FROM usuarios FOR UPDATE'), MYSQLI_ASSOC);
    $current = null;
    foreach ($all as $row) {
        if ((int)$row['id'] === $id) $current = $row;
        if (strcasecmp($row['usuario'], $usuario) === 0 && (int)$row['id'] !== $id) throw new InvalidArgumentException('El usuario ya existe.');
    }
    if ($id && !$current) throw new InvalidArgumentException('Usuario no encontrado.');
    if ($current && $current['usuario'] === $_SESSION['usuario'] && ($rol !== 'admin' || $estado !== 'activo' || $usuario !== $current['usuario'])) throw new InvalidArgumentException('No puede desactivar, renombrar ni retirar su propio rol administrador.');
    if ($id) {
        gestion_query($conn, 'UPDATE usuarios SET nombre=?, usuario=?, rol=?, estado=? WHERE id=?', 'ssssi', [$nombre, $usuario, $rol, $estado, $id]);
        if ($password !== '') gestion_query($conn, 'UPDATE usuarios SET password=? WHERE id=?', 'si', [password_hash($password, PASSWORD_DEFAULT), $id]);
    } else {
        gestion_query($conn, 'INSERT INTO usuarios (nombre,usuario,password,rol,estado) VALUES (?,?,?,?,?)', 'sssss', [$nombre, $usuario, password_hash($password, PASSWORD_DEFAULT), $rol, $estado]);
    }
    mysqli_commit($conn);
    json_response(['success' => true]);
} catch (Throwable $e) {
    mysqli_rollback($conn);
    error_log($e->getMessage());
    json_response(['success' => false, 'error' => $e instanceof InvalidArgumentException ? $e->getMessage() : 'No se pudo guardar el usuario. Verifique la migración de gestión.'], 422);
}

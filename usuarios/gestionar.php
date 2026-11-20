<?php
// usuarios/gestionar.php - Crear o editar una cuenta (SEG-27: solo con permiso de usuarios y rol validado contra la tabla roles).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../usuarios/politica.php';
require_auth();
require_method('POST');
$data = get_request_data();

try {
    $id = (int)($data['id'] ?? 0);
    if (!puede('usuarios', $id ? 'editar' : 'crear')) json_response(['success' => false, 'error' => 'No tiene permiso para realizar esta acción.'], 403);
    $nombre = validar_texto($data['nombre'] ?? '', 'nombre', 100, true);
    $usuario = trim((string)($data['usuario'] ?? ''));
    if (!preg_match('/^[a-zA-Z0-9_.-]{3,50}$/', $usuario)) throw new InvalidArgumentException('El usuario debe tener de 3 a 50 caracteres: letras, números, punto, guion o guion bajo.');
    $rol = (string)($data['rol'] ?? '');
    $rolRow = db_one($conn, 'SELECT codigo FROM roles WHERE codigo = ? AND activo = 1', 's', [$rol]);
    if (!$rolRow) throw new InvalidArgumentException('Seleccione un rol válido.');
    $estado = validar_opcion($data['estado'] ?? 'activo', ['activo', 'inactivo'], 'estado');
    $clienteId = (int)($data['cliente_id'] ?? 0) ?: null;
    if ($rol === 'cliente') {
        if (!$clienteId || !db_one($conn, 'SELECT id FROM clientes WHERE id = ?', 'i', [$clienteId])) throw new InvalidArgumentException('Un usuario con rol Cliente debe estar vinculado a un cliente registrado.');
    } else {
        $clienteId = null;
    }
    // Solo un administrador puede otorgar el rol administrador.
    if ($rol === 'administrador' && !rbac_es_admin()) throw new InvalidArgumentException('Solo un administrador puede asignar el rol Administrador.');
    $password = (string)($data['password'] ?? '');
    if (!$id || $password !== '') {
        $err = politica_password_error($password, $usuario);
        if ($err) throw new InvalidArgumentException($err);
    }
    $forzarCambio = !empty($data['debe_cambiar_password']) ? 1 : 0;
    $desbloquear = !empty($data['desbloquear']);

    mysqli_begin_transaction($conn);
    $dup = db_one($conn, 'SELECT id FROM usuarios WHERE usuario = ? AND id <> ? FOR UPDATE', 'si', [$usuario, $id]);
    if ($dup) throw new InvalidArgumentException('El usuario ya existe.');
    if ($id) {
        $antes = db_one($conn, 'SELECT id, nombre, usuario, rol, estado, cliente_id FROM usuarios WHERE id = ? FOR UPDATE', 'i', [$id]);
        if (!$antes) throw new InvalidArgumentException('Usuario no encontrado.');
        if ($antes['rol'] === 'administrador' && !rbac_es_admin()) throw new InvalidArgumentException('Solo un administrador puede modificar a otro administrador.');
        if ((int)$antes['id'] === (int)$_SESSION['user_id'] && ($rol !== $antes['rol'] || $estado !== 'activo')) {
            throw new InvalidArgumentException('No puede desactivar ni cambiar el rol de su propia cuenta.');
        }
        if ($antes['rol'] === 'administrador' && ($rol !== 'administrador' || $estado !== 'activo')) {
            $admins = (int)db_value($conn, "SELECT COUNT(*) FROM usuarios WHERE rol = 'administrador' AND estado = 'activo' AND id <> ?", 'i', [$id]);
            if ($admins === 0) throw new InvalidArgumentException('Debe quedar al menos un administrador activo.');
        }
        db_query($conn, 'UPDATE usuarios SET nombre = ?, usuario = ?, rol = ?, estado = ?, cliente_id = ? WHERE id = ?', 'ssssii', [$nombre, $usuario, $rol, $estado, $clienteId, $id]);
        if ($password !== '') db_query($conn, 'UPDATE usuarios SET password = ?, debe_cambiar_password = ? WHERE id = ?', 'sii', [password_hash($password, PASSWORD_DEFAULT), $forzarCambio, $id]);
        if ($desbloquear) db_query($conn, 'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?', 'i', [$id]);
        $despues = ['nombre' => $nombre, 'usuario' => $usuario, 'rol' => $rol, 'estado' => $estado, 'cliente_id' => $clienteId, 'password_cambiada' => $password !== ''];
        auditar('editar', 'usuarios', $id, $antes, $despues);
    } else {
        // Las cuentas nuevas deben cambiar la contraseña inicial en su primer ingreso (SEG-28).
        db_query($conn, 'INSERT INTO usuarios (nombre, usuario, password, rol, estado, cliente_id, debe_cambiar_password) VALUES (?, ?, ?, ?, ?, ?, 1)', 'sssssi',
            [$nombre, $usuario, password_hash($password, PASSWORD_DEFAULT), $rol, $estado, $clienteId]);
        $id = mysqli_insert_id($conn);
        auditar('crear', 'usuarios', $id, null, ['nombre' => $nombre, 'usuario' => $usuario, 'rol' => $rol, 'estado' => $estado, 'cliente_id' => $clienteId]);
    }
    mysqli_commit($conn);
    json_response(['success' => true, 'id' => $id]);
} catch (InvalidArgumentException $e) {
    mysqli_rollback($conn);
    json_response(['success' => false, 'error' => $e->getMessage()], 422);
}

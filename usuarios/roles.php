<?php
// usuarios/roles.php - Roles y matriz de permisos módulo × acción (Mejora 1: usuario → rol → permisos).
// GET: lista de roles con sus permisos y el catálogo. POST: crea o actualiza un rol y su matriz.
require_once __DIR__ . '/../config/conexion.php';
require_auth();
$catalogo = rbac_modulos();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $roles = db_all($conn, 'SELECT id, codigo, nombre, descripcion, es_sistema, activo FROM roles ORDER BY es_sistema DESC, nombre');
    $permisos = db_all($conn, 'SELECT rol_id, modulo, accion FROM rol_permisos');
    foreach ($roles as &$r) {
        $r['permisos'] = [];
        foreach ($permisos as $p) {
            if ((int)$p['rol_id'] === (int)$r['id']) $r['permisos'][$p['modulo']][] = $p['accion'];
        }
        $r['usuarios'] = (int)db_value($conn, 'SELECT COUNT(*) FROM usuarios WHERE rol = ?', 's', [$r['codigo']]);
    }
    unset($r);
    json_response(['success' => true, 'roles' => $roles, 'modulos' => $catalogo, 'acciones' => RBAC_ACCIONES, 'csrf_token' => csrf_token()]);
}

require_method('POST');
$data = get_request_data();
try {
    $id = (int)($data['id'] ?? 0);
    $nombre = validar_texto($data['nombre'] ?? '', 'nombre', 80, true);
    $descripcion = validar_texto($data['descripcion'] ?? '', 'descripción', 255);
    $activo = !empty($data['activo']) || !array_key_exists('activo', $data) ? 1 : 0;
    $matriz = $data['permisos'] ?? [];
    if (!is_array($matriz)) throw new InvalidArgumentException('Permisos no válidos.');
    $filas = [];
    foreach ($matriz as $modulo => $acciones) {
        if (!isset($catalogo[$modulo]) || !is_array($acciones)) throw new InvalidArgumentException('La matriz contiene módulos no válidos.');
        foreach ($acciones as $accion) {
            if (!in_array($accion, $catalogo[$modulo]['acciones'], true)) throw new InvalidArgumentException("La acción $accion no aplica al módulo $modulo.");
            $filas[] = [$modulo, $accion];
        }
    }

    mysqli_begin_transaction($conn);
    if ($id) {
        $rol = db_one($conn, 'SELECT * FROM roles WHERE id = ? FOR UPDATE', 'i', [$id]);
        if (!$rol) throw new InvalidArgumentException('Rol no encontrado.');
        if ($rol['codigo'] === 'administrador') throw new InvalidArgumentException('El rol Administrador siempre tiene todos los permisos y no se puede modificar.');
        if ($rol['codigo'] === 'cliente' && array_diff(array_unique(array_column($filas, 0)), ['portal'])) {
            throw new InvalidArgumentException('El rol Cliente solo puede tener acceso al portal del cliente.');
        }
        if (!$activo && (int)db_value($conn, "SELECT COUNT(*) FROM usuarios WHERE rol = ? AND estado = 'activo'", 's', [$rol['codigo']]) > 0) {
            throw new InvalidArgumentException('No puede desactivar un rol con usuarios activos.');
        }
        $antes = db_all($conn, 'SELECT modulo, accion FROM rol_permisos WHERE rol_id = ?', 'i', [$id]);
        db_query($conn, 'UPDATE roles SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?', 'ssii', [$nombre, $descripcion, $activo, $id]);
        db_query($conn, 'DELETE FROM rol_permisos WHERE rol_id = ?', 'i', [$id]);
    } else {
        $codigo = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '_', iconv('UTF-8', 'ASCII//TRANSLIT', $nombre)), '_'));
        if ($codigo === '' || db_one($conn, 'SELECT id FROM roles WHERE codigo = ?', 's', [$codigo])) throw new InvalidArgumentException('Ya existe un rol con ese nombre.');
        if (isset(array_column($filas, 0, 0)['portal'])) throw new InvalidArgumentException('El acceso al portal es exclusivo del rol Cliente.');
        db_query($conn, 'INSERT INTO roles (codigo, nombre, descripcion, activo) VALUES (?, ?, ?, ?)', 'sssi', [$codigo, $nombre, $descripcion, $activo]);
        $id = mysqli_insert_id($conn);
        $antes = null;
    }
    foreach ($filas as [$modulo, $accion]) {
        db_query($conn, 'INSERT IGNORE INTO rol_permisos (rol_id, modulo, accion) VALUES (?, ?, ?)', 'iss', [$id, $modulo, $accion]);
    }
    auditar($antes === null ? 'crear' : 'editar', 'roles', $id, $antes, ['nombre' => $nombre, 'activo' => $activo, 'permisos' => $filas]);
    mysqli_commit($conn);
    json_response(['success' => true, 'id' => $id]);
} catch (InvalidArgumentException $e) {
    mysqli_rollback($conn);
    json_response(['success' => false, 'error' => $e->getMessage()], 422);
}

<?php
// config/crud.php - Operaciones comunes de los catálogos con consultas preparadas y auditoría (SEG-01, SEG-24, ARQ-03).

/** Ejecuta la acción y traduce los errores de validación y de duplicados a respuestas HTTP coherentes (ARQ-05). */
function crud_ejecutar(callable $accion): void {
    global $conn;
    try {
        $accion();
    } catch (InvalidArgumentException $e) {
        try { mysqli_rollback($conn); } catch (Throwable $ignored) {}
        json_response(['success' => false, 'error' => $e->getMessage()], 422);
    } catch (DomainException $e) {
        try { mysqli_rollback($conn); } catch (Throwable $ignored) {}
        json_response(['success' => false, 'error' => $e->getMessage()], 409);
    } catch (mysqli_sql_exception $e) {
        try { mysqli_rollback($conn); } catch (Throwable $ignored) {}
        if ((int)$e->getCode() === 1062) json_response(['success' => false, 'error' => 'Ya existe un registro con ese dato único (documento, placa, licencia o número).'], 409);
        if ((int)$e->getCode() === 1451) json_response(['success' => false, 'error' => 'El registro está relacionado con otros datos y no se puede eliminar.'], 409);
        throw $e;
    }
}

/**
 * Inserta o actualiza según la constante CRUD_EDITAR (definida por actualizar.php).
 * $valores: columna => valor ya validado.
 */
function crud_persistir(mysqli $conn, string $tabla, array $valores, string $nombre): void {
    $editar = defined('CRUD_EDITAR');
    $usuario = (string)($_SESSION['usuario'] ?? 'sistema');
    if ($editar) {
        $id = (int)(get_request_data()['id'] ?? 0);
        if ($id <= 0) throw new InvalidArgumentException('Registro no especificado.');
        $antes = db_one($conn, "SELECT * FROM `$tabla` WHERE id = ?", 'i', [$id]);
        if (!$antes) json_response(['success' => false, 'error' => "$nombre no encontrado."], 404);
        $valores['updated_by'] = $usuario;
        $set = implode(', ', array_map(fn($k) => "`$k` = ?", array_keys($valores)));
        db_query($conn, "UPDATE `$tabla` SET $set WHERE id = ?", str_repeat('s', count($valores)) . 'i', array_merge(array_values($valores), [$id]));
        auditar('editar', $tabla, $id, $antes, $valores);
        json_response(['success' => true, 'id' => $id, 'message' => "$nombre actualizado correctamente."]);
    }
    $valores['created_by'] = $usuario;
    $cols = implode(', ', array_map(fn($k) => "`$k`", array_keys($valores)));
    $marks = implode(', ', array_fill(0, count($valores), '?'));
    db_query($conn, "INSERT INTO `$tabla` ($cols) VALUES ($marks)", str_repeat('s', count($valores)), array_values($valores));
    $id = mysqli_insert_id($conn);
    auditar('crear', $tabla, $id, null, $valores);
    json_response(['success' => true, 'id' => $id, 'message' => "$nombre registrado correctamente."], 201);
}

/**
 * Elimina un registro solo si no tiene dependencias. $dependencias: [[tabla, columna, mensaje], ...]
 * Los catálogos con historial deben inactivarse en lugar de borrarse (BD-04).
 */
function crud_eliminar(mysqli $conn, string $tabla, string $nombre, array $dependencias = []): void {
    require_method('POST');
    $id = (int)(get_request_data()['id'] ?? 0);
    if ($id <= 0) throw new InvalidArgumentException('Registro no especificado.');
    $antes = db_one($conn, "SELECT * FROM `$tabla` WHERE id = ?", 'i', [$id]);
    if (!$antes) json_response(['success' => false, 'error' => "$nombre no encontrado."], 404);
    foreach ($dependencias as [$t, $col, $msg]) {
        if ((int)db_value($conn, "SELECT COUNT(*) FROM `$t` WHERE `$col` = ?", 'i', [$id]) > 0) throw new DomainException($msg);
    }
    db_query($conn, "DELETE FROM `$tabla` WHERE id = ?", 'i', [$id]);
    auditar('eliminar', $tabla, $id, $antes, null);
    json_response(['success' => true, 'message' => "$nombre eliminado correctamente."]);
}

/** Devuelve un registro por id o 404. */
function crud_obtener(mysqli $conn, string $sql, int $id, string $nombre): void {
    $row = db_one($conn, $sql, 'i', [$id]);
    if (!$row) json_response(['success' => false, 'error' => "$nombre no encontrado."], 404);
    json_response(['success' => true, 'data' => $row]);
}

/** Paginación opcional (ARQ-04): ?limit=&offset=. Devuelve [limit, offset]. */
function crud_paginacion(int $max = 5000): array {
    $limit = (int)($_GET['limit'] ?? $max);
    $offset = (int)($_GET['offset'] ?? 0);
    return [max(1, min($limit, $max)), max(0, $offset)];
}

/** Fecha opcional: '' → null; si viene, debe ser válida. */
function validar_fecha_opcional($v, string $campo): ?string {
    $v = trim((string)($v ?? ''));
    if ($v === '') return null;
    if (!validar_fecha($v)) throw new InvalidArgumentException("La fecha de $campo no es válida.");
    return $v;
}

/** Evita que persistir.php se ejecute por URL directa. */
function crud_solo_incluido(): void {
    if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'persistir.php') { http_response_code(404); exit; }
}

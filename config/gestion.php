<?php
// Utilidades compartidas del flujo operativo. No ejecuta migraciones automáticamente.
function gestion_query($conn, $sql, $types = '', $params = []) {
    $stmt = mysqli_prepare($conn, $sql);
    if ($types !== '') mysqli_stmt_bind_param($stmt, $types, ...$params);
    mysqli_stmt_execute($stmt);
    return $stmt;
}
function gestion_fecha($value) {
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', (string)$value);
    return $date && $date->format('Y-m-d') === $value;
}
function gestion_monto($value) {
    if (!is_numeric($value) || !is_finite((float)$value) || $value < 0 || $value > 99999999.99) {
        throw new InvalidArgumentException('Ingrese un importe válido, mayor o igual a cero.');
    }
    return round((float)$value, 2);
}
function gestion_csrf() {
    if (empty($_SESSION['gestion_csrf'])) $_SESSION['gestion_csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['gestion_csrf'];
}
function gestion_post($data) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['success' => false, 'error' => 'Método no permitido.'], 405);
    if (!hash_equals(gestion_csrf(), (string)($data['csrf_token'] ?? ''))) {
        json_response(['success' => false, 'error' => 'Sesión del formulario vencida. Actualice la página.'], 403);
    }
}
function require_admin() {
    require_auth();
    if (!in_array(strtolower($_SESSION['rol'] ?? ''), ['admin', 'administrador'], true)) {
        json_response(['success' => false, 'error' => 'Esta función requiere el rol de administrador.'], 403);
    }
}

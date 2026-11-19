<?php
// config/db.php - Capa de acceso a datos y utilidades compartidas (ARQ-03).
// Todas las consultas con datos del usuario deben pasar por db_query() con parámetros enlazados (SEG-01, SEG-02).

/** Ejecuta una sentencia preparada y devuelve el statement. Lanza mysqli_sql_exception si falla. */
function db_query(mysqli $conn, string $sql, string $types = '', array $params = []): mysqli_stmt {
    $stmt = mysqli_prepare($conn, $sql);
    if ($types !== '') {
        mysqli_stmt_bind_param($stmt, $types, ...$params);
    }
    mysqli_stmt_execute($stmt);
    return $stmt;
}

function db_all(mysqli $conn, string $sql, string $types = '', array $params = []): array {
    $res = mysqli_stmt_get_result(db_query($conn, $sql, $types, $params));
    return $res ? mysqli_fetch_all($res, MYSQLI_ASSOC) : [];
}

function db_one(mysqli $conn, string $sql, string $types = '', array $params = []): ?array {
    $res = mysqli_stmt_get_result(db_query($conn, $sql, $types, $params));
    $row = $res ? mysqli_fetch_assoc($res) : null;
    return $row ?: null;
}

function db_value(mysqli $conn, string $sql, string $types = '', array $params = []) {
    $res = mysqli_stmt_get_result(db_query($conn, $sql, $types, $params));
    $row = $res ? mysqli_fetch_row($res) : null;
    return $row ? $row[0] : null;
}

/** Ejecuta (sin resultado) y devuelve filas afectadas. */
function db_exec(mysqli $conn, string $sql, string $types = '', array $params = []): int {
    $stmt = db_query($conn, $sql, $types, $params);
    return mysqli_stmt_affected_rows($stmt);
}

/** Respuesta JSON estandarizada. */
function json_response($data, int $status = 200): void {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
        header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
        header('Cache-Control: no-store');
        http_response_code($status);
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

/** Datos de la petición (JSON, POST o GET). */
function get_request_data(): array {
    static $data = null;
    if ($data !== null) return $data;
    $raw = file_get_contents('php://input');
    $json = json_decode((string)$raw, true);
    if (is_array($json)) return $data = $json;
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') return $data = $_GET;
    return $data = $_POST;
}

/** Exige un método HTTP; responde 405 en caso contrario (SEG-06). */
function require_method(string ...$metodos): void {
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', $metodos, true)) {
        header('Allow: ' . implode(', ', $metodos));
        json_response(['success' => false, 'error' => 'Método no permitido.'], 405);
    }
}

/* ---------- CSRF (SEG-07) ---------- */

function csrf_token(): string {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

/** Valida el token enviado en la cabecera X-CSRF-Token o en el campo csrf_token. */
function csrf_verificar(): void {
    $enviado = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? (get_request_data()['csrf_token'] ?? '');
    if (!is_string($enviado) || empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $enviado)) {
        json_response(['success' => false, 'error' => 'La sesión del formulario venció. Actualice la página.', 'csrf_invalid' => true], 403);
    }
}

/* ---------- Auditoría (SEG-24) ---------- */

/**
 * Registra una acción en la tabla auditoria.
 * $accion: crear | editar | anular | eliminar | login | login_fallido | cambiar_estado | ...
 */
function auditar(string $accion, string $tabla, $registroId = null, $antes = null, $despues = null): void {
    global $conn;
    try {
        $usuarioId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
        $usuario = (string)($_SESSION['usuario'] ?? 'sistema');
        $ip = substr((string)($_SERVER['REMOTE_ADDR'] ?? 'cli'), 0, 45);
        $limpiar = function ($v) {
            if ($v === null) return null;
            if (is_array($v)) unset($v['password']);
            return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        };
        $id = $registroId === null ? null : (string)$registroId;
        db_query($conn, 'INSERT INTO auditoria (usuario_id, usuario, accion, tabla, registro_id, valores_antes, valores_despues, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            'isssssss', [$usuarioId, $usuario, $accion, $tabla, $id, $limpiar($antes), $limpiar($despues), $ip]);
    } catch (Throwable $e) {
        error_log('Auditoría: ' . $e->getMessage());
    }
}

/* ---------- Validaciones del servidor (SEG-26) ---------- */

function validar_fecha($value): bool {
    if (!is_string($value)) return false;
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date && $date->format('Y-m-d') === $value;
}

function validar_hora($value): ?string {
    $value = trim((string)$value);
    if (strlen($value) === 5) $value .= ':00';
    return preg_match('/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/', $value) ? $value : null;
}

/** Importe >= 0 con dos decimales. */
function validar_monto($value, bool $positivo = false): float {
    if (!is_numeric($value) || !is_finite((float)$value) || (float)$value < 0 || (float)$value > 99999999.99 || ($positivo && (float)$value <= 0)) {
        throw new InvalidArgumentException($positivo ? 'Ingrese un importe mayor que cero.' : 'Ingrese un importe válido, mayor o igual a cero.');
    }
    return round((float)$value, 2);
}

/** Texto obligatorio u opcional con longitud máxima. */
function validar_texto($value, string $campo, int $max, bool $obligatorio = false): string {
    $value = trim((string)($value ?? ''));
    if ($obligatorio && $value === '') throw new InvalidArgumentException("El campo $campo es obligatorio.");
    if (mb_strlen($value) > $max) throw new InvalidArgumentException("El campo $campo no puede superar $max caracteres.");
    return $value;
}

function validar_opcion($value, array $permitidos, string $campo): string {
    $value = (string)$value;
    if (!in_array($value, $permitidos, true)) throw new InvalidArgumentException("Valor no válido para $campo.");
    return $value;
}

/** RUC peruano: 11 dígitos, prefijo 10/15/16/17/20 y dígito verificador (NEG-19). */
function validar_ruc(string $ruc): bool {
    if (!preg_match('/^(10|15|16|17|20)\d{9}$/', $ruc)) return false;
    $factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    $suma = 0;
    for ($i = 0; $i < 10; $i++) $suma += (int)$ruc[$i] * $factores[$i];
    $dv = 11 - ($suma % 11);
    if ($dv === 10) $dv = 0;
    if ($dv === 11) $dv = 1;
    return $dv === (int)$ruc[10];
}

function validar_dni(string $dni): bool {
    return (bool)preg_match('/^\d{8}$/', $dni);
}

/* ---------- Cálculos tributarios (NEG-01, NEG-16, NEG-17) ---------- */

/** Devuelve [base_imponible, igv] a partir del precio con IGV. */
function calcular_igv(float $precio, string $tipoComprobante = 'FACTURA'): array {
    $tasa = (float)vadexsa_config('igv_tasa', 0.18);
    $gravado = $tipoComprobante !== 'SIN_COMPROBANTE' || vadexsa_config('igv_sin_comprobante', true);
    $base = $gravado ? round($precio / (1 + $tasa), 2) : round($precio, 2);
    return [$base, round($precio - $base, 2)];
}

function vadexsa_config(string $clave, $defecto = null) {
    global $VADEXSA_CONFIG;
    return $VADEXSA_CONFIG[$clave] ?? $defecto;
}

/** Escapa una celda para CSV (SEG-30). */
function csv_celda($v): string {
    $t = (string)($v ?? '');
    if (preg_match('/^[\s]*[=+\-@]/', $t)) $t = "'" . $t;
    return '"' . str_replace('"', '""', $t) . '"';
}

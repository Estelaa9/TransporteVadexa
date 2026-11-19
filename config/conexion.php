<?php
// config/conexion.php - Arranque común de todos los endpoints: configuración, seguridad, conexión,
// migraciones automáticas, sesión y control de acceso por rol.

$VADEXSA_CONFIG = array_merge([
    'db_host' => getenv('VADEXSA_DB_HOST') ?: 'localhost',
    'db_user' => getenv('VADEXSA_DB_USER') ?: 'root',
    'db_pass' => getenv('VADEXSA_DB_PASS') ?: '',
    'db_name' => getenv('VADEXSA_DB_NAME') ?: 'transporte_db',
    'debug' => (bool)getenv('VADEXSA_DEBUG'),
    'session_timeout_min' => 30,
    'allowed_origins' => [],
    'igv_sin_comprobante' => true,
    'igv_tasa' => 0.18,
], is_file(__DIR__ . '/env.php') ? (array)require __DIR__ . '/env.php' : []);
// La variable de entorno permite a las pruebas usar otra base sin tocar env.php.
if (getenv('VADEXSA_DB_NAME')) $VADEXSA_CONFIG['db_name'] = getenv('VADEXSA_DB_NAME');

date_default_timezone_set('America/Lima');

// Errores: nunca mostrar detalles al cliente en producción; registrarlos en logs/ (SEG-21, ARQ-06).
ini_set('display_errors', $VADEXSA_CONFIG['debug'] ? '1' : '0');
ini_set('log_errors', '1');
$logDir = __DIR__ . '/../logs';
if (is_dir($logDir) || @mkdir($logDir, 0750, true)) {
    ini_set('error_log', $logDir . '/php-error-' . date('Y-m') . '.log');
}
error_reporting(E_ALL);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/permisos.php';
require_once __DIR__ . '/migraciones.php';

$esHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

// Excepciones no controladas: respuesta genérica y detalle solo en el log.
set_exception_handler(function (Throwable $e) use ($VADEXSA_CONFIG) {
    error_log('[' . ($_SERVER['SCRIPT_NAME'] ?? 'cli') . '] ' . get_class($e) . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (PHP_SAPI === 'cli') { fwrite(STDERR, $e->getMessage() . PHP_EOL); exit(1); }
    global $conn;
    if (isset($conn) && $conn instanceof mysqli) { try { mysqli_rollback($conn); } catch (Throwable $ignored) {} }
    $msg = $VADEXSA_CONFIG['debug'] ? $e->getMessage() : 'Ocurrió un error interno. Intente nuevamente o contacte al administrador.';
    json_response(['success' => false, 'error' => $msg], 500);
});

if (PHP_SAPI !== 'cli' && !headers_sent()) {
    // Cabeceras de seguridad (SEG-22).
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: same-origin');
    if ($esHttps) header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

    // CORS: solo el propio origen o los orígenes configurados; nunca '*' con credenciales (SEG-17).
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && in_array($origin, (array)$VADEXSA_CONFIG['allowed_origins'], true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
        header('Vary: Origin');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// Sesión con cookie HttpOnly, SameSite=Lax y Secure bajo HTTPS (SEG-14).
if (PHP_SAPI !== 'cli' && session_status() === PHP_SESSION_NONE) {
    ini_set('session.use_strict_mode', '1');
    session_name('VADEXSASESSID');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $esHttps, 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
try {
    $conn = mysqli_connect($VADEXSA_CONFIG['db_host'], $VADEXSA_CONFIG['db_user'], $VADEXSA_CONFIG['db_pass'], $VADEXSA_CONFIG['db_name']);
    mysqli_set_charset($conn, 'utf8mb4');
} catch (Throwable $e) {
    error_log('Conexión MySQL: ' . $e->getMessage());
    if (PHP_SAPI === 'cli') { fwrite(STDERR, 'No se pudo conectar a MySQL: ' . $e->getMessage() . PHP_EOL); exit(1); }
    json_response(['success' => false, 'error' => 'No se pudo conectar a la base de datos. Verifique que MySQL esté iniciado.'], 503);
}

vadexsa_migrar_si_hace_falta($conn);

/**
 * Exige sesión válida, aplica el cierre por inactividad, recarga rol y permisos desde la base
 * y valida el token CSRF en peticiones que modifican datos.
 * Con $verificarEndpoint = true (por defecto) aplica además la matriz de permisos del endpoint.
 */
function require_auth(bool $verificarEndpoint = true): void {
    global $conn;
    static $hecho = false;
    if (!$hecho) {
        if (empty($_SESSION['user_id'])) {
            json_response(['success' => false, 'error' => 'No autorizado. Inicie sesión.', 'auth_required' => true], 401);
        }
        $timeout = max(5, (int)vadexsa_config('session_timeout_min', 30)) * 60;
        if (isset($_SESSION['ultima_actividad']) && time() - (int)$_SESSION['ultima_actividad'] > $timeout) {
            session_unset();
            session_destroy();
            json_response(['success' => false, 'error' => 'La sesión se cerró por inactividad. Inicie sesión nuevamente.', 'auth_required' => true], 401);
        }
        $_SESSION['ultima_actividad'] = time();

        // Revalidar en cada petición: una baja o un cambio de rol se aplica de inmediato.
        if (!sesion_cargar_usuario($conn, (int)$_SESSION['user_id'])) {
            session_unset();
            json_response(['success' => false, 'error' => 'Sesión no válida.', 'auth_required' => true], 401);
        }

        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
            csrf_verificar();
        }
        $hecho = true;
    }
    if ($verificarEndpoint) {
        // Mientras deba cambiar la contraseña inicial solo puede usar ese endpoint (SEG-28).
        $script = basename(dirname($_SERVER['SCRIPT_FILENAME'] ?? '')) . '/' . basename($_SERVER['SCRIPT_FILENAME'] ?? '');
        if (!empty($_SESSION['debe_cambiar_password']) && $script !== 'usuarios/mi_password.php') {
            json_response(['success' => false, 'error' => 'Debe cambiar su contraseña antes de continuar.', 'password_change_required' => true], 403);
        }
        rbac_verificar_endpoint();
    }
}

/** Carga en la sesión los datos, el rol y los permisos vigentes del usuario. Devuelve false si no está activo. */
function sesion_cargar_usuario(mysqli $conn, int $userId): bool {
    $user = db_one($conn, 'SELECT id, usuario, nombre, rol, estado, cliente_id, debe_cambiar_password FROM usuarios WHERE id = ? LIMIT 1', 'i', [$userId]);
    if (!$user || $user['estado'] !== 'activo') return false;
    // Un usuario con rol cliente sin cliente asociado no puede ver nada del portal (SEG-09).
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['usuario'] = $user['usuario'];
    $_SESSION['nombre'] = $user['nombre'] ?: $user['usuario'];
    $_SESSION['rol'] = $user['rol'];
    $_SESSION['cliente_id'] = $user['cliente_id'] !== null ? (int)$user['cliente_id'] : null;
    $_SESSION['debe_cambiar_password'] = (int)$user['debe_cambiar_password'] === 1;
    $_SESSION['permisos'] = rbac_cargar_permisos($conn, (string)$user['rol']);
    return true;
}

/** Compatibilidad con el código anterior. */
function require_admin(): void {
    require_auth(false);
    if (!rbac_es_admin()) {
        json_response(['success' => false, 'error' => 'Esta función requiere el rol de administrador.'], 403);
    }
}

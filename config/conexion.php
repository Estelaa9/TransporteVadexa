<?php
// config/conexion.php - Conexión central a la base de datos y utilidades para el sistema

// Permitir peticiones y configurar headers
if (!headers_sent()) {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Iniciar sesión PHP si aún no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$host = "localhost";
$user = "root";
$pass = "";
$db   = getenv('VADEXSA_DB_NAME') ?: "transporte_db";
date_default_timezone_set('America/Lima');

$conn = mysqli_connect($host, $user, $pass, $db);

if (!$conn) {
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
        http_response_code(500);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode(["success" => false, "error" => "Error de conexión a la base de datos"], JSON_UNESCAPED_UNICODE);
        exit;
    }
    die("Error de conexión a la base de datos: " . mysqli_connect_error());
}

mysqli_set_charset($conn, "utf8mb4");

function ensure_required_schema() {
    global $conn;
    if (!$conn || !($conn instanceof mysqli)) {
        return;
    }

    $tables = [
        'servicio_operacion' => "CREATE TABLE IF NOT EXISTS servicio_operacion (
            servicio_id INT NOT NULL PRIMARY KEY,
            proveedor_id INT NULL,
            provincia VARCHAR(100) NOT NULL DEFAULT '',
            distrito VARCHAR(100) NOT NULL DEFAULT '',
            referencia VARCHAR(255) NOT NULL DEFAULT '',
            contacto VARCHAR(150) NOT NULL DEFAULT '',
            telefono VARCHAR(40) NOT NULL DEFAULT '',
            almacen VARCHAR(150) NOT NULL DEFAULT '',
            temporada VARCHAR(100) NOT NULL DEFAULT '',
            frecuencia VARCHAR(100) NOT NULL DEFAULT '',
            observaciones TEXT NULL,
            actualizado_por VARCHAR(100) NOT NULL,
            actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX (proveedor_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        'gastos_adicionales' => "CREATE TABLE IF NOT EXISTS gastos_adicionales (
            id INT AUTO_INCREMENT PRIMARY KEY,
            servicio_id INT NULL,
            fecha DATE NOT NULL,
            concepto VARCHAR(255) NOT NULL,
            monto DECIMAL(12,2) NOT NULL,
            registrado_por VARCHAR(100) NOT NULL,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (fecha), INDEX (servicio_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        'gastos_operativos' => "CREATE TABLE IF NOT EXISTS gastos_operativos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fecha DATE NOT NULL,
            vehiculo_id INT NULL,
            tipo VARCHAR(80) NOT NULL DEFAULT 'general',
            descripcion VARCHAR(255) NOT NULL DEFAULT '',
            monto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            registrado_por VARCHAR(100) NOT NULL DEFAULT '',
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (fecha), INDEX (vehiculo_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        'gastos_administrativos' => "CREATE TABLE IF NOT EXISTS gastos_administrativos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fecha DATE NOT NULL,
            tipo VARCHAR(80) NOT NULL DEFAULT 'general',
            descripcion VARCHAR(255) NOT NULL DEFAULT '',
            monto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            registrado_por VARCHAR(100) NOT NULL DEFAULT '',
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (fecha)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        'usuario_modulos' => "CREATE TABLE IF NOT EXISTS usuario_modulos (
            user_id INT NOT NULL,
            modulo VARCHAR(80) NOT NULL,
            nombre VARCHAR(120) NOT NULL,
            descripcion VARCHAR(255) NOT NULL DEFAULT '',
            activo TINYINT(1) NOT NULL DEFAULT 1,
            actualizado_por VARCHAR(100) NOT NULL DEFAULT 'system',
            actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, modulo),
            INDEX (user_id), INDEX (modulo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        'servicio_abonos' => "CREATE TABLE IF NOT EXISTS servicio_abonos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            servicio_id INT NOT NULL,
            fecha DATE NOT NULL,
            monto DECIMAL(12,2) NOT NULL,
            referencia VARCHAR(255) NOT NULL,
            registrado_por VARCHAR(100) NOT NULL,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (servicio_id), INDEX (fecha)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    ];

    foreach ($tables as $ddl) {
        mysqli_query($conn, $ddl);
    }

    $columns = [
        'proveedor_id' => "ALTER TABLE servicios ADD COLUMN proveedor_id INT NULL",
        'fecha_emision' => "ALTER TABLE servicios ADD COLUMN fecha_emision DATE NULL",
        'monto_detraccion' => "ALTER TABLE servicios ADD COLUMN monto_detraccion DECIMAL(12,2) NOT NULL DEFAULT 0.00",
        'estado_comprobante' => "ALTER TABLE servicios ADD COLUMN estado_comprobante VARCHAR(20) NOT NULL DEFAULT 'pendiente'"
    ];

    foreach ($columns as $column => $ddl) {
        $check = mysqli_query($conn, "SHOW COLUMNS FROM servicios LIKE '" . str_replace("'", "''", $column) . "'");
        if (!$check || mysqli_num_rows($check) === 0) {
            mysqli_query($conn, $ddl);
        }
    }
}

function get_default_user_modules() {
    return [
        ['modulo' => 'dashboard', 'nombre' => 'Dashboard', 'descripcion' => 'Resumen operativo, KPIs y métricas del mes.'],
        ['modulo' => 'servicios', 'nombre' => 'Servicios', 'descripcion' => 'Registro y seguimiento de viajes y liquidaciones.'],
        ['modulo' => 'operacion', 'nombre' => 'Control operativo', 'descripcion' => 'Seguimiento de operación, proveedores y fichas de servicio.'],
        ['modulo' => 'programacion', 'nombre' => 'Programación', 'descripcion' => 'Calendario y coordinación operacional del día.'],
        ['modulo' => 'clientes', 'nombre' => 'Clientes', 'descripcion' => 'Administración de clientes y contacto comercial.'],
        ['modulo' => 'vehiculos', 'nombre' => 'Vehículos', 'descripcion' => 'Gestión de flota y disponibilidad del parque automotor.'],
        ['modulo' => 'conductores', 'nombre' => 'Conductores', 'descripcion' => 'Control de conductores, licencias y estado.'],
        ['modulo' => 'proveedores', 'nombre' => 'Proveedores', 'descripcion' => 'Proveedores de terceros y coordinación de servicios.'],
        ['modulo' => 'gastos_operativos', 'nombre' => 'Gastos operativos', 'descripcion' => 'Ingresos y desembolsos del servicio y la operación.'],
        ['modulo' => 'gastos_administrativos', 'nombre' => 'Gastos administrativos', 'descripcion' => 'Costos generales de la gestión y administración.'],
        ['modulo' => 'reportes', 'nombre' => 'Reportes', 'descripcion' => 'Informes, cierres y análisis financiero operativo.'],
        ['modulo' => 'cierre', 'nombre' => 'Cierre y gastos adicionales', 'descripcion' => 'Cierres de período y gastos adicionales de operación.'],
        ['modulo' => 'cuentas', 'nombre' => 'Cuentas por cobrar', 'descripcion' => 'Abonos, cobros y saldos de servicios.'],
        ['modulo' => 'facturas', 'nombre' => 'Facturas', 'descripcion' => 'Registro y manejo de comprobantes y pagos.'],
        ['modulo' => 'usuarios', 'nombre' => 'Usuarios', 'descripcion' => 'Administración de accesos y gestión del personal.']
    ];
}

function get_user_module_access($user_id) {
    global $conn;
    $user_id = (int)$user_id;
    $catalog = get_default_user_modules();
    $access = [];

    $res = mysqli_query($conn, 'SELECT modulo, nombre, descripcion, activo FROM usuario_modulos WHERE user_id = ' . $user_id);
    while ($row = mysqli_fetch_assoc($res)) {
        $access[$row['modulo']] = [
            'modulo' => $row['modulo'],
            'nombre' => $row['nombre'],
            'descripcion' => $row['descripcion'],
            'activo' => (int)$row['activo'] === 1
        ];
    }

    foreach ($catalog as $module) {
        $key = $module['modulo'];
        if (!isset($access[$key])) {
            $defName = $module['nombre'];
            $defDesc = $module['descripcion'];
            $enabled = 1;
            $updatedBy = $_SESSION['usuario'] ?? 'system';
            $stmt = mysqli_prepare($conn, 'INSERT INTO usuario_modulos (user_id, modulo, nombre, descripcion, activo, actualizado_por) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion), activo = VALUES(activo), actualizado_por = VALUES(actualizado_por)');
            mysqli_stmt_bind_param($stmt, 'isssis', $user_id, $key, $defName, $defDesc, $enabled, $updatedBy);
            mysqli_stmt_execute($stmt);
            $access[$key] = [
                'modulo' => $key,
                'nombre' => $defName,
                'descripcion' => $defDesc,
                'activo' => true
            ];
        }
    }

    return array_values($access);
}

function require_module_access($module_name) {
    require_auth();
    $globalRoles = ['admin', 'administrador'];
    $role = strtolower((string)($_SESSION['rol'] ?? ''));
    if (in_array($role, $globalRoles, true)) {
        return;
    }

    $access = $_SESSION['module_access'] ?? [];
    $enabled = false;
    foreach ($access as $entry) {
        if (($entry['modulo'] ?? '') === $module_name && !empty($entry['activo'])) {
            $enabled = true;
            break;
        }
    }

    if (!$enabled) {
        json_response(['success' => false, 'error' => 'No tiene permiso para acceder a este módulo.'], 403);
    }
}

ensure_required_schema();

/**
 * Enviar respuesta JSON estandarizada
 */
function json_response($data, $status = 200) {
    if (!headers_sent()) {
        header("Content-Type: application/json; charset=UTF-8");
        http_response_code($status);
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Obtener datos de la petición (JSON o POST/GET)
 */
function get_request_data() {
    $raw = file_get_contents("php://input");
    $json = json_decode($raw, true);
    if (is_array($json)) {
        return $json;
    }
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        return $_GET;
    }
    return $_POST;
}

/**
 * Validar si existe sesión activa
 */
function require_auth() {
    if (!isset($_SESSION['usuario'])) {
        json_response([
            "success" => false,
            "error" => "No autorizado. Inicie sesión.",
            "auth_required" => true
        ], 401);
    }
    // Revalidar permisos para que una baja o un cambio de rol sea inmediato.
    global $conn;
    $stmt = mysqli_prepare($conn, 'SELECT id, rol, estado FROM usuarios WHERE usuario = ? LIMIT 1');
    mysqli_stmt_bind_param($stmt, 's', $_SESSION['usuario']);
    mysqli_stmt_execute($stmt);
    $user = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    if (!$user || $user['estado'] !== 'activo') {
        session_unset();
        json_response(['success' => false, 'error' => 'Sesión no válida.', 'auth_required' => true], 401);
    }
    $_SESSION['rol'] = $user['rol'];
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['module_access'] = get_user_module_access((int)$user['id']);
    $scriptPath = $_SERVER['SCRIPT_FILENAME'] ?? '';
    $module = basename(dirname($scriptPath));
    $scriptName = basename($scriptPath);
    if (in_array(strtolower($user['rol']), ['admin', 'administrador'], true)) {
        return;
    }

    $permissionModule = [
        'dashboard' => 'dashboard',
        'servicios' => 'servicios',
        'clientes' => 'clientes',
        'vehiculos' => 'vehiculos',
        'conductores' => 'conductores',
        'proveedores' => 'proveedores',
        'gastos_operativos' => 'gastos_operativos',
        'gastos_administrativos' => 'gastos_administrativos',
        'gastos_adicionales' => 'cierre',
        'facturas' => 'facturas',
        'reportes' => 'reportes',
        'usuarios' => 'usuarios',
        'chatbot' => 'dashboard'
    ][$module] ?? null;
    if ($module === 'servicios' && $scriptName === 'programacion.php') {
        $permissionModule = 'programacion';
    } elseif ($module === 'servicios' && $scriptName === 'operacion.php') {
        $permissionModule = 'operacion';
    } elseif ($module === 'conductores' && $scriptName === 'disponibles.php') {
        $permissionModule = 'programacion';
    } elseif ($module === 'facturas' && $scriptName === 'cuentas.php') {
        $permissionModule = 'cuentas';
    } elseif ($module === 'reportes' && $scriptName === 'cierre.php') {
        $permissionModule = 'cierre';
    }
    if ($permissionModule !== null) {
        $enabled = false;
        foreach ($_SESSION['module_access'] as $entry) {
            if (($entry['modulo'] ?? '') === $permissionModule && !empty($entry['activo'])) {
                $enabled = true;
                break;
            }
        }
        if (!$enabled) {
            json_response(['success' => false, 'error' => 'No tiene permiso para acceder a este módulo.'], 403);
        }
    }
}
?>

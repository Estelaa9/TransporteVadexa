<?php
// login/validar.php - Inicio de sesión y consulta de la sesión activa.
// SEG-01 (consultas preparadas), SEG-03 (password_hash con migración de MD5), SEG-14 (regeneración de sesión),
// SEG-15 (bloqueo tras 5 intentos), SEG-16 (mensaje único).
require_once __DIR__ . '/../config/conexion.php';

const LOGIN_MAX_INTENTOS = 5;
const LOGIN_BLOQUEO_MIN = 15;

function datos_sesion(): array {
    return [
        'id' => (int)$_SESSION['user_id'],
        'usuario' => $_SESSION['usuario'],
        'nombre' => $_SESSION['nombre'] ?? $_SESSION['usuario'],
        'rol' => $_SESSION['rol'],
        'cliente_id' => $_SESSION['cliente_id'] ?? null,
        'es_admin' => rbac_es_admin(),
        'permisos' => rbac_permisos_sesion(),
        'debe_cambiar_password' => !empty($_SESSION['debe_cambiar_password']),
    ];
}

$action = $_GET['action'] ?? '';
if ($action === 'check' || $action === 'me') {
    if (empty($_SESSION['user_id'])) {
        json_response(['success' => false, 'logged_in' => false, 'error' => 'No hay sesión activa.', 'csrf_token' => csrf_token()]);
    }
    require_auth(false);
    json_response(['success' => true, 'logged_in' => true, 'user' => datos_sesion(), 'csrf_token' => csrf_token()]);
}

require_method('POST');
$data = get_request_data();
$usuario = trim((string)($data['usuario'] ?? ''));
$password = (string)($data['password'] ?? '');
$ip = substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
$error = fn() => json_response(['success' => false, 'error' => 'Usuario o contraseña incorrectos.'], 401);

if ($usuario === '' || $password === '' || mb_strlen($usuario) > 50 || strlen($password) > 200) {
    json_response(['success' => false, 'error' => 'Debe ingresar usuario y contraseña.'], 400);
}

// Límite por IP: 20 intentos fallidos en 15 minutos.
$fallosIp = (int)db_value($conn, 'SELECT COUNT(*) FROM login_intentos WHERE ip = ? AND exito = 0 AND fecha > (NOW() - INTERVAL ? MINUTE)', 'si', [$ip, LOGIN_BLOQUEO_MIN]);
if ($fallosIp >= 20) {
    json_response(['success' => false, 'error' => 'Demasiados intentos desde este equipo. Espere ' . LOGIN_BLOQUEO_MIN . ' minutos.'], 429);
}

$row = db_one($conn, 'SELECT * FROM usuarios WHERE usuario = ? LIMIT 1', 's', [$usuario]);
$registrar = function (bool $exito) use ($conn, $usuario, $ip) {
    db_query($conn, 'INSERT INTO login_intentos (usuario, ip, exito) VALUES (?, ?, ?)', 'ssi', [mb_substr($usuario, 0, 100), $ip, $exito ? 1 : 0]);
};

if (!$row) {
    password_verify($password, '$2y$10$usesomesillystringfore7hnbRJHxXVLeakoG8K30oukPsA.ztMG'); // tiempo constante
    $registrar(false);
    $error();
}
if (!empty($row['bloqueado_hasta']) && strtotime($row['bloqueado_hasta']) > time()) {
    $registrar(false);
    json_response(['success' => false, 'error' => 'Cuenta bloqueada temporalmente por intentos fallidos. Intente más tarde.'], 429);
}

$stored = (string)$row['password'];
$esMd5 = (bool)preg_match('/^[a-f0-9]{32}$/i', $stored);
$valido = $esMd5 ? hash_equals(strtolower($stored), md5($password)) : password_verify($password, $stored);

if (!$valido) {
    $registrar(false);
    $intentos = (int)$row['intentos_fallidos'] + 1;
    $bloqueo = $intentos >= LOGIN_MAX_INTENTOS ? date('Y-m-d H:i:s', time() + LOGIN_BLOQUEO_MIN * 60) : null;
    db_query($conn, 'UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?', 'isi', [$bloqueo ? 0 : $intentos, $bloqueo, (int)$row['id']]);
    if ($bloqueo) {
        $_SESSION['usuario'] = $row['usuario'];
        auditar('bloqueo_cuenta', 'usuarios', $row['id'], null, ['bloqueado_hasta' => $bloqueo]);
        unset($_SESSION['usuario']);
    }
    $error();
}
if (($row['estado'] ?? 'activo') !== 'activo') {
    $registrar(false);
    $error();
}

// Migrar el hash MD5 o un hash con parámetros antiguos (SEG-03).
if ($esMd5 || password_needs_rehash($stored, PASSWORD_DEFAULT)) {
    db_query($conn, 'UPDATE usuarios SET password = ? WHERE id = ?', 'si', [password_hash($password, PASSWORD_DEFAULT), (int)$row['id']]);
}
db_query($conn, 'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = NOW() WHERE id = ?', 'i', [(int)$row['id']]);
$registrar(true);

session_regenerate_id(true);
$_SESSION = ['ultima_actividad' => time()];
sesion_cargar_usuario($conn, (int)$row['id']);
auditar('login', 'usuarios', $row['id']);

json_response([
    'success' => true,
    'message' => 'Bienvenido ' . ($_SESSION['nombre'] ?? $row['usuario']),
    'user' => datos_sesion(),
    'csrf_token' => csrf_token(),
    'redirect' => $_SESSION['rol'] === 'cliente' ? 'portal.html' : null,
]);

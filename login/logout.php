<?php
// login/logout.php - Cerrar sesión (solo POST para evitar cierres forzados por enlaces).
require_once __DIR__ . '/../config/conexion.php';
require_method('POST');
if (!empty($_SESSION['user_id'])) auditar('logout', 'usuarios', $_SESSION['user_id']);
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', ['expires' => time() - 42000, 'path' => $p['path'], 'domain' => $p['domain'], 'secure' => $p['secure'], 'httponly' => true, 'samesite' => 'Lax']);
}
session_destroy();
json_response(['success' => true, 'message' => 'Sesión cerrada correctamente.']);

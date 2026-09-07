<?php
// login/logout.php - Cerrar sesión
require_once __DIR__ . "/../config/conexion.php";

$_SESSION = [];
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}
session_destroy();

if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || $_SERVER['REQUEST_METHOD'] === 'POST') {
    json_response(["success" => true, "message" => "Sesión cerrada correctamente."]);
}

header("Location: ../login.php");
exit;
?>
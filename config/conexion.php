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
$db   = "transporte_db";

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
}
?>
<?php
// login/validar.php - Autenticación de usuarios y verificación de sesión
require_once __DIR__ . "/../config/conexion.php";

$action = $_GET['action'] ?? '';
$data = get_request_data();

// Si la acción es check o me: verificar sesión activa
if ($action === 'check' || $action === 'me') {
    if (isset($_SESSION['usuario'])) {
        require_auth();
        json_response([
            "success" => true,
            "logged_in" => true,
            "user" => [
                "usuario" => $_SESSION['usuario'],
                "nombre" => $_SESSION['nombre'] ?? $_SESSION['usuario'],
                "rol" => $_SESSION['rol'] ?? 'usuario'
            ]
        ]);
    } else {
        json_response([
            "success" => false,
            "logged_in" => false,
            "error" => "No hay sesión activa."
        ], 401);
    }
}

// Proceso de Login
$usuario = mysqli_real_escape_string($conn, trim($data['usuario'] ?? ''));
$raw_pass = (string)($data['password'] ?? '');
$password = md5($raw_pass);

if (empty($usuario) || empty($raw_pass)) {
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response(["success" => false, "error" => "Debe ingresar usuario y contraseña."], 400);
    }
    echo "<script>alert('Debe ingresar usuario y contraseña'); window.location='../login.php';</script>";
    exit;
}

$sql = "SELECT * FROM usuarios WHERE usuario='$usuario' LIMIT 1";
$result = mysqli_query($conn, $sql);

if ($result && mysqli_num_rows($result) > 0) {
    $row = mysqli_fetch_assoc($result);
    $stored = $row['password'];
    $valid = password_verify($raw_pass, $stored) || (preg_match('/^[a-f0-9]{32}$/i', $stored) && hash_equals(strtolower($stored), md5($raw_pass)));
    if (!$valid) json_response(['success' => false, 'error' => 'Usuario o contraseña incorrectos.'], 401);

    if (isset($row['estado']) && $row['estado'] !== 'activo') {
        if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
            json_response(["success" => false, "error" => "El usuario se encuentra inactivo."], 403);
        }
        echo "<script>alert('El usuario se encuentra inactivo'); window.location='../login.php';</script>";
        exit;
    }

    session_regenerate_id(true);
    $_SESSION['usuario'] = $row['usuario'];
    $_SESSION['nombre'] = $row['nombre'] ?? $row['usuario'];
    $_SESSION['rol'] = $row['rol'] ?? 'usuario';

    // Si la petición viene en formato JSON o desde fetch
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Bienvenido " . ($_SESSION['nombre'] ?? $row['usuario']),
            "user" => [
                "id" => $row['id'] ?? null,
                "usuario" => $row['usuario'],
                "nombre" => $row['nombre'] ?? $row['usuario'],
                "rol" => $row['rol'] ?? 'usuario'
            ]
        ]);
    }

    header("Location: ../dashboard/index.php");
    exit;

} else {
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response(["success" => false, "error" => "Usuario o contraseña incorrectos."], 401);
    }
    echo "<script>alert('Usuario o contraseña incorrectos'); window.location='../login.php';</script>";
    exit;
}
?>

<?php
// conductores/guardar.php - Registrar conductor
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();

$nombre = mysqli_real_escape_string($conn, trim($data['nombre'] ?? ''));
$licencia = strtoupper(mysqli_real_escape_string($conn, trim($data['licencia'] ?? '')));
$telefono = mysqli_real_escape_string($conn, trim($data['telefono'] ?? ''));
$direccion = mysqli_real_escape_string($conn, trim($data['direccion'] ?? ''));
$estado = mysqli_real_escape_string($conn, trim($data['estado'] ?? 'activo'));

if (empty($nombre) || empty($licencia)) {
    json_response(["success" => false, "error" => "El nombre y la licencia/brevete son obligatorios."], 400);
}

$sql = "INSERT INTO conductores (nombre, licencia, telefono, direccion, estado)
        VALUES ('$nombre', '$licencia', '$telefono', '$direccion', '$estado')";

if (mysqli_query($conn, $sql)) {
    $nuevo_id = mysqli_insert_id($conn);
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Conductor {$nombre} registrado correctamente.",
            "id" => $nuevo_id
        ], 201);
    }
    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al guardar conductor: " . mysqli_error($conn)], 500);
}
?>
<?php
// vehiculos/guardar.php - Registrar vehículo
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();

$placa = strtoupper(mysqli_real_escape_string($conn, trim($data['placa'] ?? '')));
$modelo = mysqli_real_escape_string($conn, trim($data['modelo'] ?? ''));
$tipo = mysqli_real_escape_string($conn, trim($data['tipo'] ?? ''));
$capacidad = mysqli_real_escape_string($conn, trim($data['capacidad'] ?? ''));
$estado = mysqli_real_escape_string($conn, trim($data['estado'] ?? 'activo'));

if (strlen($placa) < 6) {
    json_response(["success" => false, "error" => "La placa ingresada no es válida (mínimo 6 caracteres)."], 400);
}

// Verificar duplicado de placa
$check = mysqli_query($conn, "SELECT id FROM vehiculos WHERE placa = '$placa'");
if (mysqli_num_rows($check) > 0) {
    json_response(["success" => false, "error" => "Ya existe un vehículo registrado con la placa {$placa}."], 409);
}

$sql = "INSERT INTO vehiculos (placa, modelo, tipo, capacidad, estado)
        VALUES ('$placa', '$modelo', '$tipo', '$capacidad', '$estado')";

if (mysqli_query($conn, $sql)) {
    $nuevo_id = mysqli_insert_id($conn);
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Vehículo {$placa} registrado correctamente.",
            "id" => $nuevo_id
        ], 201);
    }
    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al guardar vehículo: " . mysqli_error($conn)], 500);
}
?>
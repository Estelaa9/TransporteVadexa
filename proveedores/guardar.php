<?php
// proveedores/guardar.php - Registrar proveedor
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();

$nombre = mysqli_real_escape_string($conn, trim($data['nombre'] ?? ''));
$telefono = mysqli_real_escape_string($conn, trim($data['telefono'] ?? ''));
$vehiculo = mysqli_real_escape_string($conn, trim($data['vehiculo'] ?? ''));
$placa = strtoupper(mysqli_real_escape_string($conn, trim($data['placa'] ?? '')));

if (empty($nombre)) {
    json_response(["success" => false, "error" => "El nombre del proveedor es obligatorio."], 400);
}

$sql = "INSERT INTO proveedores (nombre, telefono, vehiculo, placa)
        VALUES ('$nombre', '$telefono', '$vehiculo', '$placa')";

if (mysqli_query($conn, $sql)) {
    $nuevo_id = mysqli_insert_id($conn);
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Proveedor registrado correctamente.",
            "id" => $nuevo_id
        ], 201);
    }
    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al guardar proveedor: " . mysqli_error($conn)], 500);
}
?>
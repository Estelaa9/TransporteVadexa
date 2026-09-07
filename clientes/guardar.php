<?php
// clientes/guardar.php - Registrar nuevo cliente
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();

$nombre = mysqli_real_escape_string($conn, trim($data['nombre'] ?? ''));
$documento = mysqli_real_escape_string($conn, trim($data['documento'] ?? ''));
$telefono = mysqli_real_escape_string($conn, trim($data['telefono'] ?? ''));
$email = mysqli_real_escape_string($conn, trim($data['email'] ?? ''));
$direccion = mysqli_real_escape_string($conn, trim($data['direccion'] ?? ''));
$tipo_cliente = mysqli_real_escape_string($conn, trim($data['tipo_cliente'] ?? 'Empresa'));

if (empty($nombre)) {
    json_response(["success" => false, "error" => "El nombre o razón social es obligatorio."], 400);
}

$sql = "INSERT INTO clientes (nombre, documento, telefono, email, direccion, tipo_cliente)
        VALUES ('$nombre', '$documento', '$telefono', '$email', '$direccion', '$tipo_cliente')";

if (mysqli_query($conn, $sql)) {
    $nuevo_id = mysqli_insert_id($conn);
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Cliente registrado correctamente.",
            "id" => $nuevo_id
        ], 201);
    }
    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al guardar cliente: " . mysqli_error($conn)], 500);
}
?>
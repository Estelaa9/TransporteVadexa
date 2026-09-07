<?php
// proveedores/actualizar.php - Actualizar proveedor
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();
$id = (int)($data['id'] ?? 0);

if (!$id) {
    json_response(["success" => false, "error" => "ID no especificado."], 400);
}

$nombre = mysqli_real_escape_string($conn, trim($data['nombre'] ?? ''));
$telefono = mysqli_real_escape_string($conn, trim($data['telefono'] ?? ''));
$vehiculo = mysqli_real_escape_string($conn, trim($data['vehiculo'] ?? ''));
$placa = strtoupper(mysqli_real_escape_string($conn, trim($data['placa'] ?? '')));

if (empty($nombre)) {
    json_response(["success" => false, "error" => "El nombre es obligatorio."], 400);
}

$sql = "UPDATE proveedores SET
            nombre = '$nombre',
            telefono = '$telefono',
            vehiculo = '$vehiculo',
            placa = '$placa'
        WHERE id = $id";

if (mysqli_query($conn, $sql)) {
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Proveedor #{$id} actualizado correctamente.",
            "id" => $id
        ]);
    }
    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al actualizar: " . mysqli_error($conn)], 500);
}
?>
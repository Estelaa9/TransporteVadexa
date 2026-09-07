<?php
// conductores/actualizar.php - Actualizar conductor
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();
$id = (int)($data['id'] ?? 0);

if (!$id) {
    json_response(["success" => false, "error" => "ID no especificado."], 400);
}

$nombre = mysqli_real_escape_string($conn, trim($data['nombre'] ?? ''));
$licencia = strtoupper(mysqli_real_escape_string($conn, trim($data['licencia'] ?? '')));
$telefono = mysqli_real_escape_string($conn, trim($data['telefono'] ?? ''));
$direccion = mysqli_real_escape_string($conn, trim($data['direccion'] ?? ''));
$estado = mysqli_real_escape_string($conn, trim($data['estado'] ?? 'activo'));

if (empty($nombre) || empty($licencia)) {
    json_response(["success" => false, "error" => "El nombre y la licencia son obligatorios."], 400);
}

$sql = "UPDATE conductores SET
            nombre = '$nombre',
            licencia = '$licencia',
            telefono = '$telefono',
            direccion = '$direccion',
            estado = '$estado'
        WHERE id = $id";

if (mysqli_query($conn, $sql)) {
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Conductor {$nombre} actualizado correctamente.",
            "id" => $id
        ]);
    }
    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al actualizar: " . mysqli_error($conn)], 500);
}
?>
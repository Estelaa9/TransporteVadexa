<?php
// vehiculos/actualizar.php - Actualizar vehículo
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();
$id = (int)($data['id'] ?? 0);

if (!$id) {
    json_response(["success" => false, "error" => "ID no especificado."], 400);
}

$placa = strtoupper(mysqli_real_escape_string($conn, trim($data['placa'] ?? '')));
$modelo = mysqli_real_escape_string($conn, trim($data['modelo'] ?? ''));
$tipo = mysqli_real_escape_string($conn, trim($data['tipo'] ?? ''));
$capacidad = mysqli_real_escape_string($conn, trim($data['capacidad'] ?? ''));
$estado = mysqli_real_escape_string($conn, trim($data['estado'] ?? 'activo'));

if (strlen($placa) < 6) {
    json_response(["success" => false, "error" => "La placa ingresada no es válida."], 400);
}

// Verificar si otra unidad usa esa placa
$check = mysqli_query($conn, "SELECT id FROM vehiculos WHERE placa = '$placa' AND id != $id");
if (mysqli_num_rows($check) > 0) {
    json_response(["success" => false, "error" => "Otra unidad ya tiene asignada la placa {$placa}."], 409);
}

$sql = "UPDATE vehiculos SET
            placa = '$placa',
            modelo = '$modelo',
            tipo = '$tipo',
            capacidad = '$capacidad',
            estado = '$estado'
        WHERE id = $id";

if (mysqli_query($conn, $sql)) {
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Vehículo {$placa} actualizado correctamente.",
            "id" => $id
        ]);
    }
    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al actualizar: " . mysqli_error($conn)], 500);
}
?>
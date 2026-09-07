<?php
// gastos_operativos/guardar.php - Registrar gasto operativo
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();

$fecha = mysqli_real_escape_string($conn, trim($data['fecha'] ?? date('Y-m-d')));
$vehiculo_id = (int)($data['vehiculo_id'] ?? 0);
$tipo = mysqli_real_escape_string($conn, trim($data['tipo'] ?? 'Combustible'));
$descripcion = mysqli_real_escape_string($conn, trim($data['descripcion'] ?? ''));
$monto = floatval($data['monto'] ?? 0);

if (!$vehiculo_id || $monto <= 0) {
    json_response(["success" => false, "error" => "El vehículo y un monto válido son obligatorios."], 400);
}

$sql = "INSERT INTO gastos_operativos (fecha, vehiculo_id, tipo, descripcion, monto)
        VALUES ('$fecha', '$vehiculo_id', '$tipo', '$descripcion', '$monto')";

if (mysqli_query($conn, $sql)) {
    $nuevo_id = mysqli_insert_id($conn);
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Gasto operativo registrado correctamente.",
            "id" => $nuevo_id
        ], 201);
    }
    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al registrar gasto: " . mysqli_error($conn)], 500);
}
?>
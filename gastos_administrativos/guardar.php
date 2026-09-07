<?php
// gastos_administrativos/guardar.php - Registrar gasto administrativo
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();

$fecha = mysqli_real_escape_string($conn, trim($data['fecha'] ?? date('Y-m-d')));
$tipo = mysqli_real_escape_string($conn, trim($data['tipo'] ?? 'Sueldos'));
$descripcion = mysqli_real_escape_string($conn, trim($data['descripcion'] ?? ''));
$monto = floatval($data['monto'] ?? 0);

if ($monto <= 0 || empty($descripcion)) {
    json_response(["success" => false, "error" => "La descripción y un monto válido son requeridos."], 400);
}

$sql = "INSERT INTO gastos_administrativos (fecha, tipo, descripcion, monto)
        VALUES ('$fecha', '$tipo', '$descripcion', '$monto')";

if (mysqli_query($conn, $sql)) {
    $nuevo_id = mysqli_insert_id($conn);
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Gasto administrativo registrado correctamente.",
            "id" => $nuevo_id
        ], 201);
    }
    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al guardar gasto: " . mysqli_error($conn)], 500);
}
?>
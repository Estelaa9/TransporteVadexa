<?php
// gastos_administrativos/actualizar.php - Actualizar gasto administrativo
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();
$id = (int)($data['id'] ?? 0);

if (!$id) {
    json_response(["success" => false, "error" => "ID no especificado."], 400);
}

$fecha = mysqli_real_escape_string($conn, trim($data['fecha'] ?? date('Y-m-d')));
$tipo = mysqli_real_escape_string($conn, trim($data['tipo'] ?? 'Sueldos'));
$descripcion = mysqli_real_escape_string($conn, trim($data['descripcion'] ?? ''));
$monto = floatval($data['monto'] ?? 0);

if ($monto <= 0 || empty($descripcion)) {
    json_response(["success" => false, "error" => "Descripción y monto válido son requeridos."], 400);
}

$sql = "UPDATE gastos_administrativos SET
            fecha = '$fecha',
            tipo = '$tipo',
            descripcion = '$descripcion',
            monto = '$monto'
        WHERE id = $id";

if (mysqli_query($conn, $sql)) {
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Gasto administrativo #{$id} actualizado correctamente.",
            "id" => $id
        ]);
    }
    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al actualizar: " . mysqli_error($conn)], 500);
}
?>
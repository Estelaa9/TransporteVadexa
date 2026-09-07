<?php
// servicios/cambiar_estado.php - Cambiar estado de servicio (programado / en_ruta / finalizado / cancelado)
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();
$id = (int)($data['id'] ?? $_GET['id'] ?? 0);
$estado = mysqli_real_escape_string($conn, trim($data['estado_servicio'] ?? $data['estado'] ?? $_GET['estado'] ?? ''));

if (!$id || empty($estado)) {
    json_response(["success" => false, "error" => "ID y nuevo estado son obligatorios."], 400);
}

$sql = "UPDATE servicios SET estado_servicio='$estado' WHERE id='$id'";

if (mysqli_query($conn, $sql)) {
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || $_SERVER['REQUEST_METHOD'] === 'POST') {
        json_response([
            "success" => true,
            "message" => "Estado del servicio #{$id} actualizado a {$estado}.",
            "id" => $id,
            "estado" => $estado
        ]);
    }
    header("Location: programacion.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al actualizar estado: " . mysqli_error($conn)], 500);
}
?>
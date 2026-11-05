<?php
// servicios/cambiar_estado.php - Cambiar estado de servicio (programado / en_ruta / finalizado / cancelado)
require_once __DIR__ . "/../config/conexion.php";
require_auth();
require_once __DIR__ . '/../config/gestion.php';

$data = get_request_data();
$id = (int)($data['id'] ?? $_GET['id'] ?? 0);
$estado = mysqli_real_escape_string($conn, trim($data['estado_servicio'] ?? $data['estado'] ?? $_GET['estado'] ?? ''));
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['success' => false, 'error' => 'Método no permitido.'], 405);
if (!in_array($estado, ['programado', 'en_ruta', 'finalizado', 'cancelado'], true)) json_response(['success' => false, 'error' => 'Estado no válido.'], 422);

if (!$id || empty($estado)) {
    json_response(["success" => false, "error" => "ID y nuevo estado son obligatorios."], 400);
}

mysqli_begin_transaction($conn);
$current = mysqli_fetch_assoc(mysqli_query($conn, "SELECT estado_servicio, numero_factura FROM servicios WHERE id=$id FOR UPDATE"));
if (!$current) json_response(['success' => false, 'error' => 'Servicio no encontrado.'], 404);
$allowed = ['programado' => ['en_ruta','cancelado'], 'en_ruta' => ['finalizado','cancelado'], 'finalizado' => [], 'cancelado' => []];
if (!in_array($estado, $allowed[$current['estado_servicio']] ?? [], true) || ($estado === 'cancelado' && !empty($current['numero_factura']))) json_response(['success' => false, 'error' => 'La transición de estado no está permitida.'], 409);
$anterior = mysqli_real_escape_string($conn, $current['estado_servicio']);
if ($estado === 'cancelado' && (int)mysqli_fetch_row(mysqli_query($conn, "SELECT COUNT(*) FROM servicio_abonos WHERE servicio_id=$id"))[0] > 0) json_response(['success'=>false,'error'=>'No se puede cancelar un servicio con abonos.'],409);
$sql = "UPDATE servicios SET estado_servicio='$estado' WHERE id='$id' AND estado_servicio='$anterior'";

if (mysqli_query($conn, $sql)) {
    mysqli_commit($conn);
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
    mysqli_rollback($conn);
    json_response(["success" => false, "error" => "Error al actualizar estado: " . mysqli_error($conn)], 500);
}
?>

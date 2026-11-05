<?php
// Cancelación administrativa: conservar historial y bloquear modificaciones concurrentes.
require_once __DIR__ . "/../config/conexion.php";
require_auth();
require_once __DIR__ . '/../config/gestion.php';
require_admin();
if (!in_array($_SERVER['REQUEST_METHOD'], ['POST','DELETE'], true)) json_response(['success'=>false,'error'=>'Método no permitido.'],405);

$data = get_request_data();
$id = (int)($_GET['id'] ?? $data['id'] ?? 0);

if (!$id) {
    json_response(["success" => false, "error" => "ID no especificado."], 400);
}

mysqli_begin_transaction($conn);
$existing = mysqli_fetch_assoc(mysqli_query($conn, "SELECT numero_factura FROM servicios WHERE id=$id FOR UPDATE"));
if (!$existing) { mysqli_rollback($conn); json_response(['success' => false, 'error' => 'Servicio no encontrado.'], 404); }
if (trim($existing['numero_factura'] ?? '') !== '') { mysqli_rollback($conn); json_response(['success' => false, 'error' => 'No puede cancelar un servicio con comprobante registrado.'], 409); }
$abonos = mysqli_fetch_row(mysqli_query($conn, "SELECT COUNT(*) FROM servicio_abonos WHERE servicio_id=$id"))[0];
if ($abonos) { mysqli_rollback($conn); json_response(['success' => false, 'error' => 'El servicio tiene abonos registrados y debe conservarse.'], 409); }
// Conservar trazabilidad de gastos y fichas en lugar de borrar el viaje.
$sql = "UPDATE servicios SET estado_servicio='cancelado' WHERE id=$id";

if (mysqli_query($conn, $sql)) {
    mysqli_commit($conn);
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || $_SERVER['REQUEST_METHOD'] === 'DELETE' || $_SERVER['REQUEST_METHOD'] === 'POST') {
        json_response([
            "success" => true,
            "message" => "Servicio #{$id} cancelado; se conserva su historial."
        ]);
    }
    header("Location: index.php");
    exit;
} else {
    mysqli_rollback($conn);
    json_response(["success" => false, "error" => "Error al eliminar servicio: " . mysqli_error($conn)], 500);
}
?>

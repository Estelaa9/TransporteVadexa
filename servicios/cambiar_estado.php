<?php
// servicios/cambiar_estado.php - Avance de estado del servicio con la máquina de estados del backend (NEG-14).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/reglas.php';
require_auth();
require_method('POST');
$data = get_request_data();
$id = (int)($data['id'] ?? 0);
$estado = (string)($data['estado_servicio'] ?? $data['estado'] ?? '');
if ($id <= 0 || !in_array($estado, ['programado', 'en_ruta', 'finalizado', 'cancelado'], true)) {
    json_response(['success' => false, 'error' => 'Indique el servicio y un estado válido.'], 422);
}
if ($estado === 'cancelado') {
    // La cancelación exige permiso de anulación y motivo.
    if (!puede('servicios', 'anular')) json_response(['success' => false, 'error' => 'No tiene permiso para anular servicios.'], 403);
    require __DIR__ . '/eliminar.php';
    exit;
}

mysqli_begin_transaction($conn);
$actual = db_one($conn, 'SELECT id, estado_servicio FROM servicios WHERE id = ? FOR UPDATE', 'i', [$id]);
if (!$actual) { mysqli_rollback($conn); json_response(['success' => false, 'error' => 'Servicio no encontrado.'], 404); }
if (!servicio_transicion_valida($actual['estado_servicio'], $estado)) {
    mysqli_rollback($conn);
    json_response(['success' => false, 'error' => "No se puede pasar de «{$actual['estado_servicio']}» a «{$estado}»."], 409);
}
db_query($conn, 'UPDATE servicios SET estado_servicio = ?, updated_by = ?, version = version + 1 WHERE id = ?', 'ssi', [$estado, $_SESSION['usuario'], $id]);
auditar('cambiar_estado', 'servicios', $id, ['estado_servicio' => $actual['estado_servicio']], ['estado_servicio' => $estado]);
mysqli_commit($conn);
json_response(['success' => true, 'message' => "Servicio #{$id} actualizado a {$estado}.", 'id' => $id, 'estado' => $estado]);

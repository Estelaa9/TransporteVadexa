<?php
// servicios/eliminar.php - Anulación (cancelación) de un servicio. Nunca borra: conserva la historia (BD-04).
// Un servicio con comprobante vigente se anula primero con nota de crédito en Facturación (NEG-13).
require_once __DIR__ . '/../config/conexion.php';
require_auth();
require_method('POST');
$data = get_request_data();
$id = (int)($data['id'] ?? 0);
$motivo = trim((string)($data['motivo'] ?? ''));
if ($id <= 0) json_response(['success' => false, 'error' => 'Servicio no especificado.'], 422);
if (mb_strlen($motivo) < 5 || mb_strlen($motivo) > 255) json_response(['success' => false, 'error' => 'Indique el motivo de la anulación (5 a 255 caracteres).'], 422);

mysqli_begin_transaction($conn);
$s = db_one($conn, 'SELECT * FROM servicios WHERE id = ? FOR UPDATE', 'i', [$id]);
if (!$s) { mysqli_rollback($conn); json_response(['success' => false, 'error' => 'Servicio no encontrado.'], 404); }
if ($s['estado_servicio'] === 'cancelado') { mysqli_rollback($conn); json_response(['success' => false, 'error' => 'El servicio ya está anulado.'], 409); }
if (!empty($s['comprobante_id'])) {
    mysqli_rollback($conn);
    json_response(['success' => false, 'error' => 'El servicio tiene un comprobante vigente. Anúlelo primero con nota de crédito en Facturación.'], 409);
}
if ($s['estado_servicio'] === 'finalizado') {
    mysqli_rollback($conn);
    json_response(['success' => false, 'error' => 'Un servicio finalizado no se puede cancelar.'], 409);
}
db_query($conn, "UPDATE servicios SET estado_servicio = 'cancelado', motivo_cancelacion = ?, updated_by = ?, version = version + 1 WHERE id = ?", 'ssi', [$motivo, $_SESSION['usuario'], $id]);
auditar('anular', 'servicios', $id, ['estado_servicio' => $s['estado_servicio']], ['estado_servicio' => 'cancelado', 'motivo' => $motivo]);
mysqli_commit($conn);
json_response(['success' => true, 'message' => "Servicio #{$id} anulado; se conserva su historial."]);

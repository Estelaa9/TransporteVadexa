<?php
// facturas/anular_pago.php - Anula un pago registrado por error, con motivo. No se borra (trazabilidad).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
require_method('POST');
$data = get_request_data();

crud_ejecutar(function () use ($conn, $data) {
    $id = (int)($data['id'] ?? 0);
    $motivo = validar_texto($data['motivo'] ?? '', 'motivo', 255, true);
    mysqli_begin_transaction($conn);
    $p = db_one($conn, 'SELECT * FROM pagos WHERE id = ? FOR UPDATE', 'i', [$id]);
    if (!$p) throw new InvalidArgumentException('Pago no encontrado.');
    if ($p['estado'] === 'anulado') throw new DomainException('El pago ya está anulado.');
    db_query($conn, "UPDATE pagos SET estado = 'anulado', motivo_anulacion = ? WHERE id = ?", 'si', [$motivo, $id]);
    auditar('anular', 'pagos', $id, $p, ['estado' => 'anulado', 'motivo' => $motivo]);
    mysqli_commit($conn);
    json_response(['success' => true, 'message' => 'Pago anulado.']);
});

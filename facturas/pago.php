<?php
// facturas/pago.php - Registra un pago parcial o total de un comprobante (NEG-20, mejora 2).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_once __DIR__ . '/lib.php';
require_auth();
require_method('POST');
$data = get_request_data();

crud_ejecutar(function () use ($conn, $data) {
    $id = (int)($data['comprobante_id'] ?? 0);
    $fecha = (string)($data['fecha'] ?? '');
    if (!validar_fecha($fecha) || $fecha > date('Y-m-d')) throw new InvalidArgumentException('Ingrese una fecha de pago válida que no sea futura.');
    $monto = validar_monto($data['monto'] ?? '', true);
    $medio = validar_opcion($data['medio'] ?? 'transferencia', PAGO_MEDIOS, 'medio de pago');
    $referencia = validar_texto($data['referencia'] ?? '', 'referencia u operación', 255, $medio !== 'efectivo');

    mysqli_begin_transaction($conn);
    $c = db_one($conn, 'SELECT * FROM comprobantes WHERE id = ? FOR UPDATE', 'i', [$id]);
    if (!$c || $c['tipo'] === 'NOTA_CREDITO') throw new InvalidArgumentException('Comprobante no encontrado.');
    if ($c['estado'] !== 'emitida') throw new DomainException('El comprobante está anulado.');
    if ($fecha < $c['fecha_emision']) throw new InvalidArgumentException('El pago no puede ser anterior a la emisión del comprobante.');
    $pagado = (float)db_value($conn, "SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE comprobante_id = ? AND estado = 'registrado'", 'i', [$id]);
    $saldo = round((float)$c['total'] - $pagado, 2);
    if ($saldo <= 0) throw new DomainException('El comprobante ya está pagado.');
    if ($monto > $saldo + 0.004) throw new InvalidArgumentException('El pago (S/ ' . number_format($monto, 2) . ') supera el saldo pendiente (S/ ' . number_format($saldo, 2) . ').');
    db_query($conn, 'INSERT INTO pagos (comprobante_id, fecha, monto, medio, referencia, registrado_por) VALUES (?, ?, ?, ?, ?, ?)', 'isdsss',
        [$id, $fecha, $monto, $medio, $referencia, $_SESSION['usuario']]);
    $pagoId = mysqli_insert_id($conn);
    auditar('crear', 'pagos', $pagoId, null, ['comprobante_id' => $id, 'fecha' => $fecha, 'monto' => $monto, 'medio' => $medio, 'referencia' => $referencia]);
    mysqli_commit($conn);
    $nuevoSaldo = round($saldo - $monto, 2);
    json_response(['success' => true, 'id' => $pagoId, 'saldo' => $nuevoSaldo,
        'message' => $nuevoSaldo <= 0 ? 'Pago registrado. El comprobante quedó pagado.' : 'Pago parcial registrado. Saldo: S/ ' . number_format($nuevoSaldo, 2)], 201);
});

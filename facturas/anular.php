<?php
// facturas/anular.php - Anulación de un comprobante mediante nota de crédito con motivo (NEG-13, NEG-15).
// El número original se conserva; los servicios quedan libres para volver a facturarse o anularse.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_once __DIR__ . '/lib.php';
require_auth();
require_method('POST');
$data = get_request_data();

crud_ejecutar(function () use ($conn, $data) {
    $id = (int)($data['id'] ?? 0);
    $motivo = validar_texto($data['motivo'] ?? '', 'motivo', 255, true);
    if (mb_strlen($motivo) < 5) throw new InvalidArgumentException('Describa el motivo de la anulación.');
    mysqli_begin_transaction($conn);
    $c = db_one($conn, 'SELECT * FROM comprobantes WHERE id = ? FOR UPDATE', 'i', [$id]);
    if (!$c) throw new InvalidArgumentException('Comprobante no encontrado.');
    if ($c['tipo'] === 'NOTA_CREDITO') throw new DomainException('Una nota de crédito no se anula desde aquí.');
    if ($c['estado'] === 'anulada') throw new DomainException('El comprobante ya está anulado.');
    $pagos = (int)db_value($conn, "SELECT COUNT(*) FROM pagos WHERE comprobante_id = ? AND estado = 'registrado'", 'i', [$id]);
    if ($pagos > 0) throw new DomainException('El comprobante tiene pagos registrados. Anule primero los pagos (o registre la devolución) en Cuentas por cobrar.');

    $serieNc = db_value($conn, "SELECT serie FROM series_comprobante WHERE tipo = 'NOTA_CREDITO' AND aplica_a = ? AND activo = 1 ORDER BY serie LIMIT 1", 's', [$c['tipo']]);
    if (!$serieNc) throw new DomainException('No hay una serie de nota de crédito activa para ' . $c['tipo'] . '.');
    $numero = serie_siguiente($conn, $serieNc);
    $hoy = date('Y-m-d');
    $usuario = $_SESSION['usuario'];
    db_query($conn, "INSERT INTO comprobantes (tipo, serie, numero, cliente_id, fecha_emision, dias_credito, fecha_vencimiento, base_imponible, igv, total, comprobante_ref_id, observacion, created_by)
        VALUES ('NOTA_CREDITO', ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)", 'siissdddiss',
        [$serieNc, $numero, $c['cliente_id'], $hoy, $hoy, (float)$c['base_imponible'], (float)$c['igv'], (float)$c['total'], $id, $motivo, $usuario]);
    $ncId = mysqli_insert_id($conn);
    db_query($conn, 'INSERT INTO comprobante_servicios (comprobante_id, servicio_id, base_imponible, igv, total) SELECT ?, servicio_id, base_imponible, igv, total FROM comprobante_servicios WHERE comprobante_id = ?', 'ii', [$ncId, $id]);
    db_query($conn, "UPDATE comprobantes SET estado = 'anulada', motivo_anulacion = ?, fecha_anulacion = ?, updated_by = ? WHERE id = ?", 'sssi', [$motivo, $hoy, $usuario, $id]);
    db_query($conn, "UPDATE servicios SET comprobante_id = NULL, numero_factura = '', fecha_emision = NULL, updated_by = ?, version = version + 1 WHERE comprobante_id = ?", 'si', [$usuario, $id]);
    $nc = $serieNc . '-' . str_pad((string)$numero, 6, '0', STR_PAD_LEFT);
    auditar('anular', 'comprobantes', $id, ['estado' => 'emitida'], ['estado' => 'anulada', 'motivo' => $motivo, 'nota_credito' => $nc]);
    mysqli_commit($conn);
    json_response(['success' => true, 'nota_credito_id' => $ncId, 'nota_credito' => $nc, 'message' => "Comprobante anulado con la nota de crédito $nc."]);
});

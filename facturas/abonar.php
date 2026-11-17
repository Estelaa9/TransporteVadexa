<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/gestion.php';
require_admin();
$data=get_request_data(); gestion_post($data);
try {
    $id=(int)($data['servicio_id']??0); $fecha=$data['fecha']??'';
    $monto=gestion_monto($data['monto']??''); $referencia=trim($data['referencia']??'');
    if (!gestion_fecha($fecha) || $fecha>date('Y-m-d') || $monto<=0 || $referencia==='' || mb_strlen($referencia)>255) throw new InvalidArgumentException('Ingrese fecha no futura, importe positivo y referencia.');
    mysqli_begin_transaction($conn);
    $stmt=gestion_query($conn,'SELECT * FROM servicios WHERE id=? FOR UPDATE','i',[$id]);
    $s=mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    if (!$s || $s['estado_servicio']==='cancelado') throw new InvalidArgumentException('Servicio no disponible.');
    $stmt=gestion_query($conn,'SELECT estado_pago FROM factura_pagos WHERE servicio_id=? AND numero_factura=?','is',[$id,$s['numero_factura']??'']);
    $p=mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    if (($p['estado_pago']??'')==='pagada') throw new InvalidArgumentException('El comprobante ya está pagado.');
    $stmt=gestion_query($conn,'SELECT COALESCE(SUM(monto),0) FROM servicio_abonos WHERE servicio_id=?','i',[$id]);
    $abonado=(float)mysqli_fetch_row(mysqli_stmt_get_result($stmt))[0];
    if (round(($abonado+$monto)*100)>round((float)$s['precio_cliente']*100)) throw new InvalidArgumentException('El abono supera el saldo del servicio.');
    gestion_query($conn,'INSERT INTO servicio_abonos (servicio_id,fecha,monto,referencia,registrado_por) VALUES (?,?,?,?,?)','isdss',[$id,$fecha,$monto,$referencia,$_SESSION['usuario']]);
    mysqli_commit($conn); json_response(['success'=>true],201);
} catch (Throwable $e) {
    mysqli_rollback($conn); error_log($e->getMessage());
    json_response(['success'=>false,'error'=>$e instanceof InvalidArgumentException?$e->getMessage():'No se pudo registrar el abono.'], $e instanceof InvalidArgumentException?422:500);
}

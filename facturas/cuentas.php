<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/gestion.php';
require_admin();
try {
    $result = mysqli_query($conn, "SELECT s.id, s.fecha_servicio, s.numero_factura, s.precio_cliente, s.estado_servicio, c.nombre AS cliente,
        COALESCE(a.abonado,0) AS abonado, COALESCE(p.estado_pago,'sin_registrar') AS estado_pago,
        CASE WHEN p.estado_pago='pagada' THEN 0 ELSE GREATEST(s.precio_cliente-COALESCE(a.abonado,0),0) END AS saldo
        FROM servicios s LEFT JOIN clientes c ON c.id=s.cliente_id
        LEFT JOIN (SELECT servicio_id,SUM(monto) abonado FROM servicio_abonos GROUP BY servicio_id) a ON a.servicio_id=s.id
        LEFT JOIN factura_pagos p ON p.servicio_id=s.id AND p.numero_factura=s.numero_factura
        WHERE s.estado_servicio<>'cancelado' ORDER BY s.fecha_servicio DESC,s.id DESC");
    $history = mysqli_query($conn, 'SELECT a.*, c.nombre AS cliente FROM servicio_abonos a JOIN servicios s ON s.id=a.servicio_id LEFT JOIN clientes c ON c.id=s.cliente_id ORDER BY a.fecha DESC,a.id DESC');
    json_response(['success'=>true,'data'=>mysqli_fetch_all($result,MYSQLI_ASSOC),'abonos'=>mysqli_fetch_all($history,MYSQLI_ASSOC),'csrf_token'=>gestion_csrf()]);
} catch (Throwable $e) {
    error_log($e->getMessage());
    json_response(['success'=>false,'error'=>'No se pudieron consultar las cuentas. Verifique la migración de gestión.'],500);
}

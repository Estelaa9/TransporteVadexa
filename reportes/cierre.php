<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/gestion.php';
require_admin();
$desde = $_GET['desde'] ?? date('Y-m-d');
$hasta = $_GET['hasta'] ?? $desde;
if (!gestion_fecha($desde) || !gestion_fecha($hasta) || $desde > $hasta) json_response(['success' => false, 'error' => 'Rango de fechas no válido.'], 422);
try {
    $sum = function ($sql) use ($conn, $desde, $hasta) {
        $stmt = gestion_query($conn, $sql, 'ss', [$desde, $hasta]);
        return (float)mysqli_fetch_row(mysqli_stmt_get_result($stmt))[0];
    };
    $servicios = $sum("SELECT COALESCE(SUM(precio_cliente),0) FROM servicios WHERE estado_servicio='finalizado' AND fecha_servicio BETWEEN ? AND ?");
    $proveedores = $sum("SELECT COALESCE(SUM(costo_proveedor),0) FROM servicios WHERE estado_servicio='finalizado' AND fecha_servicio BETWEEN ? AND ?");
    $operativos = $sum('SELECT COALESCE(SUM(monto),0) FROM gastos_operativos WHERE fecha BETWEEN ? AND ?');
    $administrativos = $sum('SELECT COALESCE(SUM(monto),0) FROM gastos_administrativos WHERE fecha BETWEEN ? AND ?');
    $adicionales = $sum('SELECT COALESCE(SUM(monto),0) FROM gastos_adicionales WHERE fecha BETWEEN ? AND ?');
    $abonos = $sum('SELECT COALESCE(SUM(monto),0) FROM servicio_abonos WHERE fecha BETWEEN ? AND ?');
    $cobrado = $abonos + $sum("SELECT COALESCE(SUM(GREATEST(s.precio_cliente-COALESCE(a.abonado,0),0)),0) FROM factura_pagos p JOIN servicios s ON s.id=p.servicio_id AND s.numero_factura=p.numero_factura LEFT JOIN (SELECT servicio_id,SUM(monto) abonado FROM servicio_abonos GROUP BY servicio_id) a ON a.servicio_id=s.id WHERE p.estado_pago='pagada' AND p.fecha_pago BETWEEN ? AND ? AND s.estado_servicio<>'cancelado'");
    $stmt = gestion_query($conn, 'SELECT * FROM gastos_adicionales WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC, id DESC', 'ss', [$desde, $hasta]);
    json_response(['success' => true, 'csrf_token' => gestion_csrf(), 'data' => mysqli_fetch_all(mysqli_stmt_get_result($stmt), MYSQLI_ASSOC), 'resumen' => compact('servicios', 'proveedores', 'operativos', 'administrativos', 'adicionales', 'cobrado') + ['resultado' => round($servicios-$proveedores-$operativos-$administrativos-$adicionales, 2)]]);
} catch (Throwable $e) {
    error_log($e->getMessage());
    json_response(['success' => false, 'error' => 'No se pudo generar el cierre. Verifique las migraciones de facturas y gestión.'], 500);
}

<?php
require_once __DIR__ . '/../config/conexion.php';
require_auth();
require_once __DIR__ . '/../config/gestion.php';
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['success' => false, 'error' => 'Método no permitido.'], 405);
}
if (empty($_SESSION['facturas_csrf'])) {
    $_SESSION['facturas_csrf'] = bin2hex(random_bytes(32));
}
try {
    $result = mysqli_query($conn, "SELECT s.id, s.fecha_servicio, s.fecha_emision, s.numero_factura,
        s.tipo_comprobante, s.precio_cliente, s.base_imponible, s.igv, s.monto_detraccion,
        s.forma_pago, s.estado_servicio, s.origen, s.destino,
        c.nombre AS cliente, c.documento AS documento,
        CASE WHEN p.estado_pago='pagada' OR (COALESCE(a.abonado,0)>=s.precio_cliente AND a.abonado>0) THEN 'pagada'
             WHEN a.abonado>0 THEN 'parcial' ELSE COALESCE(p.estado_pago, 'sin_registrar') END AS estado_pago,
        COALESCE(a.abonado,0) AS abonado,
        CASE WHEN p.estado_pago='pagada' OR (COALESCE(a.abonado,0)>=s.precio_cliente AND a.abonado>0) THEN 0
             ELSE GREATEST(s.precio_cliente-COALESCE(a.abonado,0),0) END AS saldo,
        COALESCE(p.fecha_pago, CASE WHEN a.abonado>=s.precio_cliente THEN a.ultima_fecha END) AS fecha_pago
        FROM servicios s
        LEFT JOIN clientes c ON c.id = s.cliente_id
        LEFT JOIN factura_pagos p ON p.servicio_id = s.id AND p.numero_factura = s.numero_factura
        LEFT JOIN (SELECT servicio_id, SUM(monto) abonado, MAX(fecha) ultima_fecha FROM servicio_abonos GROUP BY servicio_id) a ON a.servicio_id=s.id
        WHERE s.estado_servicio <> 'cancelado'
        ORDER BY s.fecha_servicio DESC, s.id DESC");
    if (!$result) {
        throw new RuntimeException('No se pudo consultar facturas.');
    }
    json_response(['success' => true, 'data' => mysqli_fetch_all($result, MYSQLI_ASSOC),
        'csrf_token' => $_SESSION['facturas_csrf'], 'gestion_csrf' => gestion_csrf()]);
} catch (Throwable $e) {
    error_log('Facturas: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'No se pudieron consultar las facturas. Verifique la conexión y que se haya instalado facturas/esquema.sql.'], 500);
}

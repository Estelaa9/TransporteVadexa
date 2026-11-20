<?php
// portal/datos.php - Datos del portal del cliente. Todo se filtra por $_SESSION['cliente_id'];
// nunca por un parámetro del navegador (SEG-09). Un id ajeno responde 404 (SEG-10).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../facturas/lib.php';
require_auth();
require_method('GET');
$clienteId = (int)($_SESSION['cliente_id'] ?? 0);
if ($clienteId <= 0) json_response(['success' => false, 'error' => 'Su cuenta no está vinculada a un cliente. Contacte a VADEXSA.'], 403);

$campos = "s.id, s.fecha_servicio, s.hora_servicio, s.hora_fin_estimada, s.tipo_servicio, s.tipo_carga, s.peso_kg, s.origen, s.destino,
    s.estado_servicio, s.guia_transportista, s.guia_remitente, s.precio_cliente, s.modalidad,
    CASE WHEN s.modalidad = 'propio' THEN v.placa ELSE NULL END AS placa,
    CASE WHEN cp.id IS NULL THEN NULL ELSE CONCAT(cp.serie, '-', LPAD(cp.numero, 6, '0')) END AS comprobante";
$from = 'FROM servicios s LEFT JOIN vehiculos v ON v.id = s.vehiculo_id LEFT JOIN comprobantes cp ON cp.id = s.comprobante_id';

if (isset($_GET['servicio_id'])) {
    $s = db_one($conn, "SELECT $campos $from WHERE s.id = ? AND s.cliente_id = ?", 'ii', [(int)$_GET['servicio_id'], $clienteId]);
    if (!$s) json_response(['success' => false, 'error' => 'Servicio no encontrado.'], 404);
    json_response(['success' => true, 'data' => $s]);
}

$cliente = db_one($conn, 'SELECT id, nombre, documento, email, telefono, dias_credito FROM clientes WHERE id = ?', 'i', [$clienteId]);
$servicios = db_all($conn, "SELECT $campos $from WHERE s.cliente_id = ? ORDER BY s.fecha_servicio DESC, s.hora_servicio DESC LIMIT 1000", 'i', [$clienteId]);
$comprobantes = db_all($conn, 'SELECT x.id, x.tipo, x.numero_completo, x.fecha_emision, x.fecha_vencimiento, x.base_imponible, x.igv, x.total,
        x.pagado, x.saldo, x.estado, x.estado_pago, x.situacion, x.dias_vencido, x.servicios, x.referencia
    FROM (' . comprobantes_select() . ') x WHERE x.cliente_id = ? ORDER BY x.fecha_emision DESC, x.id DESC LIMIT 1000', 'i', [$clienteId]);
$resumen = ['servicios_activos' => 0, 'servicios_finalizados' => 0, 'saldo' => 0.0, 'vencido' => 0.0];
foreach ($servicios as $s) {
    if (in_array($s['estado_servicio'], ['programado', 'en_ruta'], true)) $resumen['servicios_activos']++;
    if ($s['estado_servicio'] === 'finalizado') $resumen['servicios_finalizados']++;
}
foreach ($comprobantes as $c) {
    if ($c['estado'] !== 'emitida' || $c['tipo'] === 'NOTA_CREDITO') continue;
    $resumen['saldo'] += (float)$c['saldo'];
    if ($c['situacion'] === 'vencida') $resumen['vencido'] += (float)$c['saldo'];
}
$resumen['saldo'] = round($resumen['saldo'], 2);
$resumen['vencido'] = round($resumen['vencido'], 2);
json_response(['success' => true, 'cliente' => $cliente, 'resumen' => $resumen, 'servicios' => $servicios, 'comprobantes' => $comprobantes]);

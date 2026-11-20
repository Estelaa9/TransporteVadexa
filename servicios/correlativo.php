<?php
// servicios/correlativo.php - Vista previa de la guía. El número definitivo se asigna al guardar (CON-01) y
// el comprobante se emite después de finalizar el servicio, en Facturación (NEG-12).
require_once __DIR__ . '/../config/conexion.php';
require_auth();
require_method('GET');
$siguiente = (int)db_value($conn, "SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'servicios'");
json_response([
    'success' => true,
    'guia_transportista' => 'GRT-' . str_pad((string)max(1, $siguiente), 6, '0', STR_PAD_LEFT) . ' (referencial)',
    'numero_factura' => '',
    'nota' => 'La guía se confirma al guardar. El comprobante se registra en Facturación cuando el servicio finaliza.',
]);

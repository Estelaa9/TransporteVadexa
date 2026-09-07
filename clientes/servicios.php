<?php
// clientes/servicios.php - Historial de servicios de un cliente
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$id = (int)($_GET['id'] ?? 0);
if (!$id) {
    json_response(["success" => false, "error" => "ID de cliente no especificado."], 400);
}

// Datos del cliente
$res_c = mysqli_query($conn, "SELECT * FROM clientes WHERE id = $id LIMIT 1");
$cliente = mysqli_fetch_assoc($res_c);

if (!$cliente) {
    json_response(["success" => false, "error" => "Cliente no encontrado."], 404);
}

// Historial de servicios
$sql = "SELECT s.*, v.placa, co.nombre AS conductor
        FROM servicios s
        LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
        LEFT JOIN conductores co ON s.conductor_id = co.id
        WHERE s.cliente_id = $id
        ORDER BY s.fecha_servicio DESC, s.id DESC";

$res = mysqli_query($conn, $sql);
$servicios = [];
$total_facturado = 0.0;
while ($r = mysqli_fetch_assoc($res)) {
    $servicios[] = $r;
    $total_facturado += (float)($r['precio_cliente'] ?? 0);
}

json_response([
    "success" => true,
    "cliente" => $cliente,
    "total_servicios" => count($servicios),
    "total_facturado" => $total_facturado,
    "servicios" => $servicios
]);
?>
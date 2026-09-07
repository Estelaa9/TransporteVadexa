<?php
// servicios/actualizar.php - Actualizar servicio existente
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();
$id = (int)($data['id'] ?? 0);

if (!$id) {
    json_response(["success" => false, "error" => "ID de servicio no especificado."], 400);
}

$fecha = mysqli_real_escape_string($conn, trim($data['fecha_servicio'] ?? ''));
$hora = mysqli_real_escape_string($conn, trim($data['hora_servicio'] ?? $data['hora'] ?? '00:00:00'));
$cliente = (int)($data['cliente_id'] ?? 0);
$vehiculo = (int)($data['vehiculo_id'] ?? 0);
$conductor = (int)($data['conductor_id'] ?? 0);
$tipo_servicio = mysqli_real_escape_string($conn, trim($data['tipo_servicio'] ?? 'Local'));
$tipo_carga = mysqli_real_escape_string($conn, trim($data['tipo_carga'] ?? 'General'));
$modalidad = mysqli_real_escape_string($conn, trim($data['modalidad'] ?? 'propio'));
$forma_pago = mysqli_real_escape_string($conn, trim($data['forma_pago'] ?? 'Contado'));
$origen = mysqli_real_escape_string($conn, trim($data['origen'] ?? ''));
$destino = mysqli_real_escape_string($conn, trim($data['destino'] ?? ''));
$monto = floatval($data['precio_cliente'] ?? 0);
$costo_proveedor = ($modalidad === 'propio') ? 0 : floatval($data['costo_proveedor'] ?? 0);
$guia_remitente = mysqli_real_escape_string($conn, trim($data['guia_remitente'] ?? ''));
$guia_transportista = mysqli_real_escape_string($conn, trim($data['guia_transportista'] ?? ''));
$numero_factura = mysqli_real_escape_string($conn, trim($data['numero_factura'] ?? ''));
$tipo_comprobante = mysqli_real_escape_string($conn, trim($data['tipo_comprobante'] ?? 'FACTURA'));
$estado = mysqli_real_escape_string($conn, trim($data['estado_servicio'] ?? 'programado'));

// Cálculo de IGV y Utilidad
$base = $monto;
$igv = 0;
if ($tipo_comprobante !== "SIN_COMPROBANTE") {
    $base = round($monto / 1.18, 2);
    $igv = round($monto - $base, 2);
}
$utilidad = $monto - $costo_proveedor;

$sql = "UPDATE servicios SET
            fecha_servicio = '$fecha',
            hora_servicio = '$hora',
            cliente_id = '$cliente',
            vehiculo_id = '$vehiculo',
            conductor_id = '$conductor',
            tipo_servicio = '$tipo_servicio',
            tipo_carga = '$tipo_carga',
            modalidad = '$modalidad',
            forma_pago = '$forma_pago',
            origen = '$origen',
            destino = '$destino',
            precio_cliente = '$monto',
            base_imponible = '$base',
            igv = '$igv',
            costo_proveedor = '$costo_proveedor',
            utilidad = '$utilidad',
            guia_remitente = '$guia_remitente',
            guia_transportista = '$guia_transportista',
            numero_factura = '$numero_factura',
            tipo_comprobante = '$tipo_comprobante',
            estado_servicio = '$estado'
        WHERE id = $id";

if (mysqli_query($conn, $sql)) {
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Servicio #{$id} actualizado correctamente.",
            "id" => $id
        ]);
    }
    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al actualizar servicio: " . mysqli_error($conn)], 500);
}
?>
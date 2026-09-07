<?php
// servicios/correlativo.php - Obtener siguiente correlativo sugerido para GRT y Comprobante
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$tipo_comp = $_GET['tipo_comprobante'] ?? 'FACTURA';

// 1. Siguiente Guía Transportista
$sql_g = "SELECT IFNULL(MAX(id), 0) as ultimo FROM servicios";
$res_g = mysqli_query($conn, $sql_g);
$row_g = mysqli_fetch_assoc($res_g);
$num_g = (int)($row_g['ultimo'] ?? 0) + 1;
$guia_transportista = "GRT-" . str_pad($num_g, 6, "0", STR_PAD_LEFT);

// 2. Siguiente Factura / Boleta
$numero_factura = "";
if ($tipo_comp === 'FACTURA') {
    $res_f = mysqli_query($conn, "SELECT COUNT(*) as total FROM servicios WHERE tipo_comprobante='FACTURA'");
    $num_f = (int)(mysqli_fetch_assoc($res_f)['total'] ?? 0) + 1;
    $numero_factura = "F001-" . str_pad($num_f, 6, "0", STR_PAD_LEFT);
} elseif ($tipo_comp === 'BOLETA') {
    $res_b = mysqli_query($conn, "SELECT COUNT(*) as total FROM servicios WHERE tipo_comprobante='BOLETA'");
    $num_b = (int)(mysqli_fetch_assoc($res_b)['total'] ?? 0) + 1;
    $numero_factura = "B001-" . str_pad($num_b, 6, "0", STR_PAD_LEFT);
}

json_response([
    "success" => true,
    "guia_transportista" => $guia_transportista,
    "numero_factura" => $numero_factura,
    "tipo_comprobante" => $tipo_comp
]);
?>

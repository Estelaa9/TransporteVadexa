<?php
// reportes/facturacion.php - Reporte de facturación e IGV
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$desde = $_GET['desde'] ?? '';
$hasta = $_GET['hasta'] ?? '';

$where_fechas = ["tipo_comprobante != 'SIN_COMPROBANTE'"];
if (!empty($desde)) {
    $d_esc = mysqli_real_escape_string($conn, $desde);
    $where_fechas[] = "fecha_servicio >= '$d_esc'";
}
if (!empty($hasta)) {
    $h_esc = mysqli_real_escape_string($conn, $hasta);
    $where_fechas[] = "fecha_servicio <= '$h_esc'";
}

$where_sql = "WHERE " . implode(" AND ", $where_fechas);

$sql = "SELECT fecha_servicio, numero_factura, tipo_comprobante, precio_cliente, base_imponible, igv
        FROM servicios
        $where_sql
        ORDER BY fecha_servicio DESC";

$result = mysqli_query($conn, $sql);
$comprobantes = [];
$total_facturado = 0.0;
$total_base = 0.0;
$total_igv = 0.0;

while ($row = mysqli_fetch_assoc($result)) {
    $comprobantes[] = $row;
    $total_facturado += (float)($row['precio_cliente'] ?? 0);
    $total_base += (float)($row['base_imponible'] ?? 0);
    $total_igv += (float)($row['igv'] ?? 0);
}

if (isset($_GET['json']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)) {
    json_response([
        "success" => true,
        "tipo" => "facturacion",
        "total_registros" => count($comprobantes),
        "total_facturado" => $total_facturado,
        "total_base" => $total_base,
        "total_igv" => $total_igv,
        "data" => $comprobantes
    ]);
}

include("../layout/header.php");
include("../layout/sidebar.php");
?>
<div class="content">
<h3 class="mb-4"><i class="bi bi-receipt"></i> Reporte de Facturación</h3>
<div class="card shadow">
<div class="card-body">
<table class="table table-striped table-bordered">
<thead class="table-dark">
<tr><th>Fecha</th><th>Factura/Boleta</th><th>Tipo</th><th>Base Imponible</th><th>IGV</th><th>Total</th></tr>
</thead>
<tbody>
<?php foreach($comprobantes as $r){ ?>
<tr>
<td><?php echo $r['fecha_servicio']; ?></td>
<td><?php echo $r['numero_factura']; ?></td>
<td><?php echo $r['tipo_comprobante']; ?></td>
<td>S/ <?php echo number_format($r['base_imponible'],2); ?></td>
<td>S/ <?php echo number_format($r['igv'],2); ?></td>
<td>S/ <?php echo number_format($r['precio_cliente'],2); ?></td>
</tr>
<?php } ?>
</tbody>
</table>
</div>
</div>
</div>
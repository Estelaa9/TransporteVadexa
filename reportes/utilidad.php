<?php
// reportes/utilidad.php - Reporte de utilidad y rentabilidad
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$desde = $_GET['desde'] ?? '';
$hasta = $_GET['hasta'] ?? '';

$where_fechas = [];
if (!empty($desde)) {
    $d_esc = mysqli_real_escape_string($conn, $desde);
    $where_fechas[] = "fecha_servicio >= '$d_esc'";
}
if (!empty($hasta)) {
    $h_esc = mysqli_real_escape_string($conn, $hasta);
    $where_fechas[] = "fecha_servicio <= '$h_esc'";
}

$where_sql = count($where_fechas) > 0 ? "WHERE " . implode(" AND ", $where_fechas) : "";

$sql = "SELECT id, fecha_servicio, modalidad, precio_cliente, costo_proveedor, utilidad
        FROM servicios
        $where_sql
        ORDER BY fecha_servicio DESC";

$result = mysqli_query($conn, $sql);
$utilidades = [];
$total_facturado = 0.0;
$total_costos = 0.0;
$total_utilidad = 0.0;

while ($row = mysqli_fetch_assoc($result)) {
    $utilidades[] = $row;
    $total_facturado += (float)($row['precio_cliente'] ?? 0);
    $total_costos += (float)($row['costo_proveedor'] ?? 0);
    $total_utilidad += (float)($row['utilidad'] ?? 0);
}

if (isset($_GET['json']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)) {
    json_response([
        "success" => true,
        "tipo" => "utilidad",
        "total_registros" => count($utilidades),
        "total_facturado" => $total_facturado,
        "total_costos" => $total_costos,
        "total_utilidad" => $total_utilidad,
        "data" => $utilidades
    ]);
}

include("../layout/header.php");
include("../layout/sidebar.php");
?>
<div class="content">
<h3 class="mb-4"><i class="bi bi-graph-up"></i> Reporte de Utilidad</h3>
<div class="card shadow">
<div class="card-body">
<table class="table table-striped table-bordered">
<thead class="table-dark">
<tr><th>ID</th><th>Fecha</th><th>Modalidad</th><th>Cobrado</th><th>Costo Proveedor</th><th>Utilidad</th></tr>
</thead>
<tbody>
<?php foreach($utilidades as $r){ ?>
<tr>
<td><?php echo $r['id']; ?></td>
<td><?php echo $r['fecha_servicio']; ?></td>
<td><?php echo $r['modalidad']; ?></td>
<td>S/ <?php echo number_format($r['precio_cliente'],2); ?></td>
<td>S/ <?php echo number_format($r['costo_proveedor'],2); ?></td>
<td>S/ <?php echo number_format($r['utilidad'],2); ?></td>
</tr>
<?php } ?>
</tbody>
</table>
</div>
</div>
</div>
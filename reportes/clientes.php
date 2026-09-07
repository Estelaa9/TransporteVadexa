<?php
// reportes/clientes.php - Reporte de facturación por cliente
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$desde = $_GET['desde'] ?? '';
$hasta = $_GET['hasta'] ?? '';

$where_fechas = [];
if (!empty($desde)) {
    $d_esc = mysqli_real_escape_string($conn, $desde);
    $where_fechas[] = "s.fecha_servicio >= '$d_esc'";
}
if (!empty($hasta)) {
    $h_esc = mysqli_real_escape_string($conn, $hasta);
    $where_fechas[] = "s.fecha_servicio <= '$h_esc'";
}

$where_sql = count($where_fechas) > 0 ? "WHERE " . implode(" AND ", $where_fechas) : "";

$sql = "SELECT c.id, c.nombre AS cliente, c.documento,
               COUNT(s.id) as total_viajes,
               IFNULL(SUM(s.precio_cliente), 0) as total_facturado
        FROM clientes c
        LEFT JOIN servicios s ON c.id = s.cliente_id
        $where_sql
        GROUP BY c.id, c.nombre, c.documento
        ORDER BY total_facturado DESC";

$result = mysqli_query($conn, $sql);
$clientes_reporte = [];
$gran_total = 0.0;

while ($row = mysqli_fetch_assoc($result)) {
    $clientes_reporte[] = $row;
    $gran_total += (float)($row['total_facturado'] ?? 0);
}

if (isset($_GET['json']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)) {
    json_response([
        "success" => true,
        "tipo" => "clientes",
        "total_clientes" => count($clientes_reporte),
        "gran_total" => $gran_total,
        "data" => $clientes_reporte
    ]);
}

include("../layout/header.php");
include("../layout/sidebar.php");
?>
<div class="content">
<h3 class="mb-4"><i class="bi bi-people"></i> Ventas por Cliente</h3>
<div class="card shadow">
<div class="card-body">
<table class="table table-striped table-bordered">
<thead class="table-dark">
<tr><th>Cliente</th><th>Documento</th><th>Total Viajes</th><th>Total Facturado</th></tr>
</thead>
<tbody>
<?php foreach($clientes_reporte as $r){ ?>
<tr>
<td><?php echo $r['cliente']; ?></td>
<td><?php echo $r['documento']; ?></td>
<td><?php echo $r['total_viajes']; ?></td>
<td>S/ <?php echo number_format($r['total_facturado'],2); ?></td>
</tr>
<?php } ?>
</tbody>
</table>
</div>
</div>
</div>
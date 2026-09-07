<?php
// reportes/servicios.php - Reporte de servicios con filtros de fecha
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

$sql = "SELECT s.*, 
               c.nombre AS cliente,
               v.placa,
               co.nombre AS conductor
        FROM servicios s
        LEFT JOIN clientes c ON s.cliente_id = c.id
        LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
        LEFT JOIN conductores co ON s.conductor_id = co.id
        $where_sql
        ORDER BY s.fecha_servicio DESC, s.id DESC";

$result = mysqli_query($conn, $sql);
$servicios = [];
$total_monto = 0.0;
while ($row = mysqli_fetch_assoc($result)) {
    $servicios[] = $row;
    $total_monto += (float)($row['precio_cliente'] ?? 0);
}

if (isset($_GET['json']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)) {
    json_response([
        "success" => true,
        "tipo" => "servicios",
        "total_registros" => count($servicios),
        "total_monto" => $total_monto,
        "data" => $servicios
    ]);
}

include("../layout/header.php");
include("../layout/sidebar.php");
?>
<div class="content">
<h3 class="mb-4"><i class="bi bi-file-earmark-text"></i> Reporte de Servicios</h3>
<div class="card shadow">
<div class="card-body">
<table id="tablaReporte" class="table table-striped table-bordered">
<thead class="table-dark">
<tr>
<th>Fecha</th><th>Hora</th><th>Cliente</th><th>Vehículo</th><th>Conductor</th><th>Origen</th><th>Destino</th><th>Monto</th>
</tr>
</thead>
<tbody>
<?php foreach($servicios as $row){ ?>
<tr>
<td><?php echo $row['fecha_servicio']; ?></td>
<td><?php echo $row['hora_servicio']; ?></td>
<td><?php echo $row['cliente']; ?></td>
<td><?php echo $row['placa']; ?></td>
<td><?php echo $row['conductor']; ?></td>
<td><?php echo $row['origen']; ?></td>
<td><?php echo $row['destino']; ?></td>
<td>S/ <?php echo number_format($row['precio_cliente'],2); ?></td>
</tr>
<?php } ?>
</tbody>
</table>
</div>
</div>
</div>
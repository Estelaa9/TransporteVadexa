<?php

include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$id_cliente = $_GET['id'];

/* datos del cliente */

$cliente=mysqli_query($conn,"SELECT * FROM clientes WHERE id='$id_cliente'");
$datos_cliente=mysqli_fetch_assoc($cliente);

/* historial de servicios */

$sql="SELECT s.*, v.placa, c.nombre AS conductor
FROM servicios s
LEFT JOIN vehiculos v ON s.vehiculo_id=v.id
LEFT JOIN conductores c ON s.conductor_id=c.id
WHERE s.cliente_id='$id_cliente'
ORDER BY s.fecha_servicio DESC";

$servicios=mysqli_query($conn,$sql);

/* servicios por mes */

$sql_mes="SELECT 
DATE_FORMAT(fecha_servicio,'%Y-%m') mes,
COUNT(*) total
FROM servicios
WHERE cliente_id='$id_cliente'
GROUP BY mes
ORDER BY mes DESC";

$servicios_mes=mysqli_query($conn,$sql_mes);

/* totales */

$total_servicios=mysqli_query($conn,"SELECT COUNT(*) total FROM servicios WHERE cliente_id='$id_cliente'");
$row_total=mysqli_fetch_assoc($total_servicios);

$total_facturado=mysqli_query($conn,"SELECT SUM(precio_cliente) total FROM servicios WHERE cliente_id='$id_cliente'");
$row_facturado=mysqli_fetch_assoc($total_facturado);


?>

<div class="content">

<h4 class="mb-3">
Historial de Servicios
</h4>

<div class="card mb-4 shadow">

<div class="card-body">

<h5><?php echo $datos_cliente['nombre']; ?></h5>

<p>
Documento: <?php echo $datos_cliente['documento']; ?><br>
Teléfono: <?php echo $datos_cliente['telefono']; ?><br>
Email: <?php echo $datos_cliente['email']; ?>
</p>

</div>

</div>

<div class="row mb-3">

<div class="col-md-4">

<div class="card bg-primary text-white">

<div class="card-body">

Servicios realizados<br>

<h3><?php echo $row_total['total']; ?></h3>

</div>

</div>

</div>

<div class="col-md-4">

<div class="card bg-success text-white">

<div class="card-body">

Total facturado<br>

<h3>S/ <?php echo number_format($row_facturado['total'],2); ?></h3>

</div>

</div>

</div>

</div>
<div class="card shadow mb-4">

<div class="card-header bg-secondary text-white">
Servicios por mes
</div>

<div class="card-body">

<table class="table table-striped">

<thead class="table-dark">

<tr>
<th>Mes</th>
<th>Servicios</th>
</tr>

</thead>

<tbody>

<?php while($mes=mysqli_fetch_assoc($servicios_mes)){ ?>

<tr>

<td><?php echo $mes['mes']; ?></td>

<td>
<span class="badge bg-primary">
<?php echo $mes['total']; ?>
</span>
</td>

</tr>

<?php } ?>

</tbody>

</table>

</div>

</div>

<div class="card shadow">

<div class="card-header bg-dark text-white">

Servicios del Cliente

</div>

<div class="card-body">

<table class="table table-striped table-hover">

<thead class="table-dark">

<tr>

<th>Fecha</th>
<th>Origen</th>
<th>Destino</th>
<th>Vehículo</th>
<th>Conductor</th>
<th>Monto</th>
<th>Estado</th>

</tr>

</thead>

<tbody>

<?php while($s=mysqli_fetch_assoc($servicios)){ ?>

<tr>

<td><?php echo $s['fecha_servicio']; ?></td>

<td><?php echo $s['origen']; ?></td>

<td><?php echo $s['destino']; ?></td>

<td><?php echo $s['placa']; ?></td>

<td><?php echo $s['conductor']; ?></td>

<td>S/ <?php echo $s['precio_cliente']; ?></td>

<td>

<span class="badge bg-info">

<?php echo $s['estado_servicio']; ?>

</span>

</td>

</tr>

<?php } ?>

</tbody>

</table>

</div>

</div>

</div>
<?php
include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$fecha = isset($_GET['fecha']) ? $_GET['fecha'] : date("Y-m-d");

$sql="SELECT s.*, 
c.nombre AS cliente,
v.placa,
co.nombre AS conductor

FROM servicios s

LEFT JOIN clientes c 
ON s.cliente_id = c.id

LEFT JOIN vehiculos v 
ON s.vehiculo_id = v.id

LEFT JOIN conductores co 
ON s.conductor_id = co.id

WHERE s.fecha_servicio='$fecha'

ORDER BY s.hora_servicio ASC";

$result=mysqli_query($conn,$sql);
?>

<div class="content">

<div class="d-flex justify-content-between mb-3">

<h3><i class="bi bi-calendar-event"></i> Programación de Transporte</h3>

</div>

<div class="card shadow">

<div class="card-header bg-dark text-white">

Programación del día <?php echo date("d/m/Y", strtotime($fecha)); ?>

</div>

<div class="card-body">

<!-- FILTRO POR FECHA -->

<form method="GET" class="mb-3">

<div class="row">

<div class="col-md-3">

<input type="date" name="fecha" class="form-control"
value="<?php echo $fecha; ?>">

</div>

<div class="col-md-2">

<button class="btn btn-primary">
Ver Programación
</button>

</div>

</div>

</form>

<table class="table table-bordered table-striped">

<thead class="table-primary">

<tr>
<th>Hora</th>
<th>Vehículo</th>
<th>Conductor</th>
<th>Cliente</th>
<th>Origen</th>
<th>Destino</th>
<th>Estado</th>
<th>Acción</th>
</tr>

</thead>

<tbody>

<?php while($row=mysqli_fetch_assoc($result)){ ?>

<tr>

<td><?php echo $row['hora_servicio']; ?></td>

<td>
<i class="bi bi-truck"></i>
<?php echo $row['placa']; ?>
</td>

<td>
<i class="bi bi-person"></i>
<?php echo $row['conductor']; ?>
</td>

<td><?php echo $row['cliente']; ?></td>

<td><?php echo $row['origen']; ?></td>

<td><?php echo $row['destino']; ?></td>

<td>

<?php

if($row['estado_servicio']=="programado"){
echo "<span class='badge bg-warning'>Programado</span>";
}

elseif($row['estado_servicio']=="en_ruta"){
echo "<span class='badge bg-primary'>En Ruta</span>";
}

elseif($row['estado_servicio']=="finalizado"){
echo "<span class='badge bg-success'>Finalizado</span>";
}

elseif($row['estado_servicio']=="cancelado"){
echo "<span class='badge bg-danger'>Cancelado</span>";
}

?>

</td>

<td>

<?php if($row['estado_servicio']=="programado"){ ?>

<a href="cambiar_estado.php?id=<?php echo $row['id']; ?>&estado=en_ruta"
class="btn btn-primary btn-sm">

<i class="bi bi-play-fill"></i> Iniciar

</a>

<?php } ?>

<?php if($row['estado_servicio']=="en_ruta"){ ?>

<a href="cambiar_estado.php?id=<?php echo $row['id']; ?>&estado=finalizado"
class="btn btn-success btn-sm">

<i class="bi bi-check"></i> Finalizar

</a>

<?php } ?>

</td>

</tr>

<?php } ?>

</tbody>

</table>

</div>

</div>

</div>
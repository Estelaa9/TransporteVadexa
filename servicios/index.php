<?php
include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

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
ON s.conductor_id = co.id";

$result=mysqli_query($conn,$sql);
?>

<div class="content">

<div class="d-flex justify-content-between mb-3">

<h3><i class="bi bi-truck"></i> Servicios</h3>

<a href="crear.php" class="btn btn-primary">
<i class="bi bi-plus-circle"></i> Nuevo Servicio
</a>

</div>

<div class="card shadow">

<div class="card-body">

<table id="tablaServicios" class="table table-striped table-bordered">

<thead class="table-primary">

<tr>
<th>ID</th>
<th>Fecha</th>
<th>Cliente</th>
<th>Vehículo</th>
<th>Conductor</th>
<th>Origen</th>
<th>Destino</th>
<th>Guía Remitente</th>
<th>Guía Transportista</th>
<th>Factura</th>
<th>Monto</th>
<th>Estado</th>
<th>Acciones</th>
</tr>

</thead>

<tbody>

<?php while($row=mysqli_fetch_assoc($result)){ ?>

<tr>

<td><?php echo $row['id']; ?></td>
<td><?php echo $row['fecha_servicio']; ?></td>
<td><?php echo $row['cliente']; ?></td>
<td><?php echo $row['placa']; ?></td>
<td><?php echo $row['conductor']; ?></td>
<td><?php echo $row['origen']; ?></td>
<td><?php echo $row['destino']; ?></td>
<td><?php echo $row['guia_remitente']; ?></td>
<td><?php echo $row['guia_transportista']; ?></td>
<td><?php echo $row['numero_factura']; ?></td>
<td>S/ <?php echo $row['precio_cliente']; ?></td>
<td><?php echo $row['estado_servicio']; ?></td>

<td>

<a href="editar.php?id=<?php echo $row['id']; ?>" class="btn btn-warning btn-sm">
<i class="bi bi-pencil"></i>
</a>

<a href="eliminar.php?id=<?php echo $row['id']; ?>" class="btn btn-danger btn-sm">
<i class="bi bi-trash"></i>
</a>

</td>

</tr>

<?php } ?>

</tbody>

</table>

</div>

</div>

</div>

<script>

$(document).ready(function(){

$('#tablaServicios').DataTable({
language:{
url:'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
}
});

});

</script>
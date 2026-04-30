<?php

include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$sql="SELECT s.*, 
c.nombre as cliente,
v.placa,
co.nombre as conductor

FROM servicios s

LEFT JOIN clientes c ON s.cliente_id=c.id
LEFT JOIN vehiculos v ON s.vehiculo_id=v.id
LEFT JOIN conductores co ON s.conductor_id=co.id

ORDER BY s.fecha_servicio DESC";

$result=mysqli_query($conn,$sql);

?>

<div class="content">

<h3 class="mb-4">
<i class="bi bi-file-earmark-text"></i> Reporte de Servicios
</h3>

<div class="card shadow">

<div class="card-body">

<table id="tablaReporte" class="table table-striped table-bordered">

<thead class="table-dark">

<tr>

<th>Fecha</th>
<th>Hora</th>
<th>Cliente</th>
<th>Vehículo</th>
<th>Conductor</th>
<th>Origen</th>
<th>Destino</th>
<th>Monto</th>
<th>Estado</th>

</tr>

</thead>
<script>

$(document).ready(function() {

$('#tablaReporte').DataTable({

dom: 'Bfrtip',

buttons: [
'excel',
'print'
],

language: {

search: "Buscar:",

lengthMenu: "Mostrar _MENU_ registros",

info: "Mostrando _START_ a _END_ de _TOTAL_ registros",

paginate: {
previous: "Anterior",
next: "Siguiente"
}

}

});

});

</script>
<tbody>

<?php while($row=mysqli_fetch_assoc($result)){ ?>

<tr>

<td><?php echo $row['fecha_servicio']; ?></td>

<td><?php echo $row['hora_servicio']; ?></td>

<td><?php echo $row['cliente']; ?></td>

<td><?php echo $row['placa']; ?></td>

<td><?php echo $row['conductor']; ?></td>

<td><?php echo $row['origen']; ?></td>

<td><?php echo $row['destino']; ?></td>

<td>S/ <?php echo number_format($row['precio_cliente'],2); ?></td>

<td><?php echo $row['estado_servicio']; ?></td>

</tr>

<?php } ?>

</tbody>

</table>

</div>

</div>

</div>
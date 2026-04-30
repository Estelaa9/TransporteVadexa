<?php

include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$sql="SELECT 
c.nombre,
COUNT(s.id) as servicios,
SUM(s.precio_cliente) as facturacion

FROM servicios s

LEFT JOIN clientes c ON s.cliente_id=c.id

GROUP BY c.nombre

ORDER BY facturacion DESC";

$result=mysqli_query($conn,$sql);

?>

<div class="content">

<h3 class="mb-4">
<i class="bi bi-people"></i> Reporte por Cliente
</h3>

<div class="card shadow">

<div class="card-body">

<table id="tablaReporte" class="table table-striped table-bordered">

<thead class="table-dark">

<tr>

<th>Cliente</th>
<th>Servicios</th>
<th>Facturación</th>

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

<td><?php echo $row['nombre']; ?></td>

<td><?php echo $row['servicios']; ?></td>

<td>S/ <?php echo number_format($row['facturacion'],2); ?></td>

</tr>

<?php } ?>

</tbody>

</table>

</div>

</div>

</div>
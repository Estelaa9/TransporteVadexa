<?php

include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$sql="SELECT 
fecha_servicio,
numero_factura,
tipo_comprobante,
precio_cliente,
base_imponible,
igv

FROM servicios

WHERE tipo_comprobante!='SIN_COMPROBANTE'

ORDER BY fecha_servicio DESC";

$result=mysqli_query($conn,$sql);

?>

<div class="content">

<h3 class="mb-4">
<i class="bi bi-receipt"></i> Reporte de Facturación
</h3>

<div class="card shadow">

<div class="card-body">

<table id="tablaReporte" class="table table-striped table-bordered">

<thead class="table-dark">

<tr>

<th>Fecha</th>
<th>Comprobante</th>
<th>Tipo</th>
<th>Base</th>
<th>IGV</th>
<th>Total</th>

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

<td><?php echo $row['numero_factura']; ?></td>

<td><?php echo $row['tipo_comprobante']; ?></td>

<td>S/ <?php echo number_format($row['base_imponible'],2); ?></td>

<td>S/ <?php echo number_format($row['igv'],2); ?></td>

<td>S/ <?php echo number_format($row['precio_cliente'],2); ?></td>

</tr>

<?php } ?>

</tbody>

</table>

</div>

</div>

</div>
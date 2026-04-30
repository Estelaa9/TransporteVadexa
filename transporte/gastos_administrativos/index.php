<?php

include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$sql="SELECT * FROM gastos_administrativos ORDER BY fecha DESC";
$result=mysqli_query($conn,$sql);

?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-primary text-white">

<h5><i class="bi bi-cash-stack"></i> Gastos Administrativos</h5>

<a href="crear.php" class="btn btn-light btn-sm float-end">
<i class="bi bi-plus-circle"></i> Nuevo Gasto
</a>

</div>

<div class="card-body">

<table id="tabla_gastos_admin" class="table table-striped table-hover table-bordered">

<thead class="table-dark">

<tr>
<th>Fecha</th>
<th>Tipo</th>
<th>Descripción</th>
<th>Monto</th>
<th>Acciones</th>
</tr>

</thead>

<tbody>

<?php while($row=mysqli_fetch_assoc($result)){ ?>

<tr>

<td><?php echo $row['fecha']; ?></td>
<td><?php echo $row['tipo_gasto']; ?></td>
<td><?php echo $row['descripcion']; ?></td>
<td><strong>S/ <?php echo $row['monto']; ?></strong></td>

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

$('#tabla_gastos_admin').DataTable({

language:{
url:'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
}

});

});

</script>
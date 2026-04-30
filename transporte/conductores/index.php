<?php
include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$sql="SELECT * FROM conductores";
$result=mysqli_query($conn,$sql);
?>

<div class="content">

<div class="d-flex justify-content-between mb-3">

<h3><i class="bi bi-person-badge"></i> Conductores</h3>

<a href="crear.php" class="btn btn-primary">
<i class="bi bi-plus-circle"></i> Nuevo Conductor
</a>

</div>

<div class="card shadow">

<div class="card-body">

<table id="tablaConductores" class="table table-striped table-bordered">

<thead class="table-primary">

<tr>
<th>ID</th>
<th>Nombre</th>
<th>Teléfono</th>
<th>Licencia</th>
<th>Estado</th>
<th>Acciones</th>
</tr>

</thead>

<tbody>

<?php while($row=mysqli_fetch_assoc($result)){ ?>

<tr>

<td><?php echo $row['id']; ?></td>
<td><?php echo $row['nombre']; ?></td>
<td><?php echo $row['telefono']; ?></td>
<td><?php echo $row['licencia']; ?></td>
<td><?php echo $row['estado']; ?></td>

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

$('#tablaConductores').DataTable({

language:{
url:'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
}

});

});

</script>
<?php

include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$sql="SELECT * FROM clientes ORDER BY id DESC";
$result=mysqli_query($conn,$sql);

?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-primary text-white">

<h5><i class="bi bi-people"></i> Clientes</h5>

<a href="crear.php" class="btn btn-light btn-sm float-end">
<i class="bi bi-person-plus"></i> Nuevo Cliente
</a>

</div>

<div class="card-body">
<div class="row mb-3">

<div class="col-md-3">

<select id="filtro_tipo" class="form-control">

<option value="">Todos los clientes</option>
<option value="Empresa">Empresas</option>
<option value="Persona">Personas</option>

</select>

</div>

</div>
<?php

$total=mysqli_query($conn,"SELECT COUNT(*) total FROM clientes");
$row_total=mysqli_fetch_assoc($total);

?>

<div class="alert alert-info">

Total de clientes registrados: 
<strong><?php echo $row_total['total']; ?></strong>

</div>
<table id="tabla_clientes" class="table table-striped table-hover table-bordered">

<thead class="table-dark">

<tr>
<th>ID</th>
<th>Cliente</th>
<th>Documento</th>
<th>Teléfono</th>
<th>Email</th>
<th>Dirección</th>
<th>Tipo</th>
<th>Acciones</th>
</tr>

</thead>

<tbody>

<?php while($row=mysqli_fetch_assoc($result)){ ?>

<tr>

<td><?php echo $row['id']; ?></td>

<td><?php echo $row['nombre']; ?></td>

<td><?php echo $row['documento']; ?></td>

<td><?php echo $row['telefono']; ?></td>

<td><?php echo $row['email']; ?></td>

<td><?php echo $row['direccion']; ?></td>

<td>

<?php

if($row['tipo_cliente']=="Empresa"){

echo "<span class='badge bg-primary'>Empresa</span>";

}else{

echo "<span class='badge bg-success'>Persona</span>";

}

?>

</td>

<td>

<a href="editar.php?id=<?php echo $row['id']; ?>" 
class="btn btn-warning btn-sm">
<i class="bi bi-pencil"></i>
</a>

<a href="eliminar.php?id=<?php echo $row['id']; ?>" 
class="btn btn-danger btn-sm"
onclick="return confirm('¿Eliminar cliente?')">
<i class="bi bi-trash"></i>
</a>
<a href="servicios.php?id=<?php echo $row['id']; ?>" 
class="btn btn-info btn-sm">
<i class="bi bi-truck"></i>
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

var table = $('#tabla_clientes').DataTable({

language:{
url:'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
}

});

$('#filtro_tipo').on('change', function(){

table.column(6).search(this.value).draw();

});

});

</script>
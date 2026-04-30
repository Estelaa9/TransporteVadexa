<?php

include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$id=$_GET['id'];

$sql="SELECT * FROM proveedores WHERE id=$id";
$result=mysqli_query($conn,$sql);
$row=mysqli_fetch_assoc($result);
?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-warning">

<h5><i class="bi bi-pencil-square"></i> Editar Proveedor</h5>

</div>

<div class="card-body">

<form action="actualizar.php" method="POST">

<input type="hidden" name="id" value="<?php echo $row['id']; ?>">

<div class="mb-3">
<label>Nombre</label>
<input type="text" name="nombre" class="form-control"
value="<?php echo $row['nombre']; ?>">
</div>

<div class="mb-3">
<label>Teléfono</label>
<input type="text" name="telefono" class="form-control"
value="<?php echo $row['telefono']; ?>">
</div>

<div class="mb-3">
<label>Vehículo</label>
<input type="text" name="vehiculo" class="form-control"
value="<?php echo $row['vehiculo']; ?>">
</div>

<div class="mb-3">
<label>Placa</label>
<input type="text" name="placa" class="form-control"
value="<?php echo $row['placa']; ?>">
</div>

<button class="btn btn-primary">
Actualizar
</button>

</form>

</div>

</div>

</div>
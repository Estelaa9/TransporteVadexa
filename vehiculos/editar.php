<?php

include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$id=$_GET['id'];

$sql="SELECT * FROM vehiculos WHERE id=$id";
$result=mysqli_query($conn,$sql);
$row=mysqli_fetch_assoc($result);

?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-warning">

<h5><i class="bi bi-pencil-square"></i> Editar Vehículo</h5>

</div>

<div class="card-body">

<form action="actualizar.php" method="POST">

<input type="hidden" name="id" value="<?php echo $row['id']; ?>">

<div class="row">

<div class="col-md-6 mb-3">

<label><i class="bi bi-credit-card"></i> Placa</label>

<input type="text" name="placa" class="form-control"
value="<?php echo $row['placa']; ?>" required>

</div>

<div class="col-md-6 mb-3">

<label><i class="bi bi-truck-front"></i> Modelo</label>

<input type="text" name="modelo" class="form-control"
value="<?php echo $row['modelo']; ?>">

</div>

<div class="col-md-6 mb-3">

<label><i class="bi bi-box"></i> Tipo</label>

<input type="text" name="tipo" class="form-control"
value="<?php echo $row['tipo']; ?>">

</div>

<div class="col-md-6 mb-3">

<label><i class="bi bi-speedometer"></i> Capacidad</label>

<input type="text" name="capacidad" class="form-control"
value="<?php echo $row['capacidad']; ?>">

</div>

<div class="col-md-6 mb-3">

<label><i class="bi bi-check-circle"></i> Estado</label>

<select name="estado" class="form-control">

<option value="activo" <?php if($row['estado']=="activo") echo "selected"; ?>>Activo</option>

<option value="mantenimiento" <?php if($row['estado']=="mantenimiento") echo "selected"; ?>>Mantenimiento</option>

<option value="inactivo" <?php if($row['estado']=="inactivo") echo "selected"; ?>>Inactivo</option>

</select>

</div>

</div>

<button class="btn btn-primary">

<i class="bi bi-save"></i> Actualizar Vehículo

</button>

<a href="index.php" class="btn btn-secondary">

<i class="bi bi-arrow-left"></i> Volver

</a>

</form>

</div>

</div>

</div>
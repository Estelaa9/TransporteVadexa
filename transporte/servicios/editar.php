<?php

include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$id=$_GET['id'];

$sql="SELECT * FROM servicios WHERE id=$id";
$result=mysqli_query($conn,$sql);
$row=mysqli_fetch_assoc($result);

?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-warning">

<h5>Editar Servicio</h5>

</div>

<div class="card-body">

<form action="actualizar.php" method="POST">

<input type="hidden" name="id" value="<?php echo $row['id']; ?>">

<div class="mb-3">

<label>Origen</label>

<input type="text" name="origen"
value="<?php echo $row['origen']; ?>"
class="form-control">

</div>

<div class="mb-3">

<label>Destino</label>

<input type="text" name="destino"
value="<?php echo $row['destino']; ?>"
class="form-control">

</div>

<div class="mb-3">

<label>Monto</label>

<input type="number" name="precio_cliente"
value="<?php echo $row['precio_cliente']; ?>"
class="form-control">

</div>

<button class="btn btn-primary">
Actualizar
</button>

</form>

</div>

</div>

</div>
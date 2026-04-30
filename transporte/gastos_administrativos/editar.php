<?php

include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$id=$_GET['id'];

$sql="SELECT * FROM gastos_administrativos WHERE id='$id'";
$result=mysqli_query($conn,$sql);
$row=mysqli_fetch_assoc($result);

?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-warning">

Editar Gasto Administrativo

</div>

<div class="card-body">

<form action="actualizar.php" method="POST">

<input type="hidden" name="id" value="<?php echo $row['id']; ?>">

<div class="mb-3">

<label>Fecha</label>

<input type="date" name="fecha"
value="<?php echo $row['fecha']; ?>"
class="form-control">

</div>

<div class="mb-3">

<label>Tipo</label>

<input type="text"
name="tipo_gasto"
value="<?php echo $row['tipo_gasto']; ?>"
class="form-control">

</div>

<div class="mb-3">

<label>Monto</label>

<input type="number"
name="monto"
value="<?php echo $row['monto']; ?>"
class="form-control">

</div>

<div class="mb-3">

<label>Descripción</label>

<textarea name="descripcion" class="form-control"><?php echo $row['descripcion']; ?></textarea>

</div>

<button class="btn btn-primary">Actualizar</button>

<a href="index.php" class="btn btn-secondary">Volver</a>

</form>

</div>

</div>

</div>
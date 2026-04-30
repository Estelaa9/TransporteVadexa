<?php

include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$id=$_GET['id'];

$sql="SELECT * FROM gastos_operativos WHERE id='$id'";
$result=mysqli_query($conn,$sql);
$row=mysqli_fetch_assoc($result);

$vehiculos=mysqli_query($conn,"SELECT * FROM vehiculos");

?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-warning text-dark">

<h5>Editar Gasto Operativo</h5>

</div>

<div class="card-body">

<form action="actualizar.php" method="POST">

<input type="hidden" name="id" value="<?php echo $row['id']; ?>">

<div class="row">

<div class="col-md-3 mb-3">

<label>Fecha</label>

<input type="date" name="fecha" class="form-control"
value="<?php echo $row['fecha']; ?>" required>

</div>

<div class="col-md-3 mb-3">

<label>Vehículo</label>

<select name="vehiculo_id" class="form-control">

<?php while($v=mysqli_fetch_assoc($vehiculos)){ ?>

<option value="<?php echo $v['id']; ?>"
<?php if($v['id']==$row['vehiculo_id']) echo "selected"; ?>>

<?php echo $v['placa']; ?>

</option>

<?php } ?>

</select>

</div>

<div class="col-md-3 mb-3">

<label>Tipo Gasto</label>

<select name="tipo_gasto" class="form-control">

<option <?php if($row['tipo_gasto']=="Combustible") echo "selected"; ?>>Combustible</option>
<option <?php if($row['tipo_gasto']=="Peaje") echo "selected"; ?>>Peaje</option>
<option <?php if($row['tipo_gasto']=="Mantenimiento") echo "selected"; ?>>Mantenimiento</option>
<option <?php if($row['tipo_gasto']=="Seguro") echo "selected"; ?>>Seguro</option>
<option <?php if($row['tipo_gasto']=="Papeleta") echo "selected"; ?>>Papeleta</option>
<option <?php if($row['tipo_gasto']=="Viáticos") echo "selected"; ?>>Viáticos</option>

</select>

</div>

<div class="col-md-3 mb-3">

<label>Monto</label>

<input type="number" step="0.01" name="monto"
value="<?php echo $row['monto']; ?>"
class="form-control" required>

</div>

<div class="col-md-12 mb-3">

<label>Descripción</label>

<textarea name="descripcion" class="form-control"><?php echo $row['descripcion']; ?></textarea>

</div>

</div>

<button class="btn btn-primary">

Actualizar Gasto

</button>

<a href="index.php" class="btn btn-secondary">

Volver

</a>

</form>

</div>

</div>

</div>
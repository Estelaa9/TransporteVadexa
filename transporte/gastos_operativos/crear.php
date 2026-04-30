<?php

include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$vehiculos=mysqli_query($conn,"SELECT * FROM vehiculos");

?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-success text-white">

Registrar Gasto Operativo

</div>

<div class="card-body">

<form action="guardar.php" method="POST">

<div class="row">

<div class="col-md-3 mb-3">

<label>Fecha</label>

<input type="date" name="fecha" class="form-control" required>

</div>

<div class="col-md-3 mb-3">

<label>Vehículo</label>

<select name="vehiculo_id" class="form-control">

<?php while($v=mysqli_fetch_assoc($vehiculos)){ ?>

<option value="<?php echo $v['id']; ?>">
<?php echo $v['placa']; ?>
</option>

<?php } ?>

</select>

</div>

<div class="col-md-3 mb-3">

<label>Tipo Gasto</label>

<select name="tipo_gasto" class="form-control">

<option>Combustible</option>
<option>Peaje</option>
<option>Mantenimiento</option>
<option>Seguro</option>
<option>Papeleta</option>
<option>Viáticos</option>

</select>

</div>

<div class="col-md-3 mb-3">

<label>Monto</label>

<input type="number" step="0.01" name="monto" class="form-control" required>

</div>

<div class="col-md-12 mb-3">

<label>Descripción</label>

<textarea name="descripcion" class="form-control"></textarea>

</div>

</div>

<button class="btn btn-success">

Guardar Gasto

</button>

</form>

</div>

</div>

</div>
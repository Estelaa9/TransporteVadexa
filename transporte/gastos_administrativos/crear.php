<?php

include("../layout/header.php");
include("../layout/sidebar.php");

?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-success text-white">

<h5>Registrar Gasto Administrativo</h5>

</div>

<div class="card-body">

<form action="guardar.php" method="POST">

<div class="row">

<div class="col-md-3 mb-3">

<label>Fecha</label>

<input type="date" name="fecha" class="form-control" required>

</div>

<div class="col-md-3 mb-3">

<label>Tipo de Gasto</label>

<select name="tipo_gasto" class="form-control">

<option>Alquiler Oficina</option>
<option>Servicios Internet</option>
<option>Electricidad</option>
<option>Agua</option>
<option>Software</option>
<option>Material Oficina</option>
<option>Otros</option>

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

<i class="bi bi-save"></i> Guardar

</button>

<a href="index.php" class="btn btn-secondary">Volver</a>

</form>

</div>

</div>

</div>
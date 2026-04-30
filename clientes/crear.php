<?php
include("../layout/header.php");
include("../layout/sidebar.php");
?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-primary text-white">
<h5><i class="bi bi-person-plus"></i> Registrar Cliente</h5>
</div>

<div class="card-body">

<form action="guardar.php" method="POST">

<div class="row">

<div class="col-md-6 mb-3">
<label><i class="bi bi-building"></i> Cliente / Empresa</label>
<input type="text" name="nombre" class="form-control" required>
</div>

<div class="col-md-6 mb-3">
<label><i class="bi bi-credit-card"></i> RUC / DNI</label>
<input type="text" name="documento" class="form-control" required>
</div>

<div class="col-md-6 mb-3">
<label><i class="bi bi-telephone"></i> Teléfono</label>
<input type="text" name="telefono" class="form-control">
</div>

<div class="col-md-6 mb-3">
<label><i class="bi bi-envelope"></i> Email</label>
<input type="email" name="email" class="form-control">
</div>

<div class="col-md-6 mb-3">
<label><i class="bi bi-person-badge"></i> Tipo Cliente</label>

<select name="tipo_cliente" class="form-control">

<option value="Empresa">Empresa</option>
<option value="Persona">Persona</option>

</select>

</div>

<div class="col-md-12 mb-3">
<label><i class="bi bi-geo-alt"></i> Dirección</label>
<textarea name="direccion" class="form-control" rows="3"></textarea>
</div>

</div>

<button class="btn btn-success">
<i class="bi bi-save"></i> Guardar Cliente
</button>

<a href="index.php" class="btn btn-secondary">
<i class="bi bi-arrow-left"></i> Volver
</a>

</form>

</div>

</div>

</div>
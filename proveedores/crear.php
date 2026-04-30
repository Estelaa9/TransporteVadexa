<?php
include("../layout/header.php");
include("../layout/sidebar.php");
?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-primary text-white">

<h5><i class="bi bi-box-seam"></i> Registrar Proveedor</h5>

</div>

<div class="card-body">

<form action="guardar.php" method="POST" id="formProveedor">

<div class="row">

<div class="col-md-6 mb-3">

<label><i class="bi bi-person"></i> Nombre</label>

<input type="text" name="nombre" class="form-control" required>

</div>

<div class="col-md-6 mb-3">

<label><i class="bi bi-telephone"></i> Teléfono</label>

<input type="text" name="telefono" class="form-control">

</div>

<div class="col-md-6 mb-3">

<label><i class="bi bi-truck"></i> Vehículo</label>

<input type="text" name="vehiculo" class="form-control">

</div>

<div class="col-md-6 mb-3">

<label><i class="bi bi-credit-card"></i> Placa</label>

<input type="text" name="placa" class="form-control">

</div>

</div>

<button class="btn btn-success">
<i class="bi bi-save"></i> Guardar Proveedor
</button>

<a href="index.php" class="btn btn-secondary">
<i class="bi bi-arrow-left"></i> Volver
</a>

</form>

</div>

</div>

</div>

<script>

document.getElementById("formProveedor").addEventListener("submit",function(e){

let nombre=document.querySelector("[name='nombre']").value.trim();

if(nombre.length < 4){

alert("El nombre del proveedor debe tener al menos 4 caracteres");
e.preventDefault();

}

});

</script>
<?php
include("../layout/header.php");
include("../layout/sidebar.php");
?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-primary text-white">

<h5><i class="bi bi-person-plus"></i> Registrar Conductor</h5>

</div>

<div class="card-body">

<form action="guardar.php" method="POST" id="formConductor">

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

<label><i class="bi bi-card-text"></i> Licencia</label>

<input type="text" name="licencia" class="form-control" required>

</div>

<div class="col-md-6 mb-3">

<label><i class="bi bi-check-circle"></i> Estado</label>

<select name="estado" class="form-control">

<option value="activo">Activo</option>
<option value="descanso">Descanso</option>
<option value="inactivo">Inactivo</option>

</select>

</div>

</div>

<button class="btn btn-success">

<i class="bi bi-save"></i> Guardar Conductor

</button>

<a href="index.php" class="btn btn-secondary">

<i class="bi bi-arrow-left"></i> Volver

</a>

</form>

</div>

</div>

</div>

<script>

document.getElementById("formConductor").addEventListener("submit",function(e){

let nombre=document.querySelector("[name='nombre']").value.trim();
let licencia=document.querySelector("[name='licencia']").value.trim();

if(nombre.length < 5){

alert("El nombre debe tener al menos 5 caracteres");
e.preventDefault();

}

if(licencia === ""){

alert("Debe ingresar la licencia de conducir");
e.preventDefault();

}

});

</script>
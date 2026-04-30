<?php
include("../layout/header.php");
include("../layout/sidebar.php");
?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-primary text-white">

<h5><i class="bi bi-truck"></i> Registrar Vehículo</h5>

</div>

<div class="card-body">

<form action="guardar.php" method="POST" id="formVehiculo">

<div class="row">

<div class="col-md-6 mb-3">

<label><i class="bi bi-credit-card"></i> Placa</label>

<input type="text" name="placa" class="form-control" required>

</div>

<div class="col-md-6 mb-3">

<label><i class="bi bi-truck-front"></i> Modelo</label>

<input type="text" name="modelo" class="form-control">

</div>

<div class="col-md-6 mb-3">

<label><i class="bi bi-box"></i> Tipo</label>

<input type="text" name="tipo" class="form-control">

</div>

<div class="col-md-6 mb-3">

<label><i class="bi bi-speedometer"></i> Capacidad</label>

<input type="text" name="capacidad" class="form-control">

</div>

<div class="col-md-6 mb-3">

<label><i class="bi bi-check-circle"></i> Estado</label>

<select name="estado" class="form-control">

<option value="activo">Activo</option>
<option value="mantenimiento">Mantenimiento</option>
<option value="inactivo">Inactivo</option>

</select>

</div>

</div>

<button class="btn btn-success">

<i class="bi bi-save"></i> Guardar Vehículo

</button>

<a href="index.php" class="btn btn-secondary">

<i class="bi bi-arrow-left"></i> Volver

</a>

</form>

</div>

</div>

</div>


<script>

document.getElementById("formVehiculo").addEventListener("submit", function(e){

let placa = document.querySelector("[name='placa']").value.trim();
let capacidad = document.querySelector("[name='capacidad']").value.trim();

if(placa === ""){
alert("Debe ingresar la placa del vehículo");
e.preventDefault();
return;
}

if(placa.length < 6){
alert("La placa debe tener al menos 6 caracteres");
e.preventDefault();
return;
}

if(capacidad !== "" && isNaN(capacidad)){
alert("La capacidad debe ser numérica");
e.preventDefault();
return;
}

});

</script>
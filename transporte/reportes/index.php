<?php
include("../layout/header.php");
include("../layout/sidebar.php");
?>

<div class="content">

<h3 class="mb-4">
<i class="bi bi-bar-chart"></i> Módulo de Reportes
</h3>

<div class="row">

<!-- REPORTE SERVICIOS -->

<div class="col-md-3">
<div class="card shadow border-0">
<div class="card-body text-center">

<i class="bi bi-truck fs-1 text-primary"></i>

<h5 class="mt-3">Servicios</h5>

<p class="text-muted">
Lista completa de servicios registrados
</p>

<a href="servicios.php" class="btn btn-primary">
Ver Reporte
</a>

</div>
</div>
</div>


<!-- REPORTE FACTURACION -->

<div class="col-md-3">
<div class="card shadow border-0">
<div class="card-body text-center">

<i class="bi bi-receipt fs-1 text-success"></i>

<h5 class="mt-3">Facturación</h5>

<p class="text-muted">
Facturas y boletas generadas
</p>

<a href="facturacion.php" class="btn btn-success">
Ver Reporte
</a>

</div>
</div>
</div>


<!-- REPORTE UTILIDAD -->

<div class="col-md-3">
<div class="card shadow border-0">
<div class="card-body text-center">

<i class="bi bi-cash-stack fs-1 text-warning"></i>

<h5 class="mt-3">Utilidad</h5>

<p class="text-muted">
Rentabilidad de los servicios
</p>

<a href="utilidad.php" class="btn btn-warning">
Ver Reporte
</a>

</div>
</div>
</div>


<!-- REPORTE CLIENTES -->

<div class="col-md-3">
<div class="card shadow border-0">
<div class="card-body text-center">

<i class="bi bi-people fs-1 text-dark"></i>

<h5 class="mt-3">Clientes</h5>

<p class="text-muted">
Facturación por cliente
</p>

<a href="clientes.php" class="btn btn-dark">
Ver Reporte
</a>

</div>
</div>
</div>


</div>

</div>
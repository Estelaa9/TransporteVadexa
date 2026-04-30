<?php
include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

/* MES ACTUAL */

$mes=date("m");
$anio=date("Y");

/* SERVICIOS DEL MES */

$sql="SELECT COUNT(*) as total 
FROM servicios 
WHERE MONTH(fecha_servicio)='$mes' 
AND YEAR(fecha_servicio)='$anio'";

$res=mysqli_query($conn,$sql);
$row=mysqli_fetch_assoc($res);

$servicios_mes=$row['total'];


/* FACTURACION DEL MES */

$sql="SELECT IFNULL(SUM(precio_cliente),0) as total 
FROM servicios
WHERE MONTH(fecha_servicio)='$mes'
AND YEAR(fecha_servicio)='$anio'";

$res=mysqli_query($conn,$sql);
$row=mysqli_fetch_assoc($res);

$facturacion=$row['total'];


/* IGV GENERADO */

$sql="SELECT IFNULL(SUM(precio_cliente-(precio_cliente/1.18)),0) as igv
FROM servicios
WHERE tipo_comprobante!='SIN_COMPROBANTE'
AND MONTH(fecha_servicio)='$mes'
AND YEAR(fecha_servicio)='$anio'";

$res=mysqli_query($conn,$sql);
$row=mysqli_fetch_assoc($res);

$igv=$row['igv'];


/* GASTOS OPERATIVOS */

$sql="SELECT IFNULL(SUM(monto),0) as total 
FROM gastos_operativos
WHERE MONTH(fecha)='$mes'
AND YEAR(fecha)='$anio'";

$res=mysqli_query($conn,$sql);
$row=mysqli_fetch_assoc($res);

$gastos_operativos=$row['total'];


/* GASTOS ADMINISTRATIVOS */

$sql="SELECT IFNULL(SUM(monto),0) as total 
FROM gastos_administrativos
WHERE MONTH(fecha)='$mes'
AND YEAR(fecha)='$anio'";

$res=mysqli_query($conn,$sql);
$row=mysqli_fetch_assoc($res);

$gastos_admin=$row['total'];


/* UTILIDAD */

$utilidad=$facturacion-($gastos_operativos+$gastos_admin);

?>

<div class="content">

<h3 class="mb-4">
<i class="bi bi-speedometer2"></i> Dashboard - VADEXSA LOGISTIC
</h3>

<div class="row">

<div class="col-md-3">
<div class="card bg-primary text-white shadow">
<div class="card-body">
<h6>Servicios del Mes</h6>
<h3><?php echo $servicios_mes; ?></h3>
</div>
</div>
</div>

<div class="col-md-3">
<div class="card bg-success text-white shadow">
<div class="card-body">
<h6>Facturación del Mes</h6>
<h3>S/ <?php echo number_format($facturacion,2); ?></h3>
</div>
</div>
</div>

<div class="col-md-3">
<div class="card bg-warning text-dark shadow">
<div class="card-body">
<h6>IGV Generado</h6>
<h3>S/ <?php echo number_format($igv,2); ?></h3>
</div>
</div>
</div>

<div class="col-md-3">
<div class="card bg-dark text-white shadow">
<div class="card-body">
<h6>Utilidad del Mes</h6>
<h3>S/ <?php echo number_format($utilidad,2); ?></h3>
</div>
</div>
</div>

</div>

<br>

<div class="row">

<div class="col-md-6">
<div class="card shadow">
<div class="card-header bg-danger text-white">
Gastos Operativos
</div>
<div class="card-body">
<h4>S/ <?php echo number_format($gastos_operativos,2); ?></h4>
</div>
</div>
</div>

<div class="col-md-6">
<div class="card shadow">
<div class="card-header bg-secondary text-white">
Gastos Administrativos
</div>
<div class="card-body">
<h4>S/ <?php echo number_format($gastos_admin,2); ?></h4>
</div>
</div>
</div>

</div>

</div>
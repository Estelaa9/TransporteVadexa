<?php

include("../config/conexion.php");

$id=$_POST['id'];
$fecha=$_POST['fecha'];
$vehiculo=$_POST['vehiculo_id'];
$tipo=$_POST['tipo_gasto'];
$monto=$_POST['monto'];
$descripcion=$_POST['descripcion'];

$sql="UPDATE gastos_operativos SET

fecha='$fecha',
vehiculo_id='$vehiculo',
tipo_gasto='$tipo',
monto='$monto',
descripcion='$descripcion'

WHERE id='$id'";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
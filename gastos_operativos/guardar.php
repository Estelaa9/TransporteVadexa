<?php

include("../config/conexion.php");

$fecha=$_POST['fecha'];
$vehiculo=$_POST['vehiculo_id'];
$tipo=$_POST['tipo_gasto'];
$descripcion=$_POST['descripcion'];
$monto=$_POST['monto'];

$sql="INSERT INTO gastos_operativos
(vehiculo_id,tipo_gasto,descripcion,monto,fecha)

VALUES

('$vehiculo','$tipo','$descripcion','$monto','$fecha')";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
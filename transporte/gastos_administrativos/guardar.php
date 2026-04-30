<?php

include("../config/conexion.php");

$fecha=$_POST['fecha'];
$tipo=$_POST['tipo_gasto'];
$monto=$_POST['monto'];
$descripcion=$_POST['descripcion'];

$sql="INSERT INTO gastos_administrativos
(tipo_gasto,descripcion,monto,fecha)

VALUES

('$tipo','$descripcion','$monto','$fecha')";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
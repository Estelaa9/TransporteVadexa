<?php

include("../config/conexion.php");

$id=$_POST['id'];
$fecha=$_POST['fecha'];
$tipo=$_POST['tipo_gasto'];
$monto=$_POST['monto'];
$descripcion=$_POST['descripcion'];

$sql="UPDATE gastos_administrativos SET

tipo_gasto='$tipo',
descripcion='$descripcion',
monto='$monto',
fecha='$fecha'

WHERE id='$id'";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
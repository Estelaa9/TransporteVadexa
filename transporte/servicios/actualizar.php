<?php

include("../config/conexion.php");

$id=$_POST['id'];
$origen=$_POST['origen'];
$destino=$_POST['destino'];
$monto=$_POST['precio_cliente'];

$sql="UPDATE servicios SET

origen='$origen',
destino='$destino',
precio_cliente='$monto'

WHERE id=$id";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
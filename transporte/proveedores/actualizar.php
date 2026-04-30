<?php

include("../config/conexion.php");

$id=$_POST['id'];
$nombre=$_POST['nombre'];
$telefono=$_POST['telefono'];
$vehiculo=$_POST['vehiculo'];
$placa=$_POST['placa'];

$sql="UPDATE proveedores SET

nombre='$nombre',
telefono='$telefono',
vehiculo='$vehiculo',
placa='$placa'

WHERE id=$id";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
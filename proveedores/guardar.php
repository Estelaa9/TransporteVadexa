<?php

include("../config/conexion.php");

$nombre=$_POST['nombre'];
$telefono=$_POST['telefono'];
$vehiculo=$_POST['vehiculo'];
$placa=$_POST['placa'];

$sql="INSERT INTO proveedores
(nombre,telefono,vehiculo,placa)
VALUES
('$nombre','$telefono','$vehiculo','$placa')";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
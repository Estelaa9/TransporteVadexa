<?php

include("../config/conexion.php");

$nombre=$_POST['nombre'];
$telefono=$_POST['telefono'];
$licencia=$_POST['licencia'];
$estado=$_POST['estado'];

$sql="INSERT INTO conductores
(nombre,telefono,licencia,estado)
VALUES
('$nombre','$telefono','$licencia','$estado')";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
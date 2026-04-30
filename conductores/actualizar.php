<?php

include("../config/conexion.php");

$id=$_POST['id'];
$nombre=$_POST['nombre'];
$telefono=$_POST['telefono'];
$licencia=$_POST['licencia'];
$estado=$_POST['estado'];

$sql="UPDATE conductores SET

nombre='$nombre',
telefono='$telefono',
licencia='$licencia',
estado='$estado'

WHERE id=$id";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
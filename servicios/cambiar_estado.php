<?php

include("../config/conexion.php");

$id=$_GET['id'];
$estado=$_GET['estado'];

$sql="UPDATE servicios 
SET estado_servicio='$estado'
WHERE id='$id'";

mysqli_query($conn,$sql);

header("Location:programacion.php");

?>
<?php

include("../config/conexion.php");

$id=$_POST['id'];
$placa=$_POST['placa'];
$modelo=$_POST['modelo'];
$tipo=$_POST['tipo'];
$capacidad=$_POST['capacidad'];
$estado=$_POST['estado'];

$sql="UPDATE vehiculos SET

placa='$placa',
modelo='$modelo',
tipo='$tipo',
capacidad='$capacidad',
estado='$estado'

WHERE id=$id";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
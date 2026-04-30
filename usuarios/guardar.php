<?php

include("../config/conexion.php");

$nombre=$_POST['nombre'];
$usuario=$_POST['usuario'];
$password=md5($_POST['password']);
$rol=$_POST['rol'];

$sql="INSERT INTO usuarios
(nombre,usuario,password,rol,estado)

VALUES
('$nombre','$usuario','$password','$rol','activo')";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
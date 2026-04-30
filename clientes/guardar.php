<?php

include("../config/conexion.php");

$nombre = $_POST['nombre'];
$documento = $_POST['documento'];
$telefono = $_POST['telefono'];
$email = $_POST['email'];
$direccion = $_POST['direccion'];
$tipo_cliente = $_POST['tipo_cliente'];

$sql="INSERT INTO clientes
(nombre,documento,telefono,email,direccion,tipo_cliente)

VALUES

('$nombre','$documento','$telefono','$email','$direccion','$tipo_cliente')";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
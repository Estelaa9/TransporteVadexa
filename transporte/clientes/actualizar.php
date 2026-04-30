<?php

include("../config/conexion.php");

$id = $_POST['id'];
$nombre = $_POST['nombre'];
$documento = $_POST['documento'];
$telefono = $_POST['telefono'];
$email = $_POST['email'];
$direccion = $_POST['direccion'];
$tipo_cliente = $_POST['tipo_cliente'];

$sql="UPDATE clientes SET

nombre='$nombre',
documento='$documento',
telefono='$telefono',
email='$email',
direccion='$direccion',
tipo_cliente='$tipo_cliente'

WHERE id='$id'";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
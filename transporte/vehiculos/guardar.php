<?php

include("../config/conexion.php");

$placa=$_POST['placa'];

if(strlen($placa)<6){

echo "La placa no es válida";
exit();

}

$modelo=$_POST['modelo'];
$tipo=$_POST['tipo'];
$capacidad=$_POST['capacidad'];
$estado=$_POST['estado'];

$sql="INSERT INTO vehiculos
(placa,modelo,tipo,capacidad,estado)
VALUES
('$placa','$modelo','$tipo','$capacidad','$estado')";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
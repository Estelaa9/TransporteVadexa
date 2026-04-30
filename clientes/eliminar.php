<?php

include("../config/conexion.php");

$id = $_GET['id'];

$sql="DELETE FROM clientes WHERE id='$id'";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
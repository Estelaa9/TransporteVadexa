<?php

include("../config/conexion.php");

$id=$_GET['id'];

$sql="DELETE FROM gastos_administrativos WHERE id='$id'";

mysqli_query($conn,$sql);

header("Location:index.php");

?>
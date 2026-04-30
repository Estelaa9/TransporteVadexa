<?php

session_start();
include("../config/conexion.php");

$password=md5($_POST['password']);
$usuario=$_SESSION['usuario'];

$sql="UPDATE usuarios
SET password='$password'
WHERE usuario='$usuario'";

mysqli_query($conn,$sql);

echo "<script>
alert('Contraseña actualizada');
window.location='../dashboard';
</script>";

?>
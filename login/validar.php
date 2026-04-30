<?php

session_start();
include("config/conexion.php");

$usuario=$_POST['usuario'];
$password=md5($_POST['password']);

$sql="SELECT * FROM usuarios
WHERE usuario='$usuario'
AND password='$password'
AND estado='activo'";

$result=mysqli_query($conn,$sql);

if(mysqli_num_rows($result)>0){

$row=mysqli_fetch_assoc($result);

$_SESSION['usuario']=$row['usuario'];
$_SESSION['nombre']=$row['nombre'];
$_SESSION['rol']=$row['rol'];

header("Location:../dashboard/index.php");

}else{

echo "<script>

alert('Usuario o contraseña incorrectos');
window.location='../login.php';

</script>";

}

?>
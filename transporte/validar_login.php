<?php

session_start();
include("config/conexion.php");

$usuario = $_POST['usuario'];
$password = md5($_POST['password']);

$sql = "SELECT * FROM usuarios 
        WHERE usuario='$usuario' 
        AND password='$password'";

$result = mysqli_query($conn,$sql);

if(mysqli_num_rows($result) == 1){

    $row = mysqli_fetch_assoc($result);

    $_SESSION['usuario'] = $row['usuario'];
    $_SESSION['rol'] = $row['rol'];

    header("Location: dashboard/index.php");

}else{

    echo "Usuario o contraseña incorrectos";

}

?>
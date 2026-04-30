<?php

$host = "localhost";
$user = "root";
$pass = "";
$db = "transporte_db";

$conn = mysqli_connect($host,$user,$pass,$db);

if(!$conn){
    die("Error de conexión a la base de datos");
}

?>
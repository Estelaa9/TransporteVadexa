<?php
// conductores/disponibles.php - Conductores disponibles para una fecha específica
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$fecha = $_GET['fecha'] ?? date('Y-m-d');
$f_esc = mysqli_real_escape_string($conn, $fecha);

$sql = "SELECT * FROM conductores 
        WHERE estado = 'activo'
        AND id NOT IN (
            SELECT conductor_id FROM servicios 
            WHERE fecha_servicio = '$f_esc' 
            AND estado_servicio != 'cancelado'
        )
        ORDER BY nombre ASC";

$res = mysqli_query($conn, $sql);
$disponibles = [];
while ($row = mysqli_fetch_assoc($res)) {
    $disponibles[] = $row;
}

json_response([
    "success" => true,
    "fecha" => $fecha,
    "total" => count($disponibles),
    "data" => $disponibles
]);
?>

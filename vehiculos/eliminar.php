<?php
// vehiculos/eliminar.php - Eliminar vehículo
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();
$id = (int)($_GET['id'] ?? $data['id'] ?? 0);

if (!$id) {
    json_response(["success" => false, "error" => "ID no especificado."], 400);
}

// Verificar si tiene servicios asociados
$chk = mysqli_query($conn, "SELECT id FROM servicios WHERE vehiculo_id = $id LIMIT 1");
if (mysqli_num_rows($chk) > 0) {
    json_response(["success" => false, "error" => "No se puede eliminar el vehículo porque tiene servicios asociados en el historial."], 409);
}

$sql = "DELETE FROM vehiculos WHERE id = $id";
if (mysqli_query($conn, $sql)) {
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || $_SERVER['REQUEST_METHOD'] === 'DELETE' || $_SERVER['REQUEST_METHOD'] === 'POST') {
        json_response(["success" => true, "message" => "Vehículo eliminado correctamente."]);
    }
    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al eliminar: " . mysqli_error($conn)], 500);
}
?>
<?php
// clientes/actualizar.php - Modificar datos de cliente
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();
$id = (int)($data['id'] ?? 0);

if (!$id) {
    json_response(["success" => false, "error" => "ID no especificado."], 400);
}

$nombre = mysqli_real_escape_string($conn, trim($data['nombre'] ?? ''));
$documento = mysqli_real_escape_string($conn, trim($data['documento'] ?? ''));
$telefono = mysqli_real_escape_string($conn, trim($data['telefono'] ?? ''));
$email = mysqli_real_escape_string($conn, trim($data['email'] ?? ''));
$direccion = mysqli_real_escape_string($conn, trim($data['direccion'] ?? ''));
$tipo_cliente = mysqli_real_escape_string($conn, trim($data['tipo_cliente'] ?? 'Empresa'));

if (empty($nombre)) {
    json_response(["success" => false, "error" => "El nombre es obligatorio."], 400);
}

$sql = "UPDATE clientes SET
            nombre = '$nombre',
            documento = '$documento',
            telefono = '$telefono',
            email = '$email',
            direccion = '$direccion',
            tipo_cliente = '$tipo_cliente'
        WHERE id = $id";

if (mysqli_query($conn, $sql)) {
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Cliente #{$id} actualizado correctamente.",
            "id" => $id
        ]);
    }
    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al actualizar: " . mysqli_error($conn)], 500);
}
?>
<?php
// vehiculos/index.php - Listado de vehículos y consulta
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$action = $_GET['action'] ?? 'list';
$data = get_request_data();

if ($action === 'get' || isset($_GET['id'])) {
    $id = (int)($_GET['id'] ?? $data['id'] ?? 0);
    $sql = "SELECT * FROM vehiculos WHERE id = $id LIMIT 1";
    $res = mysqli_query($conn, $sql);
    if ($row = mysqli_fetch_assoc($res)) {
        json_response(["success" => true, "data" => $row]);
    } else {
        json_response(["success" => false, "error" => "Vehículo no encontrado."], 404);
    }
}

$sql = "SELECT * FROM vehiculos ORDER BY id DESC";
$result = mysqli_query($conn, $sql);
$vehiculos = [];
while ($row = mysqli_fetch_assoc($result)) {
    $vehiculos[] = $row;
}

if (isset($_GET['json']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) || $action === 'list') {
    json_response([
        "success" => true,
        "total" => count($vehiculos),
        "data" => $vehiculos
    ]);
}

include("../layout/header.php");
include("../layout/sidebar.php");
?>
<div class="content">
<div class="card shadow">
<div class="card-header bg-primary text-white">
<h5><i class="bi bi-truck"></i> Flota de Vehículos</h5>
<a href="crear.php" class="btn btn-light btn-sm float-end"><i class="bi bi-plus-circle"></i> Nuevo Vehículo</a>
</div>
<div class="card-body">
<table id="tablaVehiculos" class="table table-striped table-bordered">
<thead class="table-primary">
<tr>
<th>ID</th><th>Placa</th><th>Modelo</th><th>Tipo</th><th>Capacidad</th><th>Estado</th><th>Acciones</th>
</tr>
</thead>
<tbody>
<?php foreach($vehiculos as $v){ ?>
<tr>
<td><?php echo $v['id']; ?></td>
<td><?php echo $v['placa']; ?></td>
<td><?php echo $v['modelo']; ?></td>
<td><?php echo $v['tipo']; ?></td>
<td><?php echo $v['capacidad']; ?></td>
<td><?php echo $v['estado']; ?></td>
<td>
<a href="editar.php?id=<?php echo $v['id']; ?>" class="btn btn-warning btn-sm"><i class="bi bi-pencil"></i></a>
<a href="eliminar.php?id=<?php echo $v['id']; ?>" class="btn btn-danger btn-sm"><i class="bi bi-trash"></i></a>
</td>
</tr>
<?php } ?>
</tbody>
</table>
</div>
</div>
</div>
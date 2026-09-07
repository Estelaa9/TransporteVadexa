<?php
// conductores/index.php - Listado de conductores y consulta
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$action = $_GET['action'] ?? 'list';
$data = get_request_data();

if ($action === 'get' || isset($_GET['id'])) {
    $id = (int)($_GET['id'] ?? $data['id'] ?? 0);
    $sql = "SELECT * FROM conductores WHERE id = $id LIMIT 1";
    $res = mysqli_query($conn, $sql);
    if ($row = mysqli_fetch_assoc($res)) {
        json_response(["success" => true, "data" => $row]);
    } else {
        json_response(["success" => false, "error" => "Conductor no encontrado."], 404);
    }
}

$sql = "SELECT * FROM conductores ORDER BY id DESC";
$result = mysqli_query($conn, $sql);
$conductores = [];
while ($row = mysqli_fetch_assoc($result)) {
    $conductores[] = $row;
}

if (isset($_GET['json']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) || $action === 'list') {
    json_response([
        "success" => true,
        "total" => count($conductores),
        "data" => $conductores
    ]);
}

include("../layout/header.php");
include("../layout/sidebar.php");
?>
<div class="content">
<div class="card shadow">
<div class="card-header bg-primary text-white">
<h5><i class="bi bi-person-badge"></i> Conductores</h5>
<a href="crear.php" class="btn btn-light btn-sm float-end"><i class="bi bi-person-plus"></i> Nuevo Conductor</a>
</div>
<div class="card-body">
<table id="tablaConductores" class="table table-striped table-bordered">
<thead class="table-primary">
<tr>
<th>ID</th><th>Nombre</th><th>Licencia</th><th>Teléfono</th><th>Dirección</th><th>Estado</th><th>Acciones</th>
</tr>
</thead>
<tbody>
<?php foreach($conductores as $c){ ?>
<tr>
<td><?php echo $c['id']; ?></td>
<td><?php echo $c['nombre']; ?></td>
<td><?php echo $c['licencia']; ?></td>
<td><?php echo $c['telefono']; ?></td>
<td><?php echo $c['direccion']; ?></td>
<td><?php echo $c['estado']; ?></td>
<td>
<a href="editar.php?id=<?php echo $c['id']; ?>" class="btn btn-warning btn-sm"><i class="bi bi-pencil"></i></a>
<a href="eliminar.php?id=<?php echo $c['id']; ?>" class="btn btn-danger btn-sm"><i class="bi bi-trash"></i></a>
</td>
</tr>
<?php } ?>
</tbody>
</table>
</div>
</div>
</div>
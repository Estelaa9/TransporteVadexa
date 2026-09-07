<?php
// proveedores/index.php - Listado de proveedores tercerizados
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$action = $_GET['action'] ?? 'list';
$data = get_request_data();

if ($action === 'get' || isset($_GET['id'])) {
    $id = (int)($_GET['id'] ?? $data['id'] ?? 0);
    $sql = "SELECT * FROM proveedores WHERE id = $id LIMIT 1";
    $res = mysqli_query($conn, $sql);
    if ($row = mysqli_fetch_assoc($res)) {
        json_response(["success" => true, "data" => $row]);
    } else {
        json_response(["success" => false, "error" => "Proveedor no encontrado."], 404);
    }
}

$sql = "SELECT * FROM proveedores ORDER BY id DESC";
$result = mysqli_query($conn, $sql);
$proveedores = [];
while ($row = mysqli_fetch_assoc($result)) {
    $proveedores[] = $row;
}

if (isset($_GET['json']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) || $action === 'list') {
    json_response([
        "success" => true,
        "total" => count($proveedores),
        "data" => $proveedores
    ]);
}

include("../layout/header.php");
include("../layout/sidebar.php");
?>
<div class="content">
<div class="card shadow">
<div class="card-header bg-primary text-white">
<h5><i class="bi bi-box-seam"></i> Proveedores</h5>
<a href="crear.php" class="btn btn-light btn-sm float-end"><i class="bi bi-plus-circle"></i> Nuevo Proveedor</a>
</div>
<div class="card-body">
<table id="tablaProveedores" class="table table-striped table-bordered">
<thead class="table-primary">
<tr>
<th>ID</th><th>Nombre</th><th>Teléfono</th><th>Vehículo</th><th>Placa</th><th>Acciones</th>
</tr>
</thead>
<tbody>
<?php foreach($proveedores as $p){ ?>
<tr>
<td><?php echo $p['id']; ?></td>
<td><?php echo $p['nombre']; ?></td>
<td><?php echo $p['telefono']; ?></td>
<td><?php echo $p['vehiculo']; ?></td>
<td><?php echo $p['placa']; ?></td>
<td>
<a href="editar.php?id=<?php echo $p['id']; ?>" class="btn btn-warning btn-sm"><i class="bi bi-pencil"></i></a>
<a href="eliminar.php?id=<?php echo $p['id']; ?>" class="btn btn-danger btn-sm"><i class="bi bi-trash"></i></a>
</td>
</tr>
<?php } ?>
</tbody>
</table>
</div>
</div>
</div>
<?php
// clientes/index.php - Listado de clientes y consulta
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$action = $_GET['action'] ?? 'list';
$data = get_request_data();

if ($action === 'get' || isset($_GET['id'])) {
    $id = (int)($_GET['id'] ?? $data['id'] ?? 0);
    $sql = "SELECT * FROM clientes WHERE id = $id LIMIT 1";
    $res = mysqli_query($conn, $sql);
    if ($row = mysqli_fetch_assoc($res)) {
        json_response(["success" => true, "data" => $row]);
    } else {
        json_response(["success" => false, "error" => "Cliente no encontrado."], 404);
    }
}

$tipo = $_GET['tipo'] ?? '';
$where = "";
if (!empty($tipo)) {
    $tipo_esc = mysqli_real_escape_string($conn, $tipo);
    $where = "WHERE tipo_cliente = '$tipo_esc'";
}

$sql = "SELECT * FROM clientes $where ORDER BY id DESC";
$result = mysqli_query($conn, $sql);
$clientes = [];
while ($row = mysqli_fetch_assoc($result)) {
    $clientes[] = $row;
}

$total_res = mysqli_query($conn, "SELECT COUNT(*) as total FROM clientes");
$total_row = mysqli_fetch_assoc($total_res);
$total_count = (int)($total_row['total'] ?? 0);

if (isset($_GET['json']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) || $action === 'list') {
    json_response([
        "success" => true,
        "total" => $total_count,
        "data" => $clientes
    ]);
}

include("../layout/header.php");
include("../layout/sidebar.php");
?>
<div class="content">
<div class="card shadow">
<div class="card-header bg-primary text-white">
<h5><i class="bi bi-people"></i> Clientes</h5>
<a href="crear.php" class="btn btn-light btn-sm float-end"><i class="bi bi-person-plus"></i> Nuevo Cliente</a>
</div>
<div class="card-body">
<div class="alert alert-info">Total de clientes: <strong><?php echo $total_count; ?></strong></div>
<table id="tabla_clientes" class="table table-striped table-hover table-bordered">
<thead class="table-dark">
<tr>
<th>ID</th>
<th>Nombre</th>
<th>Tipo</th>
<th>Documento</th>
<th>Teléfono</th>
<th>Email</th>
<th>Dirección</th>
<th>Acciones</th>
</tr>
</thead>
<tbody>
<?php foreach($clientes as $row){ ?>
<tr>
<td><?php echo $row['id']; ?></td>
<td><?php echo $row['nombre']; ?></td>
<td><?php echo $row['tipo_cliente']; ?></td>
<td><?php echo $row['documento']; ?></td>
<td><?php echo $row['telefono']; ?></td>
<td><?php echo $row['email']; ?></td>
<td><?php echo $row['direccion']; ?></td>
<td>
<a href="editar.php?id=<?php echo $row['id']; ?>" class="btn btn-warning btn-sm"><i class="bi bi-pencil"></i></a>
<a href="eliminar.php?id=<?php echo $row['id']; ?>" class="btn btn-danger btn-sm"><i class="bi bi-trash"></i></a>
</td>
</tr>
<?php } ?>
</tbody>
</table>
</div>
</div>
</div>
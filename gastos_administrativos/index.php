<?php
// gastos_administrativos/index.php - Listado de gastos administrativos generales
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$action = $_GET['action'] ?? 'list';
$data = get_request_data();

if ($action === 'get' || isset($_GET['id'])) {
    $id = (int)($_GET['id'] ?? $data['id'] ?? 0);
    $sql = "SELECT * FROM gastos_administrativos WHERE id = $id LIMIT 1";
    $res = mysqli_query($conn, $sql);
    if ($row = mysqli_fetch_assoc($res)) {
        json_response(["success" => true, "data" => $row]);
    } else {
        json_response(["success" => false, "error" => "Gasto administrativo no encontrado."], 404);
    }
}

$mes = $_GET['mes'] ?? '';
$anio = $_GET['anio'] ?? '';

$where = [];
if (!empty($mes)) {
    $m_esc = str_pad((int)$mes, 2, "0", STR_PAD_LEFT);
    $where[] = "MONTH(fecha) = '$m_esc'";
}
if (!empty($anio)) {
    $a_esc = (int)$anio;
    $where[] = "YEAR(fecha) = '$a_esc'";
}

$where_sql = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

$sql = "SELECT * FROM gastos_administrativos $where_sql ORDER BY fecha DESC, id DESC";
$result = mysqli_query($conn, $sql);
$gastos = [];
$total_monto = 0.0;
while ($row = mysqli_fetch_assoc($result)) {
    $gastos[] = $row;
    $total_monto += (float)($row['monto'] ?? 0);
}

if (isset($_GET['json']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) || $action === 'list') {
    json_response([
        "success" => true,
        "total" => count($gastos),
        "total_monto" => $total_monto,
        "data" => $gastos
    ]);
}

include("../layout/header.php");
include("../layout/sidebar.php");
?>
<div class="content">
<div class="card shadow">
<div class="card-header bg-secondary text-white">
<h5><i class="bi bi-building"></i> Gastos Administrativos</h5>
<a href="crear.php" class="btn btn-light btn-sm float-end"><i class="bi bi-plus-circle"></i> Nuevo Gasto</a>
</div>
<div class="card-body">
<table id="tablaGastosAdmin" class="table table-striped table-bordered">
<thead class="table-secondary">
<tr>
<th>ID</th><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Monto</th><th>Acciones</th>
</tr>
</thead>
<tbody>
<?php foreach($gastos as $g){ ?>
<tr>
<td><?php echo $g['id']; ?></td>
<td><?php echo $g['fecha']; ?></td>
<td><?php echo $g['tipo']; ?></td>
<td><?php echo $g['descripcion']; ?></td>
<td>S/ <?php echo number_format($g['monto'], 2); ?></td>
<td>
<a href="editar.php?id=<?php echo $g['id']; ?>" class="btn btn-warning btn-sm"><i class="bi bi-pencil"></i></a>
<a href="eliminar.php?id=<?php echo $g['id']; ?>" class="btn btn-danger btn-sm"><i class="bi bi-trash"></i></a>
</td>
</tr>
<?php } ?>
</tbody>
</table>
</div>
</div>
</div>
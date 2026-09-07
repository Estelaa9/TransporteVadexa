<?php
// servicios/index.php - Listado de servicios y endpoint de consulta
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$action = $_GET['action'] ?? 'list';
$data = get_request_data();

// Si se pide un servicio específico por ID
if ($action === 'get' || isset($_GET['id'])) {
    $id = (int)($_GET['id'] ?? $data['id'] ?? 0);
    $sql = "SELECT s.*, c.nombre AS cliente, v.placa, co.nombre AS conductor
            FROM servicios s
            LEFT JOIN clientes c ON s.cliente_id = c.id
            LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
            LEFT JOIN conductores co ON s.conductor_id = co.id
            WHERE s.id = $id LIMIT 1";
    $res = mysqli_query($conn, $sql);
    if ($row = mysqli_fetch_assoc($res)) {
        json_response(["success" => true, "data" => $row]);
    } else {
        json_response(["success" => false, "error" => "Servicio no encontrado."], 404);
    }
}

// Filtros opcionales
$fecha = $_GET['fecha'] ?? null;
$estado = $_GET['estado'] ?? null;
$cliente_id = $_GET['cliente_id'] ?? null;

$where = [];
if (!empty($fecha)) {
    $f_esc = mysqli_real_escape_string($conn, $fecha);
    $where[] = "s.fecha_servicio = '$f_esc'";
}
if (!empty($estado)) {
    $e_esc = mysqli_real_escape_string($conn, $estado);
    $where[] = "s.estado_servicio = '$e_esc'";
}
if (!empty($cliente_id)) {
    $c_esc = (int)$cliente_id;
    $where[] = "s.cliente_id = $c_esc";
}

$where_sql = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";
$order_by = !empty($fecha) ? "ORDER BY s.hora_servicio ASC" : "ORDER BY s.id DESC";

$sql = "SELECT s.*, 
               c.nombre AS cliente,
               v.placa,
               co.nombre AS conductor
        FROM servicios s
        LEFT JOIN clientes c ON s.cliente_id = c.id
        LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
        LEFT JOIN conductores co ON s.conductor_id = co.id
        $where_sql
        $order_by";

$result = mysqli_query($conn, $sql);
$servicios = [];
while ($row = mysqli_fetch_assoc($result)) {
    $servicios[] = $row;
}

// Si la petición es JSON / API
if (isset($_GET['json']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) || $action === 'list') {
    json_response([
        "success" => true,
        "total" => count($servicios),
        "data" => $servicios
    ]);
}

include("../layout/header.php");
include("../layout/sidebar.php");
?>
<div class="content">
<div class="d-flex justify-content-between mb-3">
<h3><i class="bi bi-truck"></i> Servicios</h3>
<a href="crear.php" class="btn btn-primary"><i class="bi bi-plus-circle"></i> Nuevo Servicio</a>
</div>
<div class="card shadow">
<div class="card-body">
<table id="tablaServicios" class="table table-striped table-bordered">
<thead class="table-primary">
<tr>
<th>ID</th>
<th>Fecha</th>
<th>Cliente</th>
<th>Vehículo</th>
<th>Conductor</th>
<th>Origen</th>
<th>Destino</th>
<th>Guía Remitente</th>
<th>Guía Transportista</th>
<th>Factura</th>
<th>Monto</th>
<th>Estado</th>
<th>Acciones</th>
</tr>
</thead>
<tbody>
<?php foreach($servicios as $row){ ?>
<tr>
<td><?php echo $row['id']; ?></td>
<td><?php echo $row['fecha_servicio']; ?></td>
<td><?php echo $row['cliente']; ?></td>
<td><?php echo $row['placa']; ?></td>
<td><?php echo $row['conductor']; ?></td>
<td><?php echo $row['origen']; ?></td>
<td><?php echo $row['destino']; ?></td>
<td><?php echo $row['guia_remitente']; ?></td>
<td><?php echo $row['guia_transportista']; ?></td>
<td><?php echo $row['numero_factura']; ?></td>
<td>S/ <?php echo $row['precio_cliente']; ?></td>
<td><?php echo $row['estado_servicio']; ?></td>
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
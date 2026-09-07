<?php
// servicios/programacion.php - Programación diaria de servicios
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$fecha = isset($_GET['fecha']) && !empty($_GET['fecha']) ? mysqli_real_escape_string($conn, $_GET['fecha']) : date("Y-m-d");

$sql = "SELECT s.*, 
               c.nombre AS cliente,
               v.placa,
               co.nombre AS conductor
        FROM servicios s
        LEFT JOIN clientes c ON s.cliente_id = c.id
        LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
        LEFT JOIN conductores co ON s.conductor_id = co.id
        WHERE s.fecha_servicio='$fecha'
        ORDER BY s.hora_servicio ASC";

$result = mysqli_query($conn, $sql);
$servicios = [];
while ($row = mysqli_fetch_assoc($result)) {
    $servicios[] = $row;
}

// Si la petición es JSON / API
if (isset($_GET['json']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)) {
    json_response([
        "success" => true,
        "fecha" => $fecha,
        "total" => count($servicios),
        "data" => $servicios
    ]);
}

include("../layout/header.php");
include("../layout/sidebar.php");
?>
<div class="content">
<div class="d-flex justify-content-between mb-3">
<h3><i class="bi bi-calendar-event"></i> Programación de Transporte</h3>
</div>
<div class="card shadow">
<div class="card-header bg-dark text-white">
Programación del día <?php echo date("d/m/Y", strtotime($fecha)); ?>
</div>
<div class="card-body">
<form method="GET" class="row mb-3">
<div class="col-md-3">
<input type="date" name="fecha" value="<?php echo $fecha; ?>" class="form-control" onchange="this.form.submit()">
</div>
</form>
<table class="table table-bordered table-striped">
<thead class="table-dark">
<tr>
<th>Hora</th>
<th>Cliente</th>
<th>Vehículo</th>
<th>Conductor</th>
<th>Origen</th>
<th>Destino</th>
<th>Estado</th>
<th>Acción</th>
</tr>
</thead>
<tbody>
<?php foreach($servicios as $row){ ?>
<tr>
<td><?php echo $row['hora_servicio']; ?></td>
<td><?php echo $row['cliente']; ?></td>
<td><?php echo $row['placa']; ?></td>
<td><?php echo $row['conductor']; ?></td>
<td><?php echo $row['origen']; ?></td>
<td><?php echo $row['destino']; ?></td>
<td><?php echo $row['estado_servicio']; ?></td>
<td>
<a href="cambiar_estado.php?id=<?php echo $row['id']; ?>&estado=en_ruta" class="btn btn-warning btn-sm">En Ruta</a>
<a href="cambiar_estado.php?id=<?php echo $row['id']; ?>&estado=finalizado" class="btn btn-success btn-sm">Finalizar</a>
</td>
</tr>
<?php } ?>
</tbody>
</table>
</div>
</div>
</div>
<?php
// dashboard/index.php - Métricas y KPIs del sistema
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$mes = isset($_GET['mes']) && !empty($_GET['mes']) ? str_pad((int)$_GET['mes'], 2, "0", STR_PAD_LEFT) : date("m");
$anio = isset($_GET['anio']) && !empty($_GET['anio']) ? (int)$_GET['anio'] : (int)date("Y");

// 1. Total servicios del mes
$sql = "SELECT COUNT(*) as total FROM servicios WHERE MONTH(fecha_servicio)='$mes' AND YEAR(fecha_servicio)='$anio'";
$res = mysqli_query($conn, $sql);
$row = mysqli_fetch_assoc($res);
$servicios_mes = (int)($row['total'] ?? 0);

// 2. Facturación del mes
$sql = "SELECT IFNULL(SUM(precio_cliente), 0) as total FROM servicios WHERE MONTH(fecha_servicio)='$mes' AND YEAR(fecha_servicio)='$anio'";
$res = mysqli_query($conn, $sql);
$row = mysqli_fetch_assoc($res);
$facturacion = (float)($row['total'] ?? 0);

// 3. IGV generado
$sql = "SELECT IFNULL(SUM(precio_cliente - (precio_cliente / 1.18)), 0) as igv FROM servicios WHERE tipo_comprobante != 'SIN_COMPROBANTE' AND MONTH(fecha_servicio)='$mes' AND YEAR(fecha_servicio)='$anio'";
$res = mysqli_query($conn, $sql);
$row = mysqli_fetch_assoc($res);
$igv = (float)($row['igv'] ?? 0);

// 4. Gastos operativos
$sql = "SELECT IFNULL(SUM(monto), 0) as total FROM gastos_operativos WHERE MONTH(fecha)='$mes' AND YEAR(fecha)='$anio'";
$res = mysqli_query($conn, $sql);
$row = mysqli_fetch_assoc($res);
$gastos_operativos = (float)($row['total'] ?? 0);

// 5. Gastos administrativos
$sql = "SELECT IFNULL(SUM(monto), 0) as total FROM gastos_administrativos WHERE MONTH(fecha)='$mes' AND YEAR(fecha)='$anio'";
$res = mysqli_query($conn, $sql);
$row = mysqli_fetch_assoc($res);
$gastos_admin = (float)($row['total'] ?? 0);

// 6. Utilidad neta
$total_gastos = $gastos_operativos + $gastos_admin;
$utilidad = $facturacion - $total_gastos;

// 7. Servicios recientes (últimos 10)
$sql_recientes = "SELECT s.*, c.nombre AS cliente, v.placa, co.nombre AS conductor
                  FROM servicios s
                  LEFT JOIN clientes c ON s.cliente_id = c.id
                  LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
                  LEFT JOIN conductores co ON s.conductor_id = co.id
                  ORDER BY s.fecha_servicio DESC, s.id DESC
                  LIMIT 10";
$res_recientes = mysqli_query($conn, $sql_recientes);
$servicios_recientes = [];
while ($sr = mysqli_fetch_assoc($res_recientes)) {
    $servicios_recientes[] = $sr;
}

// Si la petición es JSON / API
if (isset($_GET['json']) || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)) {
    json_response([
        "success" => true,
        "data" => [
            "mes" => (int)$mes,
            "anio" => (int)$anio,
            "servicios_mes" => $servicios_mes,
            "facturacion" => $facturacion,
            "igv" => $igv,
            "gastos_operativos" => $gastos_operativos,
            "gastos_admin" => $gastos_admin,
            "total_gastos" => $total_gastos,
            "utilidad" => $utilidad,
            "servicios_recientes" => $servicios_recientes
        ]
    ]);
}

include("../layout/header.php");
include("../layout/sidebar.php");
?>
<div class="content">
<h3 class="mb-4"><i class="bi bi-speedometer2"></i> Dashboard - VADEXSA LOGISTIC</h3>
<div class="row">
    <div class="col-md-3">
        <div class="card bg-primary text-white shadow">
            <div class="card-body"><h6>Servicios del Mes</h6><h3><?php echo $servicios_mes; ?></h3></div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-success text-white shadow">
            <div class="card-body"><h6>Facturación del Mes</h6><h3>S/ <?php echo number_format($facturacion,2); ?></h3></div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-warning text-dark shadow">
            <div class="card-body"><h6>IGV Generado</h6><h3>S/ <?php echo number_format($igv,2); ?></h3></div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-dark text-white shadow">
            <div class="card-body"><h6>Utilidad del Mes</h6><h3>S/ <?php echo number_format($utilidad,2); ?></h3></div>
        </div>
    </div>
</div>
<br>
<div class="row">
    <div class="col-md-6">
        <div class="card shadow">
            <div class="card-header bg-danger text-white">Gastos Operativos</div>
            <div class="card-body"><h4>S/ <?php echo number_format($gastos_operativos,2); ?></h4></div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="card shadow">
            <div class="card-header bg-secondary text-white">Gastos Administrativos</div>
            <div class="card-body"><h4>S/ <?php echo number_format($gastos_admin,2); ?></h4></div>
        </div>
    </div>
</div>
</div>
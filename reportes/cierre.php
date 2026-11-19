<?php
// reportes/cierre.php - Cierre del período: resultado operativo sin IGV, cobros y gastos adicionales.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/lib.php';
require_once __DIR__ . '/../facturas/lib.php';
require_auth();
require_method('GET');
[$desde, $hasta] = periodo_desde_get();
$f = finanzas_periodo($conn, $desde, $hasta);
$adicionales = db_all($conn, 'SELECT * FROM gastos_adicionales WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC, id DESC', 'ss', [$desde, $hasta]);
json_response(['success' => true, 'csrf_token' => csrf_token(), 'data' => $adicionales, 'resumen' => [
    'servicios' => $f['ingresos'],
    'proveedores' => $f['costo_terceros'],
    'operativos' => $f['gastos_operativos'],
    'administrativos' => $f['gastos_administrativos'],
    'adicionales' => $f['gastos_adicionales'],
    'resultado' => $f['resultado_operativo'],
    'cobrado' => cxc_cobrado($conn, $desde, $hasta),
]]);

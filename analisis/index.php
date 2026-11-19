<?php
// analisis/index.php - Reporte integral de gestión del período (Mejora 3).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/lib.php';
require_auth();
require_method('GET');
[$desde, $hasta] = periodo_desde_get();
if ((strtotime($hasta) - strtotime($desde)) / 86400 > 366) json_response(['success' => false, 'error' => 'El período no puede superar un año.'], 422);
$inicio = microtime(true);
$r = analisis_calcular($conn, $desde, $hasta);
$r['tiempo_ms'] = (int)round((microtime(true) - $inicio) * 1000);
auditar('consultar', 'analisis', null, null, ['desde' => $desde, 'hasta' => $hasta, 'tiempo_ms' => $r['tiempo_ms']]);
json_response(['success' => true, 'data' => $r]);

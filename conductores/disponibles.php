<?php
// conductores/disponibles.php - Disponibilidad de conductores para una fecha.
// data  : conductores libres todo el día (compatibilidad).
// todos : cada conductor con su situación: libre, con_viajes (y sus horarios) o no_habilitado (y el motivo).
require_once __DIR__ . '/../config/conexion.php';
require_auth();
require_method('GET');
$fecha = (string)($_GET['fecha'] ?? date('Y-m-d'));
if (!validar_fecha($fecha)) json_response(['success' => false, 'error' => 'Fecha no válida.'], 422);

$conductores = db_all($conn, 'SELECT id, nombre, telefono, licencia, categoria_licencia, licencia_vencimiento, estado FROM conductores ORDER BY nombre');
$viajes = db_all($conn, "SELECT s.id, s.conductor_id, s.hora_servicio, s.hora_fin_estimada, s.estado_servicio, c.nombre AS cliente
    FROM servicios s LEFT JOIN clientes c ON c.id = s.cliente_id
    WHERE s.fecha_servicio = ? AND s.estado_servicio <> 'cancelado' AND s.conductor_id IS NOT NULL ORDER BY s.hora_servicio", 's', [$fecha]);
$porConductor = [];
foreach ($viajes as $v) $porConductor[(int)$v['conductor_id']][] = $v;

$todos = [];
$resumen = ['libres' => 0, 'con_viajes' => 0, 'no_habilitados' => 0];
foreach ($conductores as $c) {
    $estado = strtolower(trim((string)$c['estado']));
    $motivo = null;
    if ($estado !== 'activo') $motivo = $estado === 'descanso' ? 'En descanso' : 'Inactivo';
    elseif ($c['licencia_vencimiento'] && $c['licencia_vencimiento'] < $fecha) $motivo = 'Licencia vencida el ' . date('d/m/Y', strtotime($c['licencia_vencimiento']));
    $suyos = $porConductor[(int)$c['id']] ?? [];
    $situacion = $motivo ? 'no_habilitado' : ($suyos ? 'con_viajes' : 'libre');
    $resumen[$situacion === 'libre' ? 'libres' : ($situacion === 'con_viajes' ? 'con_viajes' : 'no_habilitados')]++;
    $porVencer = !$motivo && $c['licencia_vencimiento'] && $c['licencia_vencimiento'] <= date('Y-m-d', strtotime("$fecha +30 days"));
    $todos[] = $c + [
        'situacion' => $situacion,
        'motivo' => $motivo,
        'licencia_por_vencer' => $porVencer,
        'viajes' => array_map(fn($v) => ['id' => (int)$v['id'], 'inicio' => substr((string)$v['hora_servicio'], 0, 5),
            'fin' => substr((string)$v['hora_fin_estimada'], 0, 5), 'cliente' => $v['cliente'], 'estado' => $v['estado_servicio']], $suyos),
    ];
}
$libres = array_values(array_filter($todos, fn($c) => $c['situacion'] === 'libre'));
json_response(['success' => true, 'fecha' => $fecha, 'total' => count($libres), 'data' => $libres, 'todos' => $todos, 'resumen' => $resumen]);

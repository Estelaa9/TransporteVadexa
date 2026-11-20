<?php
// dashboard/index.php - Indicadores del mes. Montos sin IGV y "resultado operativo" en lugar de "utilidad neta" (NEG-01, NEG-02).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../reportes/lib.php';
require_once __DIR__ . '/../facturas/lib.php';
require_auth();
require_method('GET');

$mes = max(1, min(12, (int)($_GET['mes'] ?? date('n'))));
$anio = max(2000, min(2100, (int)($_GET['anio'] ?? date('Y'))));
$desde = sprintf('%04d-%02d-01', $anio, $mes);
$hasta = date('Y-m-t', strtotime($desde));

$f = finanzas_periodo($conn, $desde, $hasta);
$cxc = cxc_resumen($conn);
$recientes = db_all($conn, 'SELECT s.id, s.fecha_servicio, s.origen, s.destino, s.guia_transportista, s.precio_cliente, s.estado_servicio, s.modalidad,
        c.nombre AS cliente, v.placa, co.nombre AS conductor, p.nombre AS proveedor
    FROM servicios s LEFT JOIN clientes c ON c.id = s.cliente_id LEFT JOIN vehiculos v ON v.id = s.vehiculo_id
    LEFT JOIN conductores co ON co.id = s.conductor_id LEFT JOIN proveedores p ON p.id = s.proveedor_id
    WHERE s.fecha_servicio BETWEEN ? AND ? ORDER BY s.fecha_servicio DESC, s.id DESC LIMIT 10', 'ss', [$desde, $hasta]);

json_response(['success' => true, 'data' => $f + [
    'mes' => $mes, 'anio' => $anio,
    'servicios_mes' => $f['servicios_total'] - $f['servicios_cancelados'],
    'cobrado_mes' => cxc_cobrado($conn, $desde, $hasta),
    'saldo_por_cobrar' => $cxc['saldo'],
    'saldo_vencido' => $cxc['vencido'],
    'servicios_recientes' => $recientes,
]]);

<?php
// reportes/lib.php - Cálculo único de los resultados del período (NEG-01, NEG-02, NEG-05). No es un endpoint.
// Criterios (documentados en docs/CRITERIOS_FINANCIEROS.md):
//  - Ingresos = Σ base imponible (sin IGV) de servicios FINALIZADOS en el período (fecha del servicio).
//  - Costo de terceros = Σ costo_proveedor de esos servicios (registrado sin IGV).
//  - Gastos operativos, administrativos y adicionales por fecha del gasto (registrados sin IGV).
//  - Resultado operativo = ingresos − costo de terceros − gastos. No es utilidad neta: no descuenta impuesto a la renta.
//  - Facturación = comprobantes emitidos (no anulados) por fecha de emisión (NEG-22).
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'lib.php') { http_response_code(404); exit; }

function finanzas_periodo(mysqli $conn, string $desde, string $hasta): array {
    $srv = db_one($conn, "SELECT COUNT(*) AS finalizados, COALESCE(SUM(base_imponible), 0) AS ingresos, COALESCE(SUM(precio_cliente), 0) AS ingresos_con_igv,
            COALESCE(SUM(costo_proveedor), 0) AS costo_terceros
        FROM servicios WHERE estado_servicio = 'finalizado' AND fecha_servicio BETWEEN ? AND ?", 'ss', [$desde, $hasta]);
    $conteo = db_one($conn, "SELECT COUNT(*) AS total, SUM(estado_servicio = 'cancelado') AS cancelados,
            SUM(estado_servicio IN ('programado', 'en_ruta')) AS pendientes
        FROM servicios WHERE fecha_servicio BETWEEN ? AND ?", 'ss', [$desde, $hasta]);
    $suma = fn(string $tabla) => (float)db_value($conn, "SELECT COALESCE(SUM(monto), 0) FROM `$tabla` WHERE fecha BETWEEN ? AND ?", 'ss', [$desde, $hasta]);
    $gOp = $suma('gastos_operativos');
    $gAd = $suma('gastos_administrativos');
    $gAdic = $suma('gastos_adicionales');
    $fac = db_one($conn, "SELECT COUNT(*) AS comprobantes, COALESCE(SUM(base_imponible), 0) AS base, COALESCE(SUM(igv), 0) AS igv, COALESCE(SUM(total), 0) AS total
        FROM comprobantes WHERE tipo IN ('FACTURA', 'BOLETA') AND estado = 'emitida' AND fecha_emision BETWEEN ? AND ?", 'ss', [$desde, $hasta]);

    $ingresos = round((float)$srv['ingresos'], 2);
    $costo = round((float)$srv['costo_terceros'], 2);
    $resultado = round($ingresos - $costo - $gOp - $gAd - $gAdic, 2);
    $total = (int)$conteo['total'];
    return [
        'desde' => $desde, 'hasta' => $hasta,
        'servicios_total' => $total,
        'servicios_finalizados' => (int)$srv['finalizados'],
        'servicios_cancelados' => (int)$conteo['cancelados'],
        'servicios_pendientes' => (int)$conteo['pendientes'],
        'tasa_cancelacion_pct' => $total > 0 ? round((int)$conteo['cancelados'] / $total * 100, 2) : 0.0,
        'ingresos' => $ingresos,
        'ingresos_con_igv' => round((float)$srv['ingresos_con_igv'], 2),
        'costo_terceros' => $costo,
        'margen_bruto' => round($ingresos - $costo, 2),
        'gastos_operativos' => round($gOp, 2),
        'gastos_administrativos' => round($gAd, 2),
        'gastos_adicionales' => round($gAdic, 2),
        'total_gastos' => round($costo + $gOp + $gAd + $gAdic, 2),
        'resultado_operativo' => $resultado,
        'margen_operativo_pct' => $ingresos > 0 ? round($resultado / $ingresos * 100, 2) : 0.0,
        'facturado_comprobantes' => (int)$fac['comprobantes'],
        'facturado_base' => round((float)$fac['base'], 2),
        'facturado_igv' => round((float)$fac['igv'], 2),
        'facturado_total' => round((float)$fac['total'], 2),
    ];
}

/** Lee y valida ?desde=&hasta= (por defecto, el mes actual). */
function periodo_desde_get(): array {
    $desde = (string)($_GET['desde'] ?? date('Y-m-01'));
    $hasta = (string)($_GET['hasta'] ?? date('Y-m-t'));
    if (!validar_fecha($desde) || !validar_fecha($hasta) || $desde > $hasta) json_response(['success' => false, 'error' => 'Rango de fechas no válido.'], 422);
    return [$desde, $hasta];
}

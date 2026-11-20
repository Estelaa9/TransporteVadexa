<?php
// analisis/lib.php - Indicadores de gestión y motor de reglas del diagnóstico (Mejora 3). No es un endpoint.
// El diagnóstico es explicable: cada hallazgo indica la regla, el indicador, su valor y el umbral configurado.
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'lib.php') { http_response_code(404); exit; }
require_once __DIR__ . '/../reportes/lib.php';
require_once __DIR__ . '/../facturas/lib.php';

/** Catálogo de indicadores: clave => [etiqueta, unidad, grupo, ¿mayor es mejor?]. */
function analisis_catalogo(): array {
    return [
        'servicios_finalizados' => ['Servicios finalizados', 'cantidad', 'Operación', true],
        'servicios_vs_anterior_pct' => ['Servicios finalizados vs. período anterior', '%', 'Operación', true],
        'tasa_cancelacion_pct' => ['Tasa de cancelación', '%', 'Operación', false],
        'vehiculos_ociosos' => ['Vehículos activos sin servicios', 'cantidad', 'Operación', false],
        'documentos_vencidos' => ['Documentos de flota vencidos', 'cantidad', 'Operación', false],
        'documentos_por_vencer' => ['Documentos que vencen en 30 días', 'cantidad', 'Operación', false],
        'ingresos' => ['Ingresos sin IGV', 'S/', 'Finanzas', true],
        'ingresos_vs_anterior_pct' => ['Ingresos vs. período anterior', '%', 'Finanzas', true],
        'costo_terceros' => ['Costo de terceros', 'S/', 'Finanzas', false],
        'total_gastos' => ['Costos y gastos totales', 'S/', 'Finanzas', false],
        'resultado_operativo' => ['Resultado operativo', 'S/', 'Finanzas', true],
        'margen_operativo_pct' => ['Margen operativo', '%', 'Finanzas', true],
        'facturado_total' => ['Facturado con IGV (comprobantes emitidos)', 'S/', 'Facturación y cobranza', true],
        'servicios_por_facturar' => ['Servicios finalizados sin comprobante', 'cantidad', 'Facturación y cobranza', false],
        'cobrado' => ['Cobrado en el período', 'S/', 'Facturación y cobranza', true],
        'saldo_por_cobrar' => ['Saldo por cobrar', 'S/', 'Facturación y cobranza', false],
        'saldo_vencido' => ['Saldo vencido', 'S/', 'Facturación y cobranza', false],
        'pct_vencido' => ['Saldo vencido sobre saldo por cobrar', '%', 'Facturación y cobranza', false],
        'ppc_dias' => ['Periodo promedio de cobro', 'días', 'Facturación y cobranza', false],
    ];
}

function analisis_pct(?float $actual, ?float $anterior): ?float {
    if ($actual === null || $anterior === null || $anterior == 0.0) return null;
    return round($actual / $anterior * 100, 2);
}

/** Indicadores de un período. Los de cartera y documentos son una foto a la fecha actual. */
function analisis_indicadores(mysqli $conn, string $desde, string $hasta, bool $conFoto = true): array {
    $f = finanzas_periodo($conn, $desde, $hasta);
    $i = [
        'servicios_finalizados' => (float)$f['servicios_finalizados'],
        'tasa_cancelacion_pct' => (float)$f['tasa_cancelacion_pct'],
        'ingresos' => $f['ingresos'],
        'costo_terceros' => $f['costo_terceros'],
        'total_gastos' => $f['total_gastos'],
        'resultado_operativo' => $f['resultado_operativo'],
        'margen_operativo_pct' => $f['margen_operativo_pct'],
        'facturado_total' => $f['facturado_total'],
        'cobrado' => cxc_cobrado($conn, $desde, $hasta),
        'ppc_dias' => cxc_ppc($conn, $desde, $hasta),
        'vehiculos_ociosos' => (float)db_value($conn, "SELECT COUNT(*) FROM vehiculos v WHERE v.estado = 'activo' AND NOT EXISTS
            (SELECT 1 FROM servicios s WHERE s.vehiculo_id = v.id AND s.estado_servicio <> 'cancelado' AND s.fecha_servicio BETWEEN ? AND ?)", 'ss', [$desde, $hasta]),
        'servicios_por_facturar' => (float)db_value($conn, "SELECT COUNT(*) FROM servicios WHERE estado_servicio = 'finalizado' AND comprobante_id IS NULL
            AND tipo_comprobante <> 'SIN_COMPROBANTE' AND fecha_servicio BETWEEN ? AND ?", 'ss', [$desde, $hasta]),
    ];
    if ($conFoto) {
        $cxc = cxc_resumen($conn);
        $i['saldo_por_cobrar'] = $cxc['saldo'];
        $i['saldo_vencido'] = $cxc['vencido'];
        $i['pct_vencido'] = $cxc['pct_vencido'];
        $i['documentos_vencidos'] = (float)db_value($conn, "SELECT
            (SELECT COUNT(*) FROM conductores WHERE estado = 'activo' AND licencia_vencimiento < CURDATE()) +
            (SELECT COUNT(*) FROM vehiculos WHERE estado = 'activo' AND (soat_vencimiento < CURDATE() OR revision_vencimiento < CURDATE()))");
        $i['documentos_por_vencer'] = (float)db_value($conn, "SELECT
            (SELECT COUNT(*) FROM conductores WHERE estado = 'activo' AND licencia_vencimiento BETWEEN CURDATE() AND CURDATE() + INTERVAL 30 DAY) +
            (SELECT COUNT(*) FROM vehiculos WHERE estado = 'activo' AND (soat_vencimiento BETWEEN CURDATE() AND CURDATE() + INTERVAL 30 DAY
                OR revision_vencimiento BETWEEN CURDATE() AND CURDATE() + INTERVAL 30 DAY))");
    }
    return $i;
}

function analisis_comparar(float $valor, string $operador, float $umbral): bool {
    switch ($operador) {
        case '>': return $valor > $umbral;
        case '>=': return $valor >= $umbral;
        case '<': return $valor < $umbral;
        case '<=': return $valor <= $umbral;
        case '=': return abs($valor - $umbral) < 0.005;
    }
    return false;
}

/** Análisis completo de un período comparado con el período anterior de igual duración. */
function analisis_calcular(mysqli $conn, string $desde, string $hasta): array {
    $dias = (int)((strtotime($hasta) - strtotime($desde)) / 86400) + 1;
    $antHasta = date('Y-m-d', strtotime("$desde -1 day"));
    $antDesde = date('Y-m-d', strtotime("$antHasta -" . ($dias - 1) . ' days'));
    $actual = analisis_indicadores($conn, $desde, $hasta);
    $anterior = analisis_indicadores($conn, $antDesde, $antHasta, false);
    $actual['servicios_vs_anterior_pct'] = analisis_pct($actual['servicios_finalizados'], $anterior['servicios_finalizados']);
    $actual['ingresos_vs_anterior_pct'] = analisis_pct($actual['ingresos'], $anterior['ingresos']);

    $catalogo = analisis_catalogo();
    $indicadores = [];
    foreach ($catalogo as $clave => [$etiqueta, $unidad, $grupo, $mayorMejor]) {
        $valor = $actual[$clave] ?? null;
        $ant = $anterior[$clave] ?? null;
        $variacion = ($valor !== null && $ant !== null && $ant != 0.0 && $unidad !== '%') ? round(($valor - $ant) / abs($ant) * 100, 2) : null;
        $tendencia = null;
        if ($variacion !== null && abs($variacion) >= 0.5) $tendencia = ($variacion > 0) === $mayorMejor ? 'mejora' : 'empeora';
        $indicadores[] = compact('clave', 'etiqueta', 'unidad', 'grupo', 'valor') + ['anterior' => $ant, 'variacion_pct' => $variacion, 'tendencia' => $tendencia];
    }

    $hallazgos = ['critico' => [], 'negativo' => [], 'positivo' => []];
    foreach (db_all($conn, 'SELECT * FROM reglas_diagnostico WHERE activo = 1') as $r) {
        $valor = $actual[$r['indicador']] ?? null;
        if ($valor === null || !analisis_comparar((float)$valor, $r['operador'], (float)$r['umbral'])) continue;
        $item = [
            'regla' => $r['codigo'], 'nombre' => $r['nombre'], 'prioridad' => $r['prioridad'],
            'indicador' => $r['indicador'], 'etiqueta' => $catalogo[$r['indicador']][0] ?? $r['indicador'], 'unidad' => $catalogo[$r['indicador']][1] ?? '',
            'valor' => $valor, 'condicion' => "{$r['operador']} " . (float)$r['umbral'], 'recomendacion' => $r['recomendacion'],
        ];
        if ($r['tipo'] === 'positivo') $hallazgos['positivo'][] = $item;
        elseif ($r['prioridad'] === 'critica') $hallazgos['critico'][] = $item;
        else $hallazgos['negativo'][] = $item;
    }
    $orden = ['critica' => 0, 'alta' => 1, 'media' => 2, 'baja' => 3];
    foreach ($hallazgos as &$lista) usort($lista, fn($a, $b) => $orden[$a['prioridad']] <=> $orden[$b['prioridad']]);
    unset($lista);

    $detalle = [
        'vehiculos_ociosos' => db_all($conn, "SELECT v.id, v.placa, v.modelo, v.tipo FROM vehiculos v WHERE v.estado = 'activo' AND NOT EXISTS
            (SELECT 1 FROM servicios s WHERE s.vehiculo_id = v.id AND s.estado_servicio <> 'cancelado' AND s.fecha_servicio BETWEEN ? AND ?) ORDER BY v.placa LIMIT 100", 'ss', [$desde, $hasta]),
        'documentos' => db_all($conn, "SELECT 'Licencia' AS documento, nombre AS titular, licencia_vencimiento AS vence FROM conductores
                WHERE estado = 'activo' AND licencia_vencimiento <= CURDATE() + INTERVAL 30 DAY
            UNION ALL SELECT 'SOAT', placa, soat_vencimiento FROM vehiculos WHERE estado = 'activo' AND soat_vencimiento <= CURDATE() + INTERVAL 30 DAY
            UNION ALL SELECT 'Revisión técnica', placa, revision_vencimiento FROM vehiculos WHERE estado = 'activo' AND revision_vencimiento <= CURDATE() + INTERVAL 30 DAY
            ORDER BY vence LIMIT 100"),
        'top_clientes' => db_all($conn, "SELECT c.nombre AS cliente, COUNT(*) AS servicios, ROUND(SUM(s.base_imponible), 2) AS ingresos
            FROM servicios s JOIN clientes c ON c.id = s.cliente_id WHERE s.estado_servicio = 'finalizado' AND s.fecha_servicio BETWEEN ? AND ?
            GROUP BY c.id, c.nombre ORDER BY ingresos DESC LIMIT 5", 'ss', [$desde, $hasta]),
        'deudores' => db_all($conn, 'SELECT x.cliente, ROUND(SUM(x.saldo), 2) AS saldo, ROUND(SUM(CASE WHEN x.situacion = \'vencida\' THEN x.saldo ELSE 0 END), 2) AS vencido
            FROM (' . comprobantes_select() . ") x WHERE x.tipo <> 'NOTA_CREDITO' AND x.estado = 'emitida' AND x.saldo > 0
            GROUP BY x.cliente ORDER BY vencido DESC, saldo DESC LIMIT 5"),
    ];
    return [
        'periodo' => ['desde' => $desde, 'hasta' => $hasta, 'dias' => $dias],
        'periodo_anterior' => ['desde' => $antDesde, 'hasta' => $antHasta],
        'indicadores' => $indicadores,
        'hallazgos' => $hallazgos,
        'detalle' => $detalle,
        'generado_en' => date('Y-m-d H:i:s'),
    ];
}

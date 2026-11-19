<?php
// facturas/lib.php - Consultas de comprobantes y cuentas por cobrar compartidas con el análisis integral. No es un endpoint.
// Estados (documento de mejoras, mejora 2):
//   estado del comprobante (se guarda): emitida | anulada
//   estado de pago (se calcula con los pagos): pendiente | parcial | pagada
//   situación de vencimiento (se calcula con las fechas): por_vencer | proxima (≤ 7 días) | vencida
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'lib.php') { http_response_code(404); exit; }

const CXC_DIAS_PROXIMA = 7;
const PAGO_MEDIOS = ['transferencia', 'deposito', 'efectivo', 'yape', 'plin', 'cheque', 'detraccion', 'otro'];

/** SELECT base de comprobantes con pagado, saldo, estado de pago y situación de vencimiento a la fecha $corte. */
function comprobantes_select(): string {
    return "SELECT c.*, CONCAT(c.serie, '-', LPAD(c.numero, 6, '0')) AS numero_completo,
        cl.nombre AS cliente, cl.documento,
        COALESCE(p.pagado, 0) AS pagado, p.ultima_fecha_pago,
        CASE WHEN c.tipo = 'NOTA_CREDITO' OR c.estado = 'anulada' THEN 0 ELSE ROUND(c.total - COALESCE(p.pagado, 0), 2) END AS saldo,
        CASE WHEN c.tipo = 'NOTA_CREDITO' OR c.estado = 'anulada' THEN 'no_aplica'
             WHEN c.total - COALESCE(p.pagado, 0) <= 0.004 THEN 'pagada'
             WHEN COALESCE(p.pagado, 0) > 0 THEN 'parcial' ELSE 'pendiente' END AS estado_pago,
        CASE WHEN c.tipo = 'NOTA_CREDITO' OR c.estado = 'anulada' OR c.total - COALESCE(p.pagado, 0) <= 0.004 THEN NULL
             WHEN c.fecha_vencimiento < CURDATE() THEN 'vencida'
             WHEN c.fecha_vencimiento <= CURDATE() + INTERVAL " . CXC_DIAS_PROXIMA . " DAY THEN 'proxima'
             ELSE 'por_vencer' END AS situacion,
        GREATEST(DATEDIFF(CURDATE(), c.fecha_vencimiento), 0) AS dias_vencido,
        (SELECT GROUP_CONCAT(cs.servicio_id ORDER BY cs.servicio_id) FROM comprobante_servicios cs WHERE cs.comprobante_id = c.id) AS servicios,
        (SELECT CONCAT(r.serie, '-', LPAD(r.numero, 6, '0')) FROM comprobantes r WHERE r.id = c.comprobante_ref_id) AS referencia,
        (SELECT CONCAT(n.serie, '-', LPAD(n.numero, 6, '0')) FROM comprobantes n WHERE n.comprobante_ref_id = c.id AND n.tipo = 'NOTA_CREDITO' LIMIT 1) AS nota_credito
        FROM comprobantes c
        LEFT JOIN clientes cl ON cl.id = c.cliente_id
        LEFT JOIN (SELECT comprobante_id, SUM(monto) AS pagado, MAX(fecha) AS ultima_fecha_pago FROM pagos WHERE estado = 'registrado' GROUP BY comprobante_id) p ON p.comprobante_id = c.id";
}

/** Siguiente número de una serie bajo bloqueo de fila (CON-01, CON-02). Debe llamarse dentro de una transacción. */
function serie_siguiente(mysqli $conn, string $serie, ?int $manual = null): int {
    $row = db_one($conn, 'SELECT ultimo_numero FROM series_comprobante WHERE serie = ? AND activo = 1 FOR UPDATE', 's', [$serie]);
    if (!$row) throw new InvalidArgumentException("La serie $serie no existe o está inactiva.");
    if ($manual !== null) {
        if ($manual <= 0 || $manual > 99999999) throw new InvalidArgumentException('Número de comprobante no válido.');
        if (db_one($conn, 'SELECT id FROM comprobantes WHERE serie = ? AND numero = ?', 'si', [$serie, $manual])) {
            throw new DomainException("El comprobante $serie-" . str_pad((string)$manual, 6, '0', STR_PAD_LEFT) . ' ya está registrado.');
        }
        db_query($conn, 'UPDATE series_comprobante SET ultimo_numero = GREATEST(ultimo_numero, ?) WHERE serie = ?', 'is', [$manual, $serie]);
        return $manual;
    }
    $numero = (int)$row['ultimo_numero'] + 1;
    db_query($conn, 'UPDATE series_comprobante SET ultimo_numero = ? WHERE serie = ?', 'is', [$numero, $serie]);
    return $numero;
}

/** Resumen de cartera a hoy: saldo, vencido, antigüedad y conteos (indicadores de la mejora 2). */
function cxc_resumen(mysqli $conn): array {
    $rows = db_all($conn, 'SELECT * FROM (' . comprobantes_select() . ") x WHERE x.tipo <> 'NOTA_CREDITO' AND x.estado = 'emitida' AND x.saldo > 0");
    $r = ['documentos' => 0, 'saldo' => 0.0, 'vencido' => 0.0, 'documentos_vencidos' => 0, 'proximos' => 0,
        'antiguedad' => ['por_vencer' => 0.0, '1_30' => 0.0, '31_60' => 0.0, '61_90' => 0.0, 'mas_90' => 0.0]];
    foreach ($rows as $c) {
        $saldo = (float)$c['saldo'];
        $r['documentos']++;
        $r['saldo'] += $saldo;
        if ($c['situacion'] === 'proxima') $r['proximos']++;
        if ($c['situacion'] !== 'vencida') { $r['antiguedad']['por_vencer'] += $saldo; continue; }
        $r['vencido'] += $saldo;
        $r['documentos_vencidos']++;
        $d = (int)$c['dias_vencido'];
        $r['antiguedad'][$d <= 30 ? '1_30' : ($d <= 60 ? '31_60' : ($d <= 90 ? '61_90' : 'mas_90'))] += $saldo;
    }
    $r['pct_vencido'] = $r['saldo'] > 0 ? round($r['vencido'] / $r['saldo'] * 100, 2) : 0.0;
    $r['pct_documentos_vencidos'] = $r['documentos'] > 0 ? round($r['documentos_vencidos'] / $r['documentos'] * 100, 2) : 0.0;
    $r['saldo'] = round($r['saldo'], 2);
    $r['vencido'] = round($r['vencido'], 2);
    foreach ($r['antiguedad'] as $k => $v) $r['antiguedad'][$k] = round($v, 2);
    return $r;
}

/**
 * Periodo promedio de cobro: días promedio entre la emisión y el último pago de los comprobantes
 * que quedaron totalmente pagados dentro del período. Devuelve null si no hubo cobros completos.
 */
function cxc_ppc(mysqli $conn, string $desde, string $hasta): ?float {
    $v = db_value($conn, 'SELECT AVG(DATEDIFF(x.ultima_fecha_pago, x.fecha_emision)) FROM (' . comprobantes_select() . ") x
        WHERE x.tipo <> 'NOTA_CREDITO' AND x.estado = 'emitida' AND x.estado_pago = 'pagada' AND x.ultima_fecha_pago BETWEEN ? AND ?", 'ss', [$desde, $hasta]);
    return $v === null ? null : round((float)$v, 1);
}

/** Total cobrado (pagos registrados) en el período. */
function cxc_cobrado(mysqli $conn, string $desde, string $hasta): float {
    return round((float)db_value($conn, "SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE estado = 'registrado' AND fecha BETWEEN ? AND ?", 'ss', [$desde, $hasta]), 2);
}

/** Días de crédito según la forma de pago del servicio o la condición del cliente. */
function dias_credito_por_defecto(?string $formaPago, int $diasCliente): int {
    if ($formaPago && preg_match('/cr[eé]dito\D*(\d+)/iu', $formaPago, $m)) return (int)$m[1];
    return $diasCliente;
}

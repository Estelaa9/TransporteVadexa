<?php
// facturas/cuentas.php - Cuentas por cobrar: saldos, vencimientos, antigüedad, alertas de cobranza e
// indicadores (periodo promedio de cobro, % vencido, monto vencido). Mejora 2.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/lib.php';
require_auth();
require_method('GET');

$hasta = (string)($_GET['hasta'] ?? date('Y-m-d'));
$desde = (string)($_GET['desde'] ?? date('Y-m-d', strtotime('-89 days')));
if (!validar_fecha($desde) || !validar_fecha($hasta) || $desde > $hasta) json_response(['success' => false, 'error' => 'Rango de fechas no válido.'], 422);

$documentos = db_all($conn, 'SELECT * FROM (' . comprobantes_select() . ") x WHERE x.tipo <> 'NOTA_CREDITO' AND x.estado = 'emitida'
    ORDER BY (x.saldo > 0) DESC, x.fecha_vencimiento ASC, x.id DESC LIMIT 5000");
$resumen = cxc_resumen($conn);
$resumen['ppc_dias'] = cxc_ppc($conn, $desde, $hasta);
$resumen['cobrado_periodo'] = cxc_cobrado($conn, $desde, $hasta);

$porCliente = db_all($conn, 'SELECT x.cliente_id, x.cliente, x.documento, COUNT(*) AS documentos, ROUND(SUM(x.saldo), 2) AS saldo,
        ROUND(SUM(CASE WHEN x.situacion = \'vencida\' THEN x.saldo ELSE 0 END), 2) AS vencido, MAX(x.dias_vencido) AS max_dias_vencido
    FROM (' . comprobantes_select() . ") x WHERE x.tipo <> 'NOTA_CREDITO' AND x.estado = 'emitida' AND x.saldo > 0
    GROUP BY x.cliente_id, x.cliente, x.documento ORDER BY vencido DESC, saldo DESC");

// Alertas de cobranza: vencidas (crítica a más de 30 días) y próximas a vencer.
$alertas = [];
foreach ($documentos as $d) {
    if ((float)$d['saldo'] <= 0) continue;
    if ($d['situacion'] === 'vencida') {
        $alertas[] = ['prioridad' => (int)$d['dias_vencido'] > 30 ? 'critica' : 'alta', 'comprobante_id' => (int)$d['id'],
            'texto' => "{$d['numero_completo']} de {$d['cliente']} vencido hace {$d['dias_vencido']} días. Saldo S/ " . number_format((float)$d['saldo'], 2)];
    } elseif ($d['situacion'] === 'proxima') {
        $alertas[] = ['prioridad' => 'media', 'comprobante_id' => (int)$d['id'],
            'texto' => "{$d['numero_completo']} de {$d['cliente']} vence el {$d['fecha_vencimiento']}. Saldo S/ " . number_format((float)$d['saldo'], 2)];
    }
}
$orden = ['critica' => 0, 'alta' => 1, 'media' => 2];
usort($alertas, fn($a, $b) => $orden[$a['prioridad']] <=> $orden[$b['prioridad']]);

$pagos = db_all($conn, "SELECT p.*, CONCAT(c.serie, '-', LPAD(c.numero, 6, '0')) AS comprobante, cl.nombre AS cliente
    FROM pagos p JOIN comprobantes c ON c.id = p.comprobante_id LEFT JOIN clientes cl ON cl.id = c.cliente_id
    WHERE p.fecha BETWEEN ? AND ? ORDER BY p.fecha DESC, p.id DESC LIMIT 2000", 'ss', [$desde, $hasta]);

json_response(['success' => true, 'desde' => $desde, 'hasta' => $hasta, 'resumen' => $resumen, 'data' => $documentos,
    'por_cliente' => $porCliente, 'alertas' => $alertas, 'pagos' => $pagos, 'medios_pago' => PAGO_MEDIOS, 'csrf_token' => csrf_token()]);

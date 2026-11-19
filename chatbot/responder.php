<?php
// chatbot/responder.php - Asistente basado en reglas (UX-01): reconoce palabras clave y consulta la base.
// Cada respuesta respeta los permisos del rol (SEG-11) y se devuelve como texto plano (SEG-13).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../reportes/lib.php';
require_once __DIR__ . '/../facturas/lib.php';
require_auth();
require_method('POST');
if (($_SESSION['rol'] ?? '') === 'cliente') json_response(['success' => false, 'error' => 'El asistente no está disponible en el portal.'], 403);

$pregunta = mb_strtolower(trim((string)(get_request_data()['pregunta'] ?? '')));
if ($pregunta === '' || mb_strlen($pregunta) > 300) json_response(['success' => false, 'error' => 'Escriba una consulta de hasta 300 caracteres.'], 422);
json_response(['success' => true, 'respuesta' => responder_pregunta($conn, $pregunta)]);

function tiene(string $texto, array $palabras): bool {
    foreach ($palabras as $p) if (mb_strpos($texto, $p) !== false) return true;
    return false;
}

function sin_permiso(): string {
    return 'Tu rol no tiene acceso a esa información. Consulta con el administrador si la necesitas.';
}

function responder_pregunta(mysqli $conn, string $p): string {
    $mon = fn($v) => 'S/ ' . number_format((float)$v, 2);
    if (tiene($p, ['hola', 'buenos dias', 'buenos días', 'buenas tardes', 'buenas noches', 'ayuda', 'que puedes'])) {
        return "Hola. Soy el asistente de VADEXSA (basado en reglas). Puedo responder:\n• servicios de hoy\n• estado del servicio #ID\n• facturación del mes\n• gastos del mes\n• resultado del mes\n• cuentas por cobrar\n• conductores disponibles hoy";
    }
    if (tiene($p, ['servicio hoy', 'servicios hoy', 'servicios de hoy', 'hay hoy', 'programados hoy'])) {
        if (!puede('servicios') && !puede('programacion')) return sin_permiso();
        $rows = db_all($conn, 'SELECT s.id, c.nombre AS cliente, s.hora_servicio, s.origen, s.destino, s.estado_servicio, v.placa FROM servicios s
            LEFT JOIN clientes c ON c.id = s.cliente_id LEFT JOIN vehiculos v ON v.id = s.vehiculo_id WHERE s.fecha_servicio = CURDATE() ORDER BY s.hora_servicio');
        if (!$rows) return 'No hay servicios programados para hoy (' . date('d/m/Y') . ').';
        $txt = 'Servicios de hoy, ' . date('d/m/Y') . ' (' . count($rows) . "):\n";
        foreach ($rows as $f) {
            $txt .= "• #{$f['id']} {$f['cliente']}" . ($f['placa'] ? " [{$f['placa']}]" : '') . " — {$f['hora_servicio']} — {$f['origen']} → {$f['destino']} — {$f['estado_servicio']}\n";
        }
        return trim($txt);
    }
    if (preg_match('/#\s*(\d+)/', $p, $m) || (tiene($p, ['estado', 'servicio', 'guia', 'guía']) && preg_match('/(\d+)/', $p, $m))) {
        if (!puede('servicios') && !puede('programacion')) return sin_permiso();
        $f = db_one($conn, 'SELECT s.*, c.nombre AS cliente, v.placa, co.nombre AS conductor FROM servicios s LEFT JOIN clientes c ON c.id = s.cliente_id
            LEFT JOIN vehiculos v ON v.id = s.vehiculo_id LEFT JOIN conductores co ON co.id = s.conductor_id WHERE s.id = ?', 'i', [(int)$m[1]]);
        if (!$f) return "No encontré el servicio #{$m[1]}.";
        $txt = "Servicio #{$f['id']}\n• Cliente: " . ($f['cliente'] ?? '—') . "\n• Fecha: {$f['fecha_servicio']} {$f['hora_servicio']}\n• Ruta: {$f['origen']} → {$f['destino']}"
            . "\n• Vehículo: " . ($f['placa'] ?? '—') . "\n• Conductor: " . ($f['conductor'] ?? '—') . "\n• Guía: {$f['guia_transportista']}\n• Estado: {$f['estado_servicio']}";
        if (puede('facturas') || puede('reportes')) $txt .= "\n• Precio: " . $mon($f['precio_cliente']);
        return $txt;
    }
    $desde = date('Y-m-01');
    $hasta = date('Y-m-t');
    if (tiene($p, ['facturacion', 'facturación', 'facturado', 'ingresos', 'ventas'])) {
        if (!puede('facturas') && !puede('reportes') && !puede('dashboard')) return sin_permiso();
        $f = finanzas_periodo($conn, $desde, $hasta);
        return "Facturación del mes:\n• Comprobantes emitidos: {$f['facturado_comprobantes']}\n• Total facturado (con IGV): " . $mon($f['facturado_total'])
            . "\n• Base imponible: " . $mon($f['facturado_base']) . "\n• IGV: " . $mon($f['facturado_igv']) . "\n• Ingresos de servicios finalizados (sin IGV): " . $mon($f['ingresos']);
    }
    if (tiene($p, ['gasto', 'egreso'])) {
        if (!puede('gastos_operativos') && !puede('gastos_administrativos') && !puede('reportes')) return sin_permiso();
        $f = finanzas_periodo($conn, $desde, $hasta);
        return "Gastos del mes:\n• Operativos: " . $mon($f['gastos_operativos']) . "\n• Administrativos: " . $mon($f['gastos_administrativos'])
            . "\n• Adicionales: " . $mon($f['gastos_adicionales']) . "\n• Costo de terceros: " . $mon($f['costo_terceros']);
    }
    if (tiene($p, ['utilidad', 'ganancia', 'margen', 'rentabilidad', 'resultado'])) {
        if (!puede('dashboard') && !puede('reportes') && !puede('analisis')) return sin_permiso();
        $f = finanzas_periodo($conn, $desde, $hasta);
        return "Resultado operativo del mes (sin IGV):\n• Ingresos: " . $mon($f['ingresos']) . "\n• Costos y gastos: " . $mon($f['total_gastos'])
            . "\n• Resultado operativo: " . $mon($f['resultado_operativo']) . " ({$f['margen_operativo_pct']} %)\nNota: no es utilidad neta; no descuenta el impuesto a la renta.";
    }
    if (tiene($p, ['cobrar', 'cobranza', 'deuda', 'vencid', 'saldo'])) {
        if (!puede('cuentas')) return sin_permiso();
        $r = cxc_resumen($conn);
        return "Cuentas por cobrar:\n• Saldo total: " . $mon($r['saldo']) . " en {$r['documentos']} comprobantes\n• Vencido: " . $mon($r['vencido'])
            . " ({$r['pct_vencido']} %)\n• Próximos a vencer (7 días): {$r['proximos']}";
    }
    if (tiene($p, ['conductor', 'chofer', 'disponible', 'libre'])) {
        if (!puede('conductores') && !puede('programacion')) return sin_permiso();
        $rows = db_all($conn, "SELECT nombre, telefono FROM conductores WHERE estado = 'activo' AND (licencia_vencimiento IS NULL OR licencia_vencimiento >= CURDATE())
            AND id NOT IN (SELECT conductor_id FROM servicios WHERE fecha_servicio = CURDATE() AND estado_servicio <> 'cancelado' AND conductor_id IS NOT NULL) ORDER BY nombre LIMIT 30");
        if (!$rows) return 'No hay conductores disponibles hoy.';
        return 'Conductores disponibles hoy (' . count($rows) . "):\n" . implode("\n", array_map(fn($r) => "• {$r['nombre']}" . ($r['telefono'] ? " — {$r['telefono']}" : ''), $rows));
    }
    return "No reconocí la consulta. Prueba con: «servicios de hoy», «estado del servicio #15», «facturación del mes», «gastos del mes», «resultado del mes», «cuentas por cobrar» o «conductores disponibles».";
}

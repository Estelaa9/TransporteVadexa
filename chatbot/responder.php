<?php
// chatbot/responder.php - Asistente de consultas basado en reglas (UX-01), conectado a todos los módulos.
// Reconoce palabras clave, identificadores (servicio #15, F001-12, placa ABC-123, RUC/DNI) y períodos
// ("hoy", "mañana", "esta semana", "mes pasado", "noviembre"). Cada respuesta respeta los permisos del rol
// (SEG-11) y se devuelve como texto plano (SEG-13). No usa inteligencia artificial.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../reportes/lib.php';
require_once __DIR__ . '/../facturas/lib.php';
require_once __DIR__ . '/../analisis/lib.php';
require_auth();
require_method('POST');
if (($_SESSION['rol'] ?? '') === 'cliente') json_response(['success' => false, 'error' => 'El asistente no está disponible en el portal.'], 403);

$original = trim((string)(get_request_data()['pregunta'] ?? ''));
if ($original === '' || mb_strlen($original) > 300) json_response(['success' => false, 'error' => 'Escriba una consulta de hasta 300 caracteres.'], 422);

/* ---------------- utilidades ---------------- */

function norm(string $t): string {
    $t = mb_strtolower($t, 'UTF-8');
    return strtr($t, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n']);
}
function tiene(string $t, array $palabras): bool {
    foreach ($palabras as $p) if (strpos($t, $p) !== false) return true;
    return false;
}
function sin_permiso(string $modulo): string {
    return "Tu rol no tiene acceso a la información de $modulo. Si la necesitas, solicítalo al administrador.";
}
function mon($v): string { return 'S/ ' . number_format((float)$v, 2); }
function fec(?string $d): string { return $d ? date('d/m/Y', strtotime($d)) : '—'; }
function hm(?string $h): string { return $h ? substr($h, 0, 5) : '--:--'; }
function lista(array $filas, int $max = 10): string {
    $extra = count($filas) > $max ? "\n… y " . (count($filas) - $max) . ' más.' : '';
    return implode("\n", array_slice($filas, 0, $max)) . $extra;
}
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Período mencionado en la pregunta. $defecto: 'hoy' o 'mes'. Devuelve [desde, hasta, etiqueta]. */
function periodo(string $t, string $defecto = 'mes'): array {
    $hoy = new DateTimeImmutable('today');
    if (preg_match('/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/', $t, $m)) {
        $y = isset($m[3]) ? ((int)$m[3] < 100 ? 2000 + (int)$m[3] : (int)$m[3]) : (int)$hoy->format('Y');
        if (checkdate((int)$m[2], (int)$m[1], $y)) { $d = sprintf('%04d-%02d-%02d', $y, $m[2], $m[1]); return [$d, $d, 'el ' . fec($d)]; }
    }
    if (tiene($t, ['pasado manana'])) { $d = $hoy->modify('+2 day')->format('Y-m-d'); return [$d, $d, 'pasado mañana (' . fec($d) . ')']; }
    if (tiene($t, ['manana'])) { $d = $hoy->modify('+1 day')->format('Y-m-d'); return [$d, $d, 'mañana (' . fec($d) . ')']; }
    if (tiene($t, ['ayer'])) { $d = $hoy->modify('-1 day')->format('Y-m-d'); return [$d, $d, 'ayer (' . fec($d) . ')']; }
    if (tiene($t, ['hoy'])) { $d = $hoy->format('Y-m-d'); return [$d, $d, 'hoy (' . fec($d) . ')']; }
    if (tiene($t, ['proxima semana', 'semana que viene'])) { $a = $hoy->modify('monday next week'); return [$a->format('Y-m-d'), $a->modify('+6 day')->format('Y-m-d'), 'la próxima semana']; }
    if (tiene($t, ['semana pasada'])) { $a = $hoy->modify('monday last week'); return [$a->format('Y-m-d'), $a->modify('+6 day')->format('Y-m-d'), 'la semana pasada']; }
    if (tiene($t, ['semana'])) { $a = $hoy->modify('monday this week'); return [$a->format('Y-m-d'), $a->modify('+6 day')->format('Y-m-d'), 'esta semana']; }
    if (tiene($t, ['mes pasado', 'mes anterior'])) { $a = $hoy->modify('first day of last month'); return [$a->format('Y-m-d'), $a->format('Y-m-t'), MESES[(int)$a->format('n') - 1] . ' ' . $a->format('Y')]; }
    foreach (MESES as $i => $mes) {
        if (preg_match('/\b' . $mes . '\b(?:\s+(?:de\s+|del\s+)?(\d{4}))?/', $t, $m)) {
            $y = isset($m[1]) ? (int)$m[1] : (int)$hoy->format('Y');
            $a = new DateTimeImmutable(sprintf('%04d-%02d-01', $y, $i + 1));
            return [$a->format('Y-m-d'), $a->format('Y-m-t'), "$mes $y"];
        }
    }
    if (tiene($t, ['este ano', 'del ano', 'en el ano', 'anual'])) return [$hoy->format('Y-01-01'), $hoy->format('Y-12-31'), 'el año ' . $hoy->format('Y')];
    if ($defecto === 'hoy') { $d = $hoy->format('Y-m-d'); return [$d, $d, 'hoy (' . fec($d) . ')']; }
    return [$hoy->format('Y-m-01'), $hoy->format('Y-m-t'), MESES[(int)$hoy->format('n') - 1] . ' ' . $hoy->format('Y')];
}

/** Texto que sigue a una palabra clave: "cliente andina" → "andina". */
function despues_de(string $t, array $claves): string {
    foreach ($claves as $c) {
        if (preg_match('/\b' . $c . '\s+(?:de\s+|del\s+|la\s+|el\s+)?(.+)$/u', $t, $m)) {
            return trim(preg_replace('/\b(hoy|manana|ayer|este mes|mes pasado|semana|esta semana|por favor|\?)\b/u', '', $m[1]), " ?.¿");
        }
    }
    return '';
}

/* ---------------- respuestas ---------------- */

function asistente_responder(mysqli $conn, string $original): string {
    $t = norm($original);

    if (preg_match('/^(hola|buenas|buenos dias|ayuda|que puedes|que sabes|menu|opciones)/', $t) || $t === '?') return ayuda();

    // Identificadores explícitos primero.
    if (preg_match('/\b([fb][a-z0-9]{3})\s*-\s*0*(\d{1,8})\b/', $t, $m)) return r_comprobante($conn, strtoupper($m[1]), (int)$m[2]);
    if (preg_match('/#\s*(\d+)/', $t, $m) || preg_match('/\b(?:servicio|viaje|guia|grt)[\s-]*(?:n(?:ro|umero)?\.?\s*)?0*(\d+)\b/', $t, $m)) return r_servicio($conn, (int)$m[1]);
    if (preg_match('/\b([a-z0-9]{3})-(\d{3})\b/', $t, $m) && preg_match('/[a-z]/', $m[1])) return r_vehiculo($conn, strtoupper($m[1] . '-' . $m[2]));
    if (preg_match('/\b(\d{11}|\d{8})\b/', $t, $m) && !tiene($t, ['conductor', 'chofer', 'proveedor'])) return r_cliente($conn, $m[1]);

    // Diagnóstico y análisis.
    if (tiene($t, ['diagnostico', 'analisis', 'punto critico', 'puntos criticos', 'recomendacion', 'alertas del'])) return r_analisis($conn, $t);
    // Disponibilidad.
    if (tiene($t, ['disponible', 'libre', 'quien puede', 'sin viaje'])) {
        if (tiene($t, ['vehiculo', 'unidad', 'camion', 'flota', 'placa'])) return r_vehiculos_disponibles($conn, $t);
        return r_conductores_disponibles($conn, $t);
    }
    // Documentos por vencer.
    if (tiene($t, ['vence', 'vencid', 'soat', 'revision tecnica', 'licencia']) && !tiene($t, ['factura', 'comprobante', 'cobrar', 'deuda'])) return r_documentos($conn);
    // Cuentas por cobrar.
    if (tiene($t, ['cobrar', 'cobranza', 'deuda', 'deudor', 'debe', 'saldo', 'vencida', 'morosos', 'pendiente de pago', 'periodo promedio'])) return r_cuentas($conn, $t);
    // Facturación.
    if (tiene($t, ['por facturar', 'sin factura', 'sin comprobante'])) return r_por_facturar($conn);
    if (tiene($t, ['factur', 'comprobante', 'boleta', 'nota de credito', 'ingreso', 'venta', 'igv'])) return r_facturacion($conn, $t);
    // Resultado y gastos.
    if (tiene($t, ['utilidad', 'ganancia', 'margen', 'rentabilidad', 'resultado', 'cierre'])) return r_resultado($conn, $t);
    if (tiene($t, ['gasto', 'egreso', 'combustible', 'peaje', 'mantenimiento'])) return r_gastos($conn, $t);
    // Catálogos.
    if (tiene($t, ['proveedor', 'tercerizad', 'transportista'])) return r_proveedores($conn, $t);
    if (tiene($t, ['conductor', 'chofer', 'choferes'])) return r_conductores($conn, $t);
    if (tiene($t, ['vehiculo', 'camion', 'flota', 'unidad', 'placa'])) return r_vehiculos($conn, $t);
    if (tiene($t, ['cliente'])) {
        $q = despues_de($t, ['cliente', 'clientes']);
        if ($q !== '' && !tiene($t, ['principal', 'top', 'mejores', 'mas ', 'cuantos', 'total', 'clientes'])) return r_cliente($conn, $q);
        return r_clientes($conn, $t);
    }
    // Auditoría y usuarios.
    if (tiene($t, ['auditoria', 'quien cambio', 'quien modifico', 'ultimos cambios', 'quien anulo', 'historial de cambios'])) return r_auditoria($conn);
    if (tiene($t, ['usuario', 'roles', 'cuentas de acceso'])) return r_usuarios($conn);
    // Servicios (al final: es la palabra más genérica).
    if (tiene($t, ['servicio', 'viaje', 'programad', 'en ruta', 'finalizad', 'cancelad', 'anulad', 'despacho', 'programacion', 'traslado', 'mudanza'])) return r_servicios($conn, $t);

    return "No reconocí la consulta. Escribe «ayuda» para ver ejemplos, o prueba con: «servicios de mañana», «cliente andina», «placa BXK-481», «F001-1002», «cuentas por cobrar», «diagnóstico del mes».";
}

function ayuda(): string {
    return "Soy el asistente de consultas de VADEXSA (basado en reglas). Puedo responder sobre:\n"
        . "• Servicios: «servicios de hoy», «servicios en ruta», «servicios de mañana», «servicio #15»\n"
        . "• Disponibilidad: «conductores disponibles mañana», «vehículos libres hoy»\n"
        . "• Clientes: «cliente andina», «20601234567», «principales clientes del mes»\n"
        . "• Flota: «placa BXK-481», «vehículos», «conductor Pedro», «documentos por vencer»\n"
        . "• Proveedores: «proveedores», «proveedor frío andino»\n"
        . "• Facturación: «facturación de octubre», «F001-1002», «servicios por facturar»\n"
        . "• Cobranza: «cuentas por cobrar», «deudores», «facturas vencidas»\n"
        . "• Finanzas: «resultado del mes», «gastos del mes pasado»\n"
        . "• Gestión: «diagnóstico del mes», «últimos cambios», «usuarios»\n"
        . "Solo verás la información que tu rol permite.";
}

function r_servicio(mysqli $c, int $id): string {
    if (!puede('servicios') && !puede('programacion') && !puede('operacion')) return sin_permiso('servicios');
    $s = db_one($c, "SELECT s.*, cl.nombre AS cliente, v.placa, co.nombre AS conductor, p.nombre AS proveedor,
            CASE WHEN cp.id IS NULL THEN NULL ELSE CONCAT(cp.serie, '-', LPAD(cp.numero, 6, '0')) END AS comprobante
        FROM servicios s LEFT JOIN clientes cl ON cl.id = s.cliente_id LEFT JOIN vehiculos v ON v.id = s.vehiculo_id
        LEFT JOIN conductores co ON co.id = s.conductor_id LEFT JOIN proveedores p ON p.id = s.proveedor_id
        LEFT JOIN comprobantes cp ON cp.id = s.comprobante_id WHERE s.id = ?", 'i', [$id]);
    if (!$s) return "No encontré el servicio #$id.";
    $asig = $s['modalidad'] === 'tercerizado' ? "Tercerizado con {$s['proveedor']}" : "Vehículo {$s['placa']} · conductor {$s['conductor']}";
    $txt = "Servicio #{$s['id']} — {$s['estado_servicio']}\n• Cliente: {$s['cliente']}\n• Fecha: " . fec($s['fecha_servicio']) . ' de ' . hm($s['hora_servicio']) . ' a ' . hm($s['hora_fin_estimada'])
        . "\n• Ruta: {$s['origen']} → {$s['destino']}\n• Tipo: {$s['tipo_servicio']} · carga {$s['tipo_carga']}" . ($s['peso_kg'] ? ' · ' . number_format((float)$s['peso_kg']) . ' kg' : '')
        . "\n• Asignación: $asig\n• Guía: {$s['guia_transportista']}";
    if (puede('facturas') || puede('reportes') || puede('dashboard')) {
        $txt .= "\n• Precio: " . mon($s['precio_cliente']) . ' (base ' . mon($s['base_imponible']) . ') · margen ' . mon($s['utilidad'])
            . "\n• Comprobante: " . ($s['comprobante'] ?: ($s['estado_servicio'] === 'finalizado' ? 'por facturar' : 'aún no corresponde'));
    }
    if ($s['estado_servicio'] === 'cancelado' && $s['motivo_cancelacion']) $txt .= "\n• Motivo de anulación: {$s['motivo_cancelacion']}";
    return $txt;
}

function r_servicios(mysqli $c, string $t): string {
    if (!puede('servicios') && !puede('programacion') && !puede('operacion')) return sin_permiso('servicios');
    [$desde, $hasta, $et] = periodo($t, 'hoy');
    $estado = null;
    foreach (['programad' => 'programado', 'en ruta' => 'en_ruta', 'finalizad' => 'finalizado', 'cancelad' => 'cancelado', 'anulad' => 'cancelado'] as $k => $v) if (strpos($t, $k) !== false) $estado = $v;
    $where = 's.fecha_servicio BETWEEN ? AND ?';
    $params = [$desde, $hasta];
    if ($estado) { $where .= ' AND s.estado_servicio = ?'; $params[] = $estado; }
    if (tiene($t, ['tercerizad'])) $where .= " AND s.modalidad = 'tercerizado'";
    $rows = db_all($c, "SELECT s.id, s.fecha_servicio, s.hora_servicio, s.hora_fin_estimada, s.estado_servicio, s.origen, s.destino, s.modalidad,
            cl.nombre AS cliente, v.placa, p.nombre AS proveedor
        FROM servicios s LEFT JOIN clientes cl ON cl.id = s.cliente_id LEFT JOIN vehiculos v ON v.id = s.vehiculo_id LEFT JOIN proveedores p ON p.id = s.proveedor_id
        WHERE $where ORDER BY s.fecha_servicio, s.hora_servicio", str_repeat('s', count($params)), $params);
    $plural = ['programado' => 'programados ', 'en_ruta' => 'en ruta ', 'finalizado' => 'finalizados ', 'cancelado' => 'anulados '][$estado] ?? '';
    $etiqueta = $plural . $et;
    if (!$rows) return "No hay servicios {$plural}para $et.";
    $conteo = array_count_values(array_column($rows, 'estado_servicio'));
    $res = implode(' · ', array_map(fn($k, $n) => str_replace('_', ' ', $k) . ": $n", array_keys($conteo), $conteo));
    $filas = array_map(fn($s) => "• #{$s['id']} " . ($desde !== $hasta ? fec($s['fecha_servicio']) . ' ' : '') . hm($s['hora_servicio']) . '–' . hm($s['hora_fin_estimada'])
        . " {$s['cliente']} [" . ($s['modalidad'] === 'tercerizado' ? ($s['proveedor'] ?: 'tercerizado') : ($s['placa'] ?: 'sin unidad')) . "] {$s['origen']} → {$s['destino']} — " . str_replace('_', ' ', $s['estado_servicio']), $rows);
    return "Servicios $etiqueta: " . count($rows) . " ($res)\n" . lista($filas, 12);
}

function r_conductores_disponibles(mysqli $c, string $t): string {
    if (!puede('conductores') && !puede('programacion') && !puede('servicios')) return sin_permiso('conductores');
    [$d, , $et] = periodo($t, 'hoy');
    $rows = db_all($c, "SELECT nombre, telefono, categoria_licencia FROM conductores WHERE LOWER(estado) = 'activo'
        AND (licencia_vencimiento IS NULL OR licencia_vencimiento >= ?)
        AND id NOT IN (SELECT conductor_id FROM servicios WHERE fecha_servicio = ? AND estado_servicio <> 'cancelado' AND conductor_id IS NOT NULL) ORDER BY nombre", 'ss', [$d, $d]);
    if (!$rows) return "No hay conductores libres todo el día para $et.";
    return 'Conductores libres ' . $et . ' (' . count($rows) . "):\n" . lista(array_map(fn($r) => "• {$r['nombre']}" . ($r['categoria_licencia'] ? " ({$r['categoria_licencia']})" : '') . ($r['telefono'] ? " — {$r['telefono']}" : ''), $rows), 15);
}

function r_vehiculos_disponibles(mysqli $c, string $t): string {
    if (!puede('vehiculos') && !puede('programacion') && !puede('servicios')) return sin_permiso('vehículos');
    [$d, , $et] = periodo($t, 'hoy');
    $rows = db_all($c, "SELECT placa, modelo, capacidad_kg FROM vehiculos WHERE LOWER(estado) = 'activo'
        AND (soat_vencimiento IS NULL OR soat_vencimiento >= ?) AND (revision_vencimiento IS NULL OR revision_vencimiento >= ?)
        AND id NOT IN (SELECT vehiculo_id FROM servicios WHERE fecha_servicio = ? AND estado_servicio <> 'cancelado' AND vehiculo_id IS NOT NULL) ORDER BY placa", 'sss', [$d, $d, $d]);
    if (!$rows) return "No hay vehículos libres todo el día para $et.";
    return 'Vehículos libres ' . $et . ' (' . count($rows) . "):\n" . lista(array_map(fn($r) => "• {$r['placa']} {$r['modelo']}" . ($r['capacidad_kg'] ? ' · ' . number_format((float)$r['capacidad_kg']) . ' kg' : ''), $rows), 15);
}

function r_documentos(mysqli $c): string {
    if (!puede('conductores') && !puede('vehiculos') && !puede('analisis')) return sin_permiso('flota');
    $rows = db_all($c, "SELECT 'Licencia' AS doc, nombre AS titular, licencia_vencimiento AS vence FROM conductores WHERE LOWER(estado) = 'activo' AND licencia_vencimiento <= CURDATE() + INTERVAL 30 DAY
        UNION ALL SELECT 'SOAT', placa, soat_vencimiento FROM vehiculos WHERE LOWER(estado) = 'activo' AND soat_vencimiento <= CURDATE() + INTERVAL 30 DAY
        UNION ALL SELECT 'Revisión técnica', placa, revision_vencimiento FROM vehiculos WHERE LOWER(estado) = 'activo' AND revision_vencimiento <= CURDATE() + INTERVAL 30 DAY
        ORDER BY vence");
    if (!$rows) return 'No hay licencias, SOAT ni revisiones técnicas vencidas o por vencer en los próximos 30 días.';
    $hoy = date('Y-m-d');
    return 'Documentos vencidos o por vencer en 30 días (' . count($rows) . "):\n"
        . lista(array_map(fn($r) => '• ' . ($r['vence'] < $hoy ? 'VENCIDO' : 'vence') . ' ' . fec($r['vence']) . " — {$r['doc']} de {$r['titular']}", $rows), 15);
}

function r_cliente(mysqli $c, string $q): string {
    if (!puede('clientes')) return sin_permiso('clientes');
    $rows = ctype_digit($q)
        ? db_all($c, 'SELECT * FROM clientes WHERE documento = ? LIMIT 5', 's', [$q])
        : db_all($c, 'SELECT * FROM clientes WHERE nombre LIKE ? ORDER BY nombre LIMIT 6', 's', ['%' . $q . '%']);
    if (!$rows) return "No encontré clientes que coincidan con «{$q}».";
    if (count($rows) > 1) return 'Encontré ' . count($rows) . " clientes; precisa un poco más:\n" . lista(array_map(fn($r) => "• {$r['nombre']} ({$r['documento']})", $rows));
    $cl = $rows[0];
    $srv = db_one($c, "SELECT COUNT(*) AS total, SUM(estado_servicio IN ('programado','en_ruta')) AS activos, MAX(fecha_servicio) AS ultimo FROM servicios WHERE cliente_id = ?", 'i', [$cl['id']]);
    $txt = "{$cl['nombre']} — {$cl['tipo_cliente']} · {$cl['documento']}\n• Contacto: " . ($cl['telefono'] ?: '—') . ' · ' . ($cl['email'] ?: '—')
        . "\n• Dirección: " . ($cl['direccion'] ?: '—') . "\n• Crédito: " . ((int)$cl['dias_credito'] ? "{$cl['dias_credito']} días" : 'contado')
        . "\n• Servicios: {$srv['total']} en total, " . (int)$srv['activos'] . ' en curso; último el ' . fec($srv['ultimo']);
    if (puede('cuentas')) {
        $d = db_one($c, 'SELECT COUNT(*) AS docs, COALESCE(SUM(x.saldo),0) AS saldo, COALESCE(SUM(CASE WHEN x.situacion = \'vencida\' THEN x.saldo ELSE 0 END),0) AS vencido
            FROM (' . comprobantes_select() . ") x WHERE x.cliente_id = ? AND x.tipo <> 'NOTA_CREDITO' AND x.estado = 'emitida' AND x.saldo > 0", 'i', [$cl['id']]);
        $txt .= "\n• Por cobrar: " . mon($d['saldo']) . " en {$d['docs']} comprobante(s), vencido " . mon($d['vencido']);
    }
    return $txt;
}

function r_clientes(mysqli $c, string $t): string {
    if (!puede('clientes') && !puede('reportes')) return sin_permiso('clientes');
    $tot = db_one($c, "SELECT COUNT(*) AS total, SUM(tipo_cliente = 'Empresa') AS empresas, SUM(tipo_cliente = 'Persona') AS personas FROM clientes");
    $txt = "Clientes registrados: {$tot['total']} ({$tot['empresas']} empresas, {$tot['personas']} personas).";
    if (puede('reportes') || puede('dashboard')) {
        [$desde, $hasta, $et] = periodo($t);
        $top = db_all($c, "SELECT cl.nombre, COUNT(*) AS n, SUM(s.base_imponible) AS ingresos FROM servicios s JOIN clientes cl ON cl.id = s.cliente_id
            WHERE s.estado_servicio = 'finalizado' AND s.fecha_servicio BETWEEN ? AND ? GROUP BY cl.id, cl.nombre ORDER BY ingresos DESC LIMIT 5", 'ss', [$desde, $hasta]);
        $txt .= $top ? "\nPrincipales clientes en $et (ingresos sin IGV):\n" . lista(array_map(fn($r) => "• {$r['nombre']}: " . mon($r['ingresos']) . " ({$r['n']} servicios)", $top))
            : "\nSin servicios finalizados en $et.";
    }
    return $txt . "\nPara ver uno: «cliente <nombre>» o su RUC/DNI.";
}

function r_vehiculo(mysqli $c, string $placa): string {
    if (!puede('vehiculos') && !puede('servicios')) return sin_permiso('vehículos');
    $v = db_one($c, "SELECT * FROM vehiculos WHERE REPLACE(UPPER(placa), '-', '') = ?", 's', [str_replace('-', '', $placa)]);
    if (!$v) {
        $p = db_one($c, "SELECT * FROM proveedores WHERE REPLACE(UPPER(placa), '-', '') = ?", 's', [str_replace('-', '', $placa)]);
        return $p ? "La placa $placa es la unidad del proveedor {$p['nombre']} ({$p['vehiculo']}), estado {$p['estado']}." : "No encontré la placa $placa.";
    }
    $prox = db_all($c, "SELECT id, fecha_servicio, hora_servicio, destino FROM servicios WHERE vehiculo_id = ? AND fecha_servicio >= CURDATE() AND estado_servicio IN ('programado','en_ruta') ORDER BY fecha_servicio, hora_servicio LIMIT 5", 'i', [$v['id']]);
    $txt = "{$v['placa']} — {$v['modelo']} ({$v['tipo']}), estado {$v['estado']}\n• Capacidad: " . ($v['capacidad_kg'] ? number_format((float)$v['capacidad_kg']) . ' kg' : ($v['capacidad'] ?: '—'))
        . "\n• SOAT vence: " . fec($v['soat_vencimiento']) . ' · revisión técnica: ' . fec($v['revision_vencimiento'])
        . "\n• Próximos viajes: " . ($prox ? implode(', ', array_map(fn($s) => "#{$s['id']} " . fec($s['fecha_servicio']) . ' ' . hm($s['hora_servicio']), $prox)) : 'ninguno');
    if (puede('gastos_operativos')) {
        $g = db_value($c, 'SELECT COALESCE(SUM(monto),0) FROM gastos_operativos WHERE vehiculo_id = ? AND fecha >= ?', 'is', [$v['id'], date('Y-m-01')]);
        $txt .= "\n• Gastos del mes: " . mon($g);
    }
    return $txt;
}

function r_vehiculos(mysqli $c, string $t): string {
    if (!puede('vehiculos') && !puede('servicios')) return sin_permiso('vehículos');
    $q = despues_de($t, ['placa', 'vehiculo', 'camion', 'unidad']);
    if ($q !== '' && !tiene($q, ['cuantos', 'total', 'estado', 'flota', 'todos', 'disponible'])) {
        $rows = db_all($c, "SELECT placa FROM vehiculos WHERE modelo LIKE ? OR REPLACE(placa, '-', '') LIKE ? LIMIT 6", 'ss', ['%' . $q . '%', '%' . str_replace('-', '', $q) . '%']);
        if (count($rows) === 1) return r_vehiculo($c, strtoupper($rows[0]['placa']));
        if ($rows) return "Encontré varios vehículos:\n" . lista(array_map(fn($r) => "• {$r['placa']}", $rows));
    }
    $est = db_all($c, 'SELECT LOWER(estado) AS estado, COUNT(*) AS n FROM vehiculos GROUP BY LOWER(estado) ORDER BY n DESC');
    $tot = array_sum(array_column($est, 'n'));
    return "Flota propia: $tot vehículos (" . implode(', ', array_map(fn($r) => "{$r['n']} {$r['estado']}", $est)) . ").\nConsulta uno con su placa (ej. «placa BXK-481») o «vehículos libres hoy».";
}

function r_conductores(mysqli $c, string $t): string {
    if (!puede('conductores') && !puede('servicios') && !puede('programacion')) return sin_permiso('conductores');
    $q = despues_de($t, ['conductor', 'chofer']);
    if ($q !== '' && !tiene($q, ['cuantos', 'total', 'estado', 'todos', 'es'])) {
        $rows = db_all($c, 'SELECT * FROM conductores WHERE nombre LIKE ? OR licencia LIKE ? OR dni = ? ORDER BY nombre LIMIT 6', 'sss', ['%' . $q . '%', '%' . $q . '%', $q]);
        if (count($rows) > 1) return "Encontré varios conductores:\n" . lista(array_map(fn($r) => "• {$r['nombre']} ({$r['licencia']})", $rows));
        if ($rows) {
            $co = $rows[0];
            $hoy = db_all($c, "SELECT id, hora_servicio, hora_fin_estimada, destino FROM servicios WHERE conductor_id = ? AND fecha_servicio = CURDATE() AND estado_servicio <> 'cancelado' ORDER BY hora_servicio", 'i', [$co['id']]);
            $mes = db_value($c, "SELECT COUNT(*) FROM servicios WHERE conductor_id = ? AND estado_servicio = 'finalizado' AND fecha_servicio >= ?", 'is', [$co['id'], date('Y-m-01')]);
            return "{$co['nombre']} — estado {$co['estado']}\n• Licencia: {$co['licencia']}" . ($co['categoria_licencia'] ? " ({$co['categoria_licencia']})" : '') . ', vence ' . fec($co['licencia_vencimiento'])
                . "\n• Teléfono: " . ($co['telefono'] ?: '—') . "\n• Hoy: " . ($hoy ? implode(', ', array_map(fn($s) => "#{$s['id']} " . hm($s['hora_servicio']) . '–' . hm($s['hora_fin_estimada']) . " a {$s['destino']}", $hoy)) : 'sin viajes')
                . "\n• Viajes finalizados este mes: $mes";
        }
    }
    $est = db_all($c, 'SELECT LOWER(estado) AS estado, COUNT(*) AS n FROM conductores GROUP BY LOWER(estado) ORDER BY n DESC');
    $tot = array_sum(array_column($est, 'n'));
    return "Conductores: $tot (" . implode(', ', array_map(fn($r) => "{$r['n']} {$r['estado']}", $est)) . ").\nPrueba «conductor <nombre>» o «conductores disponibles mañana».";
}

function r_proveedores(mysqli $c, string $t): string {
    if (!puede('proveedores') && !puede('servicios')) return sin_permiso('proveedores');
    $q = despues_de($t, ['proveedor']);
    if ($q !== '' && !tiene($q, ['cuantos', 'total', 'activos', 'todos', 'es'])) {
        $rows = db_all($c, 'SELECT * FROM proveedores WHERE nombre LIKE ? OR ruc = ? ORDER BY nombre LIMIT 6', 'ss', ['%' . $q . '%', $q]);
        if (count($rows) > 1) return "Encontré varios proveedores:\n" . lista(array_map(fn($r) => "• {$r['nombre']}", $rows));
        if ($rows) {
            $p = $rows[0];
            $mes = db_one($c, "SELECT COUNT(*) AS n, COALESCE(SUM(costo_proveedor),0) AS costo FROM servicios WHERE proveedor_id = ? AND estado_servicio <> 'cancelado' AND fecha_servicio >= ?", 'is', [$p['id'], date('Y-m-01')]);
            $txt = "{$p['nombre']} — estado {$p['estado']}\n• RUC: " . ($p['ruc'] ?: '—') . ' · teléfono ' . ($p['telefono'] ?: '—') . "\n• Unidad: {$p['vehiculo']} · placa {$p['placa']}\n• Servicios este mes: {$mes['n']}";
            if (puede('reportes') || puede('facturas')) $txt .= ' · costo ' . mon($mes['costo']) . ' sin IGV';
            return $txt;
        }
    }
    $rows = db_all($c, "SELECT nombre, vehiculo, placa FROM proveedores WHERE LOWER(estado) = 'activo' ORDER BY nombre");
    return 'Proveedores activos (' . count($rows) . "):\n" . lista(array_map(fn($r) => "• {$r['nombre']} — {$r['vehiculo']} {$r['placa']}", $rows), 12);
}

function r_comprobante(mysqli $c, string $serie, int $numero): string {
    if (!puede('facturas') && !puede('cuentas')) return sin_permiso('facturación');
    $x = db_one($c, 'SELECT * FROM (' . comprobantes_select() . ') x WHERE x.serie = ? AND x.numero = ?', 'si', [$serie, $numero]);
    if (!$x) return "No encontré el comprobante $serie-" . str_pad((string)$numero, 6, '0', STR_PAD_LEFT) . '.';
    $txt = "{$x['numero_completo']} — " . ($x['tipo'] === 'NOTA_CREDITO' ? 'nota de crédito' . ($x['referencia'] ? " de {$x['referencia']}" : '') : strtolower($x['tipo'])) . ", {$x['estado']}"
        . "\n• Cliente: {$x['cliente']} ({$x['documento']})\n• Emisión: " . fec($x['fecha_emision']) . ' · vence ' . fec($x['fecha_vencimiento'])
        . "\n• Total: " . mon($x['total']) . ' (base ' . mon($x['base_imponible']) . ', IGV ' . mon($x['igv']) . ')'
        . "\n• Servicios: " . ($x['servicios'] ? '#' . str_replace(',', ', #', $x['servicios']) : '—');
    if ($x['estado'] === 'anulada') return $txt . "\n• Anulado: {$x['motivo_anulacion']}" . ($x['nota_credito'] ? " (NC {$x['nota_credito']})" : '');
    if ($x['tipo'] !== 'NOTA_CREDITO') $txt .= "\n• Pagado: " . mon($x['pagado']) . ' · saldo ' . mon($x['saldo']) . ' · ' . $x['estado_pago'] . ($x['situacion'] ? " ({$x['situacion']})" : '');
    return $txt;
}

function r_por_facturar(mysqli $c): string {
    if (!puede('facturas') && !puede('servicios')) return sin_permiso('facturación');
    $rows = db_all($c, "SELECT s.id, s.fecha_servicio, s.precio_cliente, cl.nombre AS cliente FROM servicios s JOIN clientes cl ON cl.id = s.cliente_id
        WHERE s.estado_servicio = 'finalizado' AND s.comprobante_id IS NULL AND s.tipo_comprobante <> 'SIN_COMPROBANTE' ORDER BY s.fecha_servicio");
    if (!$rows) return 'No hay servicios finalizados pendientes de comprobante.';
    $total = array_sum(array_map(fn($r) => (float)$r['precio_cliente'], $rows));
    return 'Servicios finalizados por facturar: ' . count($rows) . (puede('facturas') ? ' · ' . mon($total) : '') . "\n"
        . lista(array_map(fn($r) => "• #{$r['id']} " . fec($r['fecha_servicio']) . " {$r['cliente']}" . (puede('facturas') ? ' ' . mon($r['precio_cliente']) : ''), $rows));
}

function r_facturacion(mysqli $c, string $t): string {
    if (!puede('facturas') && !puede('reportes') && !puede('dashboard')) return sin_permiso('facturación');
    [$desde, $hasta, $et] = periodo($t);
    $f = finanzas_periodo($c, $desde, $hasta);
    $nc = db_one($c, "SELECT COUNT(*) AS n, COALESCE(SUM(total),0) AS t FROM comprobantes WHERE tipo = 'NOTA_CREDITO' AND fecha_emision BETWEEN ? AND ?", 'ss', [$desde, $hasta]);
    $pf = (int)db_value($c, "SELECT COUNT(*) FROM servicios WHERE estado_servicio = 'finalizado' AND comprobante_id IS NULL AND tipo_comprobante <> 'SIN_COMPROBANTE'");
    return "Facturación de $et:\n• Comprobantes emitidos vigentes: {$f['facturado_comprobantes']}\n• Total con IGV: " . mon($f['facturado_total'])
        . "\n• Base imponible: " . mon($f['facturado_base']) . ' · IGV: ' . mon($f['facturado_igv'])
        . "\n• Notas de crédito: {$nc['n']} por " . mon($nc['t'])
        . "\n• Ingresos de servicios finalizados (sin IGV): " . mon($f['ingresos'])
        . "\n• Servicios finalizados aún sin comprobante: $pf";
}

function r_cuentas(mysqli $c, string $t): string {
    if (!puede('cuentas')) return sin_permiso('cuentas por cobrar');
    $r = cxc_resumen($c);
    [$desde, $hasta, $et] = periodo($t);
    $ppc = cxc_ppc($c, $desde, $hasta);
    $txt = "Cuentas por cobrar:\n• Saldo total: " . mon($r['saldo']) . " en {$r['documentos']} comprobantes\n• Vencido: " . mon($r['vencido']) . " ({$r['pct_vencido']} %) en {$r['documentos_vencidos']} comprobantes"
        . "\n• Próximos a vencer (7 días): {$r['proximos']}\n• Cobrado en $et: " . mon(cxc_cobrado($c, $desde, $hasta))
        . "\n• Periodo promedio de cobro: " . ($ppc === null ? 'sin cobros completos en el período' : "$ppc días");
    $deu = db_all($c, 'SELECT x.cliente, ROUND(SUM(x.saldo),2) AS saldo, ROUND(SUM(CASE WHEN x.situacion = \'vencida\' THEN x.saldo ELSE 0 END),2) AS vencido
        FROM (' . comprobantes_select() . ") x WHERE x.tipo <> 'NOTA_CREDITO' AND x.estado = 'emitida' AND x.saldo > 0 GROUP BY x.cliente ORDER BY vencido DESC, saldo DESC LIMIT 5");
    if ($deu) $txt .= "\nMayores deudores:\n" . lista(array_map(fn($d) => "• {$d['cliente']}: " . mon($d['saldo']) . ((float)$d['vencido'] > 0 ? ' (vencido ' . mon($d['vencido']) . ')' : ''), $deu));
    return $txt;
}

function r_resultado(mysqli $c, string $t): string {
    if (!puede('dashboard') && !puede('reportes') && !puede('analisis') && !puede('cierre')) return sin_permiso('resultados financieros');
    [$desde, $hasta, $et] = periodo($t);
    $f = finanzas_periodo($c, $desde, $hasta);
    return "Resultado operativo de $et (sin IGV):\n• Servicios finalizados: {$f['servicios_finalizados']}\n• Ingresos: " . mon($f['ingresos'])
        . "\n• Costo de terceros: " . mon($f['costo_terceros']) . "\n• Gastos operativos: " . mon($f['gastos_operativos'])
        . "\n• Gastos administrativos: " . mon($f['gastos_administrativos']) . ' · adicionales: ' . mon($f['gastos_adicionales'])
        . "\n• Resultado operativo: " . mon($f['resultado_operativo']) . " (margen {$f['margen_operativo_pct']} %)\nNo es utilidad neta: no descuenta el impuesto a la renta.";
}

function r_gastos(mysqli $c, string $t): string {
    $op = puede('gastos_operativos') || puede('reportes');
    $ad = puede('gastos_administrativos') || puede('reportes');
    if (!$op && !$ad) return sin_permiso('gastos');
    [$desde, $hasta, $et] = periodo($t);
    $txt = "Gastos de $et:";
    if ($op) {
        $tipos = db_all($c, 'SELECT tipo_gasto, SUM(monto) AS m FROM gastos_operativos WHERE fecha BETWEEN ? AND ? GROUP BY tipo_gasto ORDER BY m DESC', 'ss', [$desde, $hasta]);
        $txt .= "\n• Operativos: " . mon(array_sum(array_column($tipos, 'm'))) . ($tipos ? ' (' . implode(', ', array_map(fn($g) => "{$g['tipo_gasto']} " . mon($g['m']), array_slice($tipos, 0, 4))) . ')' : '');
    }
    if ($ad) {
        $tipos = db_all($c, 'SELECT tipo_gasto, SUM(monto) AS m FROM gastos_administrativos WHERE fecha BETWEEN ? AND ? GROUP BY tipo_gasto ORDER BY m DESC', 'ss', [$desde, $hasta]);
        $txt .= "\n• Administrativos: " . mon(array_sum(array_column($tipos, 'm'))) . ($tipos ? ' (' . implode(', ', array_map(fn($g) => "{$g['tipo_gasto']} " . mon($g['m']), array_slice($tipos, 0, 4))) . ')' : '');
    }
    if (puede('cierre') || puede('reportes')) $txt .= "\n• Adicionales: " . mon(db_value($c, 'SELECT COALESCE(SUM(monto),0) FROM gastos_adicionales WHERE fecha BETWEEN ? AND ?', 'ss', [$desde, $hasta]));
    return $txt;
}

function r_analisis(mysqli $c, string $t): string {
    if (!puede('analisis')) return sin_permiso('análisis integral');
    [$desde, $hasta, $et] = periodo($t);
    $a = analisis_calcular($c, $desde, $hasta);
    $h = $a['hallazgos'];
    $fmt = fn($x) => "• {$x['nombre']}: {$x['etiqueta']} = " . (is_numeric($x['valor']) ? round((float)$x['valor'], 2) : $x['valor']) . ($x['unidad'] === 'cantidad' ? '' : " {$x['unidad']}") . ". {$x['recomendacion']}";
    $txt = "Diagnóstico de $et:";
    $txt .= $h['critico'] ? "\nPuntos críticos:\n" . lista(array_map($fmt, $h['critico']), 5) : "\nSin puntos críticos.";
    if ($h['negativo']) $txt .= "\nAspectos negativos:\n" . lista(array_map($fmt, $h['negativo']), 5);
    if ($h['positivo']) $txt .= "\nAspectos positivos:\n" . lista(array_map(fn($x) => "• {$x['nombre']}", $h['positivo']), 5);
    return $txt . "\nEl detalle completo está en Análisis integral.";
}

function r_auditoria(mysqli $c): string {
    if (!puede('auditoria')) return sin_permiso('auditoría');
    $rows = db_all($c, "SELECT fecha, usuario, accion, tabla, registro_id FROM auditoria WHERE accion NOT IN ('consultar','login','logout') ORDER BY id DESC LIMIT 10");
    if (!$rows) return 'Aún no hay cambios registrados en la auditoría.';
    return "Últimos cambios registrados:\n" . lista(array_map(fn($r) => '• ' . date('d/m H:i', strtotime($r['fecha'])) . " {$r['usuario']} — {$r['accion']} {$r['tabla']}" . ($r['registro_id'] ? " #{$r['registro_id']}" : ''), $rows));
}

function r_usuarios(mysqli $c): string {
    if (!puede('usuarios')) return sin_permiso('usuarios');
    $rows = db_all($c, "SELECT r.nombre, COUNT(u.id) AS n, SUM(u.estado = 'activo') AS activos FROM roles r LEFT JOIN usuarios u ON u.rol = r.codigo GROUP BY r.id, r.nombre ORDER BY n DESC");
    return "Usuarios por rol:\n" . lista(array_map(fn($r) => "• {$r['nombre']}: {$r['n']} (" . (int)$r['activos'] . ' activos)', $rows));
}

// La respuesta se emite al final, cuando ya están definidas todas las funciones y constantes.
json_response(['success' => true, 'respuesta' => asistente_responder($conn, $original)]);

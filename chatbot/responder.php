<?php
// chatbot/responder.php - Asistente virtual VADEXSA conectado a la base de datos
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();
$pregunta = strtolower(trim($data['pregunta'] ?? $_POST['pregunta'] ?? ''));

if (empty($pregunta)) {
    json_response(["success" => false, "error" => "La pregunta no puede estar vacía."], 400);
}

json_response([
    "success" => true,
    "respuesta" => responder_pregunta($pregunta, $conn)
]);

function responder_pregunta($p, $conn) {
    // 1. SALUDOS
    if (tiene($p, ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'que tal'])) {
        return "¡Hola! Soy el asistente inteligente de VADEXSA 🤖🚚\n\nPuedo ayudarte con:\n• Servicios del día\n• Estado de un servicio (#ID)\n• Facturación del mes\n• Gastos del mes\n• Utilidad del mes\n• Conductores disponibles hoy\n• Total de clientes y vehículos\n• Procesos del sistema";
    }

    // 2. SERVICIOS DE HOY
    if (tiene($p, ['servicio hoy', 'servicios hoy', 'servicios de hoy', 'hay hoy', 'programados hoy', 'cuantos servicios'])) {
        $hoy = date('Y-m-d');
        $res = mysqli_query($conn,
            "SELECT s.id, c.nombre AS cliente, s.hora_servicio, s.origen, s.destino, s.estado_servicio, v.placa
             FROM servicios s
             LEFT JOIN clientes c ON s.cliente_id = c.id
             LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
             WHERE s.fecha_servicio = '$hoy'
             ORDER BY s.hora_servicio ASC");
        
        $total = mysqli_num_rows($res);
        if ($total == 0) return "No hay servicios programados para hoy (" . date('d/m/Y') . ").";
        
        $txt = "📅 Servicios de hoy — " . date('d/m/Y') . " ($total en total):\n\n";
        while ($f = mysqli_fetch_assoc($res)) {
            $cli = $f['cliente'] ?? 'Sin cliente';
            $plc = $f['placa'] ? " [{$f['placa']}]" : "";
            $txt .= "• #{$f['id']} - {$cli}{$plc}\n  Hora: {$f['hora_servicio']} | {$f['origen']} → {$f['destino']}\n  Estado: {$f['estado_servicio']}\n\n";
        }
        return trim($txt);
    }

    // 3. ESTADO DE UN SERVICIO POR ID
    if (tiene($p, ['estado', 'servicio', 'guia']) && preg_match('/#?(\d+)/', $p, $m)) {
        $id = (int)$m[1];
        $res = mysqli_query($conn,
            "SELECT s.*, c.nombre AS cliente, v.placa, co.nombre AS conductor
             FROM servicios s
             LEFT JOIN clientes c ON s.cliente_id = c.id
             LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
             LEFT JOIN conductores co ON s.conductor_id = co.id
             WHERE s.id = $id LIMIT 1");
        
        if (!$f = mysqli_fetch_assoc($res)) return "No encontré el servicio #$id en el sistema.";
        
        return "📦 Información del Servicio #{$f['id']}:\n\n" .
               "• Cliente: " . ($f['cliente'] ?? 'No asignado') . "\n" .
               "• Fecha: " . date('d/m/Y', strtotime($f['fecha_servicio'])) . " {$f['hora_servicio']}\n" .
               "• Ruta: {$f['origen']} → {$f['destino']}\n" .
               "• Vehículo: " . ($f['placa'] ?? 'No asignado') . "\n" .
               "• Conductor: " . ($f['conductor'] ?? 'No asignado') . "\n" .
               "• Guía Transportista: {$f['guia_transportista']}\n" .
               "• Monto: S/ " . number_format($f['precio_cliente'], 2) . "\n" .
               "• Estado: " . strtoupper($f['estado_servicio']);
    }

    // 4. FACTURACIÓN DEL MES
    if (tiene($p, ['facturacion', 'facturado', 'ingresos', 'ventas', 'cuanto se facturo', 'cuanto vendimos'])) {
        $mes = date('m');
        $anio = date('Y');
        $res = mysqli_query($conn, "SELECT IFNULL(SUM(precio_cliente),0) AS total, COUNT(*) AS cant FROM servicios WHERE MONTH(fecha_servicio)='$mes' AND YEAR(fecha_servicio)='$anio'");
        $f = mysqli_fetch_assoc($res);
        $total = number_format($f['total'], 2);
        $meses = ['01'=>'Enero','02'=>'Febrero','03'=>'Marzo','04'=>'Abril','05'=>'Mayo','06'=>'Junio',
                  '07'=>'Julio','08'=>'Agosto','09'=>'Septiembre','10'=>'Octubre','11'=>'Noviembre','12'=>'Diciembre'];
        $nombreMes = $meses[$mes];
        return "💰 Facturación de $nombreMes $anio:\n\n• Total facturado: S/ $total\n• Total de servicios realizados: {$f['cant']}";
    }

    // 5. GASTOS DEL MES
    if (tiene($p, ['gasto', 'gastos', 'egresos', 'cuanto se gasto'])) {
        $mes = date('m');
        $anio = date('Y');
        $r1 = mysqli_query($conn, "SELECT IFNULL(SUM(monto),0) AS total FROM gastos_operativos WHERE MONTH(fecha)='$mes' AND YEAR(fecha)='$anio'");
        $g_op = mysqli_fetch_assoc($r1)['total'];
        $r2 = mysqli_query($conn, "SELECT IFNULL(SUM(monto),0) AS total FROM gastos_administrativos WHERE MONTH(fecha)='$mes' AND YEAR(fecha)='$anio'");
        $g_ad = mysqli_fetch_assoc($r2)['total'];
        $total = number_format($g_op + $g_ad, 2);
        return "⛽ Gastos del mes actual:\n\n• Gastos Operativos (flota): S/ " . number_format($g_op, 2) . "\n• Gastos Administrativos: S/ " . number_format($g_ad, 2) . "\n• Total de Gastos: S/ $total";
    }

    // 6. UTILIDAD DEL MES
    if (tiene($p, ['utilidad', 'ganancia', 'margen', 'rentabilidad'])) {
        $mes = date('m');
        $anio = date('Y');
        $rf = mysqli_query($conn, "SELECT IFNULL(SUM(precio_cliente),0) AS total FROM servicios WHERE MONTH(fecha_servicio)='$mes' AND YEAR(fecha_servicio)='$anio'");
        $fac = (float)mysqli_fetch_assoc($rf)['total'];
        $r1 = mysqli_query($conn, "SELECT IFNULL(SUM(monto),0) AS total FROM gastos_operativos WHERE MONTH(fecha)='$mes' AND YEAR(fecha)='$anio'");
        $g_op = (float)mysqli_fetch_assoc($r1)['total'];
        $r2 = mysqli_query($conn, "SELECT IFNULL(SUM(monto),0) AS total FROM gastos_administrativos WHERE MONTH(fecha)='$mes' AND YEAR(fecha)='$anio'");
        $g_ad = (float)mysqli_fetch_assoc($r2)['total'];
        $ut = $fac - ($g_op + $g_ad);
        return "📈 Utilidad Neta del Mes:\n\n• Facturación: S/ " . number_format($fac, 2) . "\n• Total Gastos: S/ " . number_format($g_op + $g_ad, 2) . "\n• Utilidad Neta: S/ " . number_format($ut, 2);
    }

    // 7. CONDUCTORES DISPONIBLES HOY
    if (tiene($p, ['conductor', 'conductores', 'chofer', 'choferes', 'disponibles hoy', 'quien esta libre'])) {
        $hoy = date('Y-m-d');
        $res = mysqli_query($conn,
            "SELECT nombre, telefono FROM conductores
             WHERE estado = 'activo'
             AND id NOT IN (
                 SELECT conductor_id FROM servicios
                 WHERE fecha_servicio = '$hoy'
                 AND estado_servicio != 'cancelado'
             )");
        $total = mysqli_num_rows($res);
        if ($total == 0) return "No hay conductores disponibles para hoy (todos asignados o en descanso).";
        $txt = "🧑‍✈️ Conductores disponibles hoy ($total):\n\n";
        while ($f = mysqli_fetch_assoc($res)) {
            $txt .= "• {$f['nombre']}" . ($f['telefono'] ? " — Tel: {$f['telefono']}" : "") . "\n";
        }
        return trim($txt);
    }

    // RESPUESTA POR DEFECTO
    return "No logré entender tu consulta. Intenta preguntando por:\n• 'servicios de hoy'\n• 'facturacion del mes'\n• 'gastos del mes'\n• 'utilidad'\n• 'conductores disponibles'\n• 'estado del servicio #ID'";
}

function tiene($texto, $palabras) {
    foreach ($palabras as $palabra) {
        if (strpos($texto, $palabra) !== false) return true;
    }
    return false;
}
?>
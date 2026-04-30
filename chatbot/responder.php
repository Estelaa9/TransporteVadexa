<?php
session_start();
require_once '../config/conexion.php';

// Solo permitir acceso si hay sesión activa
if (!isset($_SESSION['usuario'])) {
    echo json_encode(['respuesta' => 'Sesión no válida.']);
    exit;
}

$pregunta = strtolower(trim($_POST['pregunta'] ?? ''));
echo json_encode(['respuesta' => responder($pregunta, $conn)]);

// ─────────────────────────────────────────────
function responder($p, $conn) {

    // SALUDO
    if (tiene($p, ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos'])) {
        return "¡Hola! Soy el asistente de VADEXSA 👋\n\nPuedo ayudarte con:\n• Servicios del día\n• Estado de un servicio (#ID)\n• Facturación del mes\n• Gastos del mes\n• Utilidad del mes\n• Conductores disponibles hoy\n• Cómo usar el sistema";
    }

    // SERVICIOS DE HOY
    if (tiene($p, ['servicio hoy', 'servicios hoy', 'servicios de hoy', 'hay hoy', 'programados hoy', 'cuantos servicios'])) {
        $hoy = date('Y-m-d');
        $res = mysqli_query($conn,
            "SELECT s.id, c.nombre AS cliente, s.hora_servicio, s.origen, s.destino, s.estado_servicio
             FROM servicios s
             JOIN clientes c ON s.cliente_id = c.id
             WHERE s.fecha_servicio = '$hoy'
             ORDER BY s.hora_servicio");
        $total = mysqli_num_rows($res);
        if ($total == 0) return "No hay servicios programados para hoy (" . date('d/m/Y') . ").";
        $txt = "Servicios de hoy — " . date('d/m/Y') . " ($total en total):\n\n";
        while ($f = mysqli_fetch_assoc($res)) {
            $txt .= "• #{$f['id']} {$f['cliente']}\n  {$f['hora_servicio']} | {$f['origen']} → {$f['destino']}\n  Estado: {$f['estado_servicio']}\n\n";
        }
        return trim($txt);
    }

    // ESTADO DE UN SERVICIO POR ID
    if (tiene($p, ['estado', 'servicio']) && preg_match('/#?(\d+)/', $p, $m)) {
        $id = (int)$m[1];
        $res = mysqli_query($conn,
            "SELECT s.id, s.estado_servicio, s.fecha_servicio, s.hora_servicio,
                    s.origen, s.destino, c.nombre AS cliente,
                    CONCAT(con.nombre, ' ', con.apellido) AS conductor
             FROM servicios s
             JOIN clientes c ON s.cliente_id = c.id
             JOIN conductores con ON s.conductor_id = con.id
             WHERE s.id = $id");
        if (!$f = mysqli_fetch_assoc($res)) return "No encontré el servicio #$id.";
        return "Servicio #{$f['id']}\n" .
               "Cliente: {$f['cliente']}\n" .
               "Fecha: {$f['fecha_servicio']} {$f['hora_servicio']}\n" .
               "Ruta: {$f['origen']} → {$f['destino']}\n" .
               "Conductor: {$f['conductor']}\n" .
               "Estado: {$f['estado_servicio']}";
    }

    // FACTURACIÓN DEL MES
    if (tiene($p, ['facturacion', 'facturación', 'ingresos', 'ventas del mes', 'cuanto facturamos', 'cuánto facturamos'])) {
        $mes = date('Y-m');
        $f = mysqli_fetch_assoc(mysqli_query($conn,
            "SELECT COUNT(*) total, COALESCE(SUM(precio_cliente),0) monto
             FROM servicios
             WHERE DATE_FORMAT(fecha_servicio,'%Y-%m') = '$mes'"));
        return "Facturación de " . date('F Y') . ":\n" .
               "• Servicios: {$f['total']}\n" .
               "• Total: S/ " . number_format($f['monto'], 2);
    }

    // GASTOS DEL MES
    if (tiene($p, ['gasto', 'gastos', 'egresos', 'cuanto gastamos', 'cuánto gastamos'])) {
        $mes = date('Y-m');
        $op  = mysqli_fetch_assoc(mysqli_query($conn,
            "SELECT COALESCE(SUM(monto),0) t FROM gastos_operativos WHERE DATE_FORMAT(fecha,'%Y-%m')='$mes'"));
        $adm = mysqli_fetch_assoc(mysqli_query($conn,
            "SELECT COALESCE(SUM(monto),0) t FROM gastos_administrativos WHERE DATE_FORMAT(fecha,'%Y-%m')='$mes'"));
        $total = $op['t'] + $adm['t'];
        return "Gastos de " . date('F Y') . ":\n" .
               "• Operativos: S/ " . number_format($op['t'], 2) . "\n" .
               "• Administrativos: S/ " . number_format($adm['t'], 2) . "\n" .
               "• Total: S/ " . number_format($total, 2);
    }

    // UTILIDAD DEL MES
    if (tiene($p, ['utilidad', 'ganancia', 'rentabilidad', 'cuanto ganamos', 'cuánto ganamos'])) {
        $mes = date('Y-m');
        $ing = mysqli_fetch_assoc(mysqli_query($conn,
            "SELECT COALESCE(SUM(precio_cliente),0) t FROM servicios WHERE DATE_FORMAT(fecha_servicio,'%Y-%m')='$mes'"));
        $op  = mysqli_fetch_assoc(mysqli_query($conn,
            "SELECT COALESCE(SUM(monto),0) t FROM gastos_operativos WHERE DATE_FORMAT(fecha,'%Y-%m')='$mes'"));
        $adm = mysqli_fetch_assoc(mysqli_query($conn,
            "SELECT COALESCE(SUM(monto),0) t FROM gastos_administrativos WHERE DATE_FORMAT(fecha,'%Y-%m')='$mes'"));
        $util = $ing['t'] - $op['t'] - $adm['t'];
        return "Utilidad estimada de " . date('F Y') . ":\n" .
               "• Ingresos: S/ " . number_format($ing['t'], 2) . "\n" .
               "• Gastos: S/ " . number_format($op['t'] + $adm['t'], 2) . "\n" .
               "─────────────────\n" .
               "• Utilidad: S/ " . number_format($util, 2);
    }

    // CONDUCTORES DISPONIBLES HOY
    if (tiene($p, ['conductor', 'chofer', 'disponible', 'libre hoy'])) {
        $hoy = date('Y-m-d');
        $res = mysqli_query($conn,
            "SELECT CONCAT(nombre, ' ', apellido) AS nombre FROM conductores
             WHERE id NOT IN (
                 SELECT conductor_id FROM servicios
                 WHERE fecha_servicio = '$hoy' AND estado_servicio != 'cancelado'
             )");
        if (mysqli_num_rows($res) == 0)
            return "Todos los conductores tienen servicio asignado hoy.";
        $txt = "Conductores disponibles hoy:\n";
        while ($f = mysqli_fetch_assoc($res)) $txt .= "• {$f['nombre']}\n";
        return trim($txt);
    }

    // TOTAL DE CLIENTES
    if (tiene($p, ['cuantos clientes', 'cuántos clientes', 'total clientes', 'clientes registrados'])) {
        $f = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) t FROM clientes"));
        return "Tienes {$f['t']} clientes registrados en el sistema.";
    }

    // TOTAL DE VEHÍCULOS
    if (tiene($p, ['vehiculo', 'vehículo', 'unidades', 'flota', 'cuantos vehiculos'])) {
        $f = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) t FROM vehiculos"));
        return "La flota cuenta con {$f['t']} vehículos registrados.";
    }

    // ── PREGUNTAS DE PROCESO ──────────────────────────────────

    if (tiene($p, ['registrar servicio', 'nuevo servicio', 'crear servicio', 'agregar servicio']))
        return "Para registrar un servicio:\n1. Ve a Servicios → Nuevo\n2. Completa fecha, hora, cliente, vehículo y conductor\n3. Ingresa origen, destino y precio al cliente\n4. Selecciona tipo de comprobante\n5. Guarda — se generará la guía GRT automáticamente.";

    if (tiene($p, ['cambiar estado', 'actualizar estado', 'pasar a en ruta', 'pasar a finalizado']))
        return "Para cambiar el estado de un servicio:\n1. Ve a Servicios → Programación\n2. Elige la fecha del servicio\n3. Usa los botones:\n   • Programado → En ruta\n   • En ruta → Finalizado";

    if (tiene($p, ['registrar gasto', 'nuevo gasto', 'agregar gasto']))
        return "Para registrar un gasto:\n• Gasto operativo: ve a Gastos Operativos → Nuevo\n• Gasto administrativo: ve a Gastos Administrativos → Nuevo\nIngresa fecha, descripción y monto, luego guarda.";

    if (tiene($p, ['factura', 'boleta', 'comprobante', 'igv']))
        return "El sistema genera comprobantes automáticamente:\n• Factura → serie F001-XXXXXX\n• Boleta → serie B001-XXXXXX\n• Sin comprobante → no se calcula IGV\nEl IGV se calcula al 18% sobre el precio al cliente.";

    if (tiene($p, ['guia', 'guía', 'grt', 'guia de remision']))
        return "La guía de remisión transportista (GRT) se genera automáticamente al crear el servicio con el formato GRT-000001. No necesitas crearla manualmente.";

    if (tiene($p, ['login', 'contraseña', 'clave', 'acceso', 'usuario']))
        return "Para cambiar tu contraseña:\n1. Ve al módulo Usuarios\n2. Selecciona tu usuario\n3. Usa la opción Cambiar Contraseña\n\nSi olvidaste tu clave, contacta al administrador del sistema.";

    if (tiene($p, ['reporte', 'reportes', 'informe']))
        return "Los reportes disponibles están en el módulo Reportes:\n• Servicios del período\n• Facturación\n• Utilidad\n• Facturación por cliente\n\nTodos se pueden exportar a Excel o imprimir.";

    // NO ENTENDIDA
    return "No entendí tu pregunta. Intenta con algo como:\n\n• \"servicios de hoy\"\n• \"estado del servicio #25\"\n• \"facturación del mes\"\n• \"gastos del mes\"\n• \"utilidad del mes\"\n• \"conductores disponibles\"\n• \"cómo registrar un servicio\"";
}

// ─────────────────────────────────────────────
function tiene($texto, $palabras) {
    foreach ($palabras as $p)
        if (strpos($texto, $p) !== false) return true;
    return false;
}
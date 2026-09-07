<?php
// servicios/guardar.php - Registrar nuevo servicio con validaciones de negocio
require_once __DIR__ . "/../config/conexion.php";
require_auth();

$data = get_request_data();

// ============================
// DATOS DEL FORMULARIO
// ============================

$fecha = mysqli_real_escape_string($conn, trim($data['fecha_servicio'] ?? ''));
$hora = mysqli_real_escape_string($conn, trim($data['hora_servicio'] ?? $data['hora'] ?? '00:00:00'));

$cliente = (int)($data['cliente_id'] ?? 0);
$vehiculo = (int)($data['vehiculo_id'] ?? 0);
$conductor = (int)($data['conductor_id'] ?? 0);

$tipo_servicio = mysqli_real_escape_string($conn, trim($data['tipo_servicio'] ?? 'Local'));
$tipo_carga = mysqli_real_escape_string($conn, trim($data['tipo_carga'] ?? 'General'));

$modalidad = mysqli_real_escape_string($conn, trim($data['modalidad'] ?? 'propio'));
$forma_pago = mysqli_real_escape_string($conn, trim($data['forma_pago'] ?? 'Contado'));

$origen = mysqli_real_escape_string($conn, trim($data['origen'] ?? ''));
$destino = mysqli_real_escape_string($conn, trim($data['destino'] ?? ''));

$monto = floatval($data['precio_cliente'] ?? 0);
$costo_proveedor = isset($data['costo_proveedor']) ? floatval($data['costo_proveedor']) : 0;

$guia_remitente = mysqli_real_escape_string($conn, trim($data['guia_remitente'] ?? ''));
$estado = mysqli_real_escape_string($conn, trim($data['estado_servicio'] ?? 'programado'));
$tipo_comprobante = mysqli_real_escape_string($conn, trim($data['tipo_comprobante'] ?? 'FACTURA'));

// Validaciones básicas
if (empty($fecha) || empty($cliente) || empty($vehiculo) || empty($conductor) || empty($origen) || empty($destino)) {
    json_response(["success" => false, "error" => "Por favor complete todos los campos obligatorios (*)."], 400);
}

// ============================
// CONTROL MODALIDAD
// ============================
if ($modalidad == "propio") {
    $costo_proveedor = 0;
}

// ============================
// CALCULO IGV
// ============================
$base = $monto;
$igv = 0;

if ($tipo_comprobante != "SIN_COMPROBANTE") {
    $base = round($monto / 1.18, 2);
    $igv = round($monto - $base, 2);
}

// ============================
// CALCULO UTILIDAD
// ============================
$utilidad = $monto - $costo_proveedor;

// ============================
// VALIDAR VEHICULO OCUPADO
// ============================
if (!empty($hora) && $hora !== '00:00:00') {
    $verificar = "SELECT id FROM servicios 
                  WHERE vehiculo_id='$vehiculo' 
                  AND fecha_servicio='$fecha'
                  AND hora_servicio='$hora'
                  AND estado_servicio != 'cancelado'";
    $res = mysqli_query($conn, $verificar);

    if (mysqli_num_rows($res) > 0) {
        json_response(["success" => false, "error" => "⚠ Este vehículo ya tiene un servicio programado en esa fecha y horario."], 409);
    }

    // ============================
    // VALIDAR CONDUCTOR OCUPADO
    // ============================
    $verificar_conductor = "SELECT id FROM servicios 
                            WHERE conductor_id='$conductor' 
                            AND fecha_servicio='$fecha'
                            AND hora_servicio='$hora'
                            AND estado_servicio != 'cancelado'";
    $res2 = mysqli_query($conn, $verificar_conductor);

    if (mysqli_num_rows($res2) > 0) {
        json_response(["success" => false, "error" => "⚠ Este conductor ya tiene un servicio asignado en esa fecha y horario."], 409);
    }
}

// ============================
// GENERAR GUIA TRANSPORTISTA
// ============================
$consulta_guia = "SELECT IFNULL(MAX(id),0) as ultimo FROM servicios";
$res_guia = mysqli_query($conn, $consulta_guia);
$row_guia = mysqli_fetch_assoc($res_guia);
$num_guia = (int)($row_guia['ultimo'] ?? 0) + 1;
$guia_transportista = "GRT-" . str_pad($num_guia, 6, "0", STR_PAD_LEFT);

// ============================
// GENERAR NUMERO COMPROBANTE
// ============================
$numero_factura = trim($data['numero_factura'] ?? '');

if (empty($numero_factura)) {
    if ($tipo_comprobante == "FACTURA") {
        $consulta = "SELECT COUNT(*) as total FROM servicios WHERE tipo_comprobante='FACTURA'";
        $res = mysqli_query($conn, $consulta);
        $row = mysqli_fetch_assoc($res);
        $num = (int)($row['total'] ?? 0) + 1;
        $numero_factura = "F001-" . str_pad($num, 6, "0", STR_PAD_LEFT);
    } elseif ($tipo_comprobante == "BOLETA") {
        $consulta = "SELECT COUNT(*) as total FROM servicios WHERE tipo_comprobante='BOLETA'";
        $res = mysqli_query($conn, $consulta);
        $row = mysqli_fetch_assoc($res);
        $num = (int)($row['total'] ?? 0) + 1;
        $numero_factura = "B001-" . str_pad($num, 6, "0", STR_PAD_LEFT);
    } else {
        $numero_factura = "";
    }
}

// ============================
// INSERTAR SERVICIO
// ============================
$sql = "INSERT INTO servicios
(
    fecha_servicio,
    hora_servicio,
    cliente_id,
    vehiculo_id,
    conductor_id,
    tipo_servicio,
    tipo_carga,
    modalidad,
    forma_pago,
    origen,
    destino,
    precio_cliente,
    base_imponible,
    igv,
    costo_proveedor,
    utilidad,
    guia_remitente,
    guia_transportista,
    numero_factura,
    tipo_comprobante,
    estado_servicio
)
VALUES
(
    '$fecha',
    '$hora',
    '$cliente',
    '$vehiculo',
    '$conductor',
    '$tipo_servicio',
    '$tipo_carga',
    '$modalidad',
    '$forma_pago',
    '$origen',
    '$destino',
    '$monto',
    '$base',
    '$igv',
    '$costo_proveedor',
    '$utilidad',
    '$guia_remitente',
    '$guia_transportista',
    '$numero_factura',
    '$tipo_comprobante',
    '$estado'
)";

if (mysqli_query($conn, $sql)) {
    $nuevo_id = mysqli_insert_id($conn);
    
    // Si es petición AJAX / JSON
    if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || !empty($data)) {
        json_response([
            "success" => true,
            "message" => "Servicio registrado correctamente con Guía {$guia_transportista}",
            "id" => $nuevo_id,
            "guia_transportista" => $guia_transportista,
            "numero_factura" => $numero_factura
        ], 201);
    }

    header("Location: index.php");
    exit;
} else {
    json_response(["success" => false, "error" => "Error al guardar el servicio: " . mysqli_error($conn)], 500);
}
?>
<?php
require_once __DIR__ . '/../config/conexion.php';
require_auth();
require_once __DIR__ . '/../config/gestion.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Método no permitido.'], 405);
}
$data = get_request_data();
if (!is_string($data['csrf_token'] ?? null) || empty($_SESSION['facturas_csrf']) ||
    !hash_equals($_SESSION['facturas_csrf'], $data['csrf_token'])) {
    json_response(['success' => false, 'error' => 'Sesión de formulario inválida. Actualice el módulo.'], 403);
}
$id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);
$estado = $data['estado_pago'] ?? '';
$numero = $data['numero_factura'] ?? '';
$fecha = $data['fecha_pago'] ?? null;
if (!$id || $id < 1 || !is_string($numero) || trim($numero) === '' ||
    !in_array($estado, ['por_pagar', 'pagada'], true)) {
    json_response(['success' => false, 'error' => 'Factura o estado de pago inválido.'], 400);
}
if ($estado === 'pagada') {
    $date = is_string($fecha) ? DateTimeImmutable::createFromFormat('!Y-m-d', $fecha) : false;
    if (!$date || $date->format('Y-m-d') !== $fecha || $fecha > date('Y-m-d')) {
        json_response(['success' => false, 'error' => 'Ingrese una fecha de pago válida que no sea futura.'], 400);
    }
} else {
    $fecha = null;
}
try {
    mysqli_begin_transaction($conn);
    $stmt = mysqli_prepare($conn, "SELECT numero_factura FROM servicios WHERE id = ? AND estado_servicio <> 'cancelado' AND tipo_comprobante IN ('FACTURA', 'BOLETA') FOR UPDATE");
    mysqli_stmt_bind_param($stmt, 'i', $id);
    mysqli_stmt_execute($stmt);
    $servicio = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    if (!$servicio || $servicio['numero_factura'] !== $numero) {
        mysqli_rollback($conn);
        json_response(['success' => false, 'error' => 'El comprobante cambió o ya no existe. Actualice el listado.'], 409);
    }
    if ($estado === 'pagada') {
        $abonos = gestion_query($conn, 'SELECT MAX(fecha) FROM servicio_abonos WHERE servicio_id=?', 'i', [$id]);
        $ultima = mysqli_fetch_row(mysqli_stmt_get_result($abonos))[0];
        if ($ultima && $fecha < $ultima) {
            mysqli_rollback($conn);
            json_response(['success'=>false,'error'=>'El pago total no puede ser anterior al último abono registrado.'],422);
        }
    }
    $usuario = is_string($_SESSION['usuario']) ? $_SESSION['usuario'] : (string)($_SESSION['nombre'] ?? 'Usuario');
    $stmt = mysqli_prepare($conn, "INSERT INTO factura_pagos
        (servicio_id, numero_factura, estado_pago, fecha_pago, actualizado_por)
        VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
        estado_pago = VALUES(estado_pago), fecha_pago = VALUES(fecha_pago), actualizado_por = VALUES(actualizado_por)");
    mysqli_stmt_bind_param($stmt, 'issss', $id, $numero, $estado, $fecha, $usuario);
    if (!mysqli_stmt_execute($stmt)) {
        throw new RuntimeException('No se pudo guardar el pago.');
    }
    mysqli_commit($conn);
    json_response(['success' => true, 'message' => 'Estado de pago actualizado.']);
} catch (Throwable $e) {
    mysqli_rollback($conn);
    error_log('Pago de factura: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'No se pudo guardar el estado de pago.'], 500);
}

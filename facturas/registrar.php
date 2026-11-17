<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/gestion.php';
require_admin();
$data = get_request_data();
gestion_post($data);
$id = (int)($data['id'] ?? 0);
$tipo = $data['tipo_comprobante'] ?? '';
$numero = strtoupper(trim($data['numero_factura'] ?? ''));
if (!in_array($tipo, ['FACTURA', 'BOLETA'], true) || !preg_match('/^[FB][A-Z0-9]{3}-[0-9]{1,8}$/', $numero) || $numero[0] !== ($tipo === 'FACTURA' ? 'F' : 'B')) {
    json_response(['success' => false, 'error' => 'Ingrese tipo y número válidos (F001-000001 o B001-000001).'], 422);
}
$fechaEmision = trim((string)($data['fecha_emision'] ?? ''));
if ($fechaEmision === '') {
    $fechaEmision = date('Y-m-d');
}
if (!gestion_fecha($fechaEmision) || $fechaEmision > date('Y-m-d')) {
    json_response(['success' => false, 'error' => 'Ingrese una fecha de emisión válida que no sea futura.'], 422);
}
try {
    // Serializa el registro para impedir que dos servicios reciban el mismo número.
    $lock = mysqli_fetch_row(mysqli_query($conn, "SELECT GET_LOCK('vadexsa_comprobantes', 5)"));
    if ((int)$lock[0] !== 1) throw new RuntimeException('No se obtuvo bloqueo.');
    mysqli_begin_transaction($conn);
    $stmt = gestion_query($conn, 'SELECT * FROM servicios WHERE id = ? FOR UPDATE', 'i', [$id]);
    $s = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    if (!$s || $s['estado_servicio'] === 'cancelado' || trim($s['numero_factura'] ?? '') !== '') throw new InvalidArgumentException('El servicio no está disponible para registrar un comprobante.');
    $detraccion = gestion_monto($data['monto_detraccion'] ?? 0);
    if ($detraccion > (float)$s['precio_cliente']) throw new InvalidArgumentException('La detracción no puede superar el precio del servicio.');
    $dup = gestion_query($conn, 'SELECT id FROM servicios WHERE numero_factura = ? LIMIT 1', 's', [$numero]);
    if (mysqli_fetch_assoc(mysqli_stmt_get_result($dup))) throw new InvalidArgumentException('Este número ya está registrado.');
    $base = round((float)$s['precio_cliente'] / 1.18, 2);
    $igv = round((float)$s['precio_cliente'] - $base, 2);
    gestion_query($conn, 'UPDATE servicios SET tipo_comprobante=?, numero_factura=?, fecha_emision=?, base_imponible=?, igv=? WHERE id=?', 'sssddi', [$tipo, $numero, $fechaEmision, $base, $igv, $id]);
    gestion_query($conn, 'UPDATE servicios SET monto_detraccion=? WHERE id=?', 'di', [$detraccion, $id]);
    mysqli_commit($conn);
    mysqli_query($conn, "SELECT RELEASE_LOCK('vadexsa_comprobantes')");
    json_response(['success' => true]);
} catch (Throwable $e) {
    mysqli_rollback($conn);
    mysqli_query($conn, "SELECT RELEASE_LOCK('vadexsa_comprobantes')");
    error_log($e->getMessage());
    json_response(['success' => false, 'error' => $e instanceof InvalidArgumentException ? $e->getMessage() : 'No se pudo registrar el comprobante.'], $e instanceof InvalidArgumentException ? 409 : 500);
}

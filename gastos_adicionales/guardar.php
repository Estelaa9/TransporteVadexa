<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/gestion.php';
require_admin();
$data = get_request_data();
gestion_post($data);
try {
    $fecha = $data['fecha'] ?? '';
    $concepto = trim($data['concepto'] ?? '');
    $monto = gestion_monto($data['monto'] ?? '');
    $id = (int)($data['servicio_id'] ?? 0) ?: null;
    if (!gestion_fecha($fecha) || $concepto === '' || mb_strlen($concepto) > 255 || $monto <= 0) throw new InvalidArgumentException('Ingrese fecha, concepto e importe positivo.');
    if ($id) {
        $s = gestion_query($conn, 'SELECT id FROM servicios WHERE id=?', 'i', [$id]);
        if (!mysqli_fetch_assoc(mysqli_stmt_get_result($s))) throw new InvalidArgumentException('Servicio no encontrado.');
    }
    gestion_query($conn, 'INSERT INTO gastos_adicionales (servicio_id, fecha, concepto, monto, registrado_por) VALUES (?, ?, ?, ?, ?)', 'issds', [$id, $fecha, $concepto, $monto, $_SESSION['usuario']]);
    json_response(['success' => true], 201);
} catch (InvalidArgumentException $e) {
    json_response(['success' => false, 'error' => $e->getMessage()], 422);
} catch (Throwable $e) {
    error_log($e->getMessage());
    json_response(['success' => false, 'error' => 'No se pudo guardar el gasto adicional.'], 500);
}

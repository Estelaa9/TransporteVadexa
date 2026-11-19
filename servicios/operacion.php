<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/gestion.php';
require_auth();
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') require_method('GET', 'POST');
try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = gestion_query($conn, 'SELECT * FROM servicio_operacion WHERE servicio_id = ?', 'i', [(int)($_GET['id'] ?? 0)]);
        json_response(['success' => true, 'data' => mysqli_fetch_assoc(mysqli_stmt_get_result($stmt)) ?: null, 'csrf_token' => gestion_csrf()]);
    }
    $data = get_request_data();
    gestion_post($data);
    $id = (int)($data['servicio_id'] ?? 0);
    $stmt = gestion_query($conn, 'SELECT id, modalidad FROM servicios WHERE id = ?', 'i', [$id]);
    $servicio = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    if (!$servicio) json_response(['success' => false, 'error' => 'Servicio no encontrado.'], 404);
    $proveedor = (int)($data['proveedor_id'] ?? 0) ?: null;
    if ($servicio['modalidad'] === 'propio') $proveedor = null;
    if ($servicio['modalidad'] === 'tercerizado' && !$proveedor) throw new InvalidArgumentException('Seleccione el proveedor del servicio tercerizado.');
    if ($proveedor) {
        $check = gestion_query($conn, 'SELECT id FROM proveedores WHERE id = ?', 'i', [$proveedor]);
        if (!mysqli_fetch_assoc(mysqli_stmt_get_result($check))) throw new InvalidArgumentException('Proveedor no válido.');
    }
    $fields = ['provincia' => 100, 'distrito' => 100, 'referencia' => 255, 'contacto' => 150, 'telefono' => 40, 'almacen' => 150, 'temporada' => 100, 'frecuencia' => 100, 'observaciones' => 4000];
    $values = [];
    foreach ($fields as $name => $max) {
        $value = trim((string)($data[$name] ?? ''));
        if (mb_strlen($value) > $max) throw new InvalidArgumentException("El campo $name es demasiado largo.");
        $values[] = $value;
    }
    mysqli_begin_transaction($conn);
    gestion_query($conn, 'UPDATE servicios SET proveedor_id=? WHERE id=?', 'ii', [$proveedor, $id]);
    gestion_query($conn, 'INSERT INTO servicio_operacion (servicio_id, proveedor_id, provincia, distrito, referencia, contacto, telefono, almacen, temporada, frecuencia, observaciones, actualizado_por)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE proveedor_id=VALUES(proveedor_id), provincia=VALUES(provincia), distrito=VALUES(distrito), referencia=VALUES(referencia), contacto=VALUES(contacto), telefono=VALUES(telefono), almacen=VALUES(almacen), temporada=VALUES(temporada), frecuencia=VALUES(frecuencia), observaciones=VALUES(observaciones), actualizado_por=VALUES(actualizado_por)',
        'ii' . str_repeat('s', 10), array_merge([$id, $proveedor], $values, [$_SESSION['usuario']]));
    auditar("editar", "servicio_operacion", $id, null, array_combine(array_keys($fields), $values) + ["proveedor_id" => $proveedor]);
    mysqli_commit($conn);
    json_response(['success' => true]);
} catch (InvalidArgumentException $e) {
    json_response(['success' => false, 'error' => $e->getMessage()], 422);
} catch (Throwable $e) {
    mysqli_rollback($conn);
    error_log($e->getMessage());
    json_response(['success' => false, 'error' => 'No se pudo procesar la ficha. Verifique la migración migrations/20260922_gestion.sql.'], 500);
}

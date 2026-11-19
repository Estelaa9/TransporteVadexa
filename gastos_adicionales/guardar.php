<?php
// gastos_adicionales/guardar.php - Gasto adicional del cierre (permiso cierre:crear).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
require_method('POST');
$data = get_request_data();
crud_ejecutar(function () use ($conn, $data) {
    $fecha = (string)($data['fecha'] ?? '');
    if (!validar_fecha($fecha) || $fecha > date('Y-m-d')) throw new InvalidArgumentException('Ingrese una fecha válida que no sea futura.');
    $concepto = validar_texto($data['concepto'] ?? '', 'concepto', 255, true);
    $monto = validar_monto($data['monto'] ?? '', true);
    $servicioId = (int)($data['servicio_id'] ?? 0) ?: null;
    if ($servicioId && !db_one($conn, 'SELECT id FROM servicios WHERE id = ?', 'i', [$servicioId])) throw new InvalidArgumentException('Servicio no encontrado.');
    db_query($conn, 'INSERT INTO gastos_adicionales (servicio_id, fecha, concepto, monto, registrado_por) VALUES (?, ?, ?, ?, ?)', 'issds',
        [$servicioId, $fecha, $concepto, $monto, $_SESSION['usuario']]);
    $id = mysqli_insert_id($conn);
    auditar('crear', 'gastos_adicionales', $id, null, compact('fecha', 'concepto', 'monto', 'servicioId'));
    json_response(['success' => true, 'id' => $id], 201);
});

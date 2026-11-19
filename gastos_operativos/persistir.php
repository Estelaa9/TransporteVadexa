<?php
// gastos_operativos/persistir.php - Alta y edición de gastos de flota.
// Corrige el error que impedía guardar (la columna real es tipo_gasto) y permite vincular el gasto a un servicio (NEG-03).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
crud_solo_incluido();
require_auth();
require_method('POST');
$data = get_request_data();

crud_ejecutar(function () use ($conn, $data) {
    $fecha = (string)($data['fecha'] ?? '');
    if (!validar_fecha($fecha) || $fecha > date('Y-m-d')) throw new InvalidArgumentException('Ingrese una fecha válida que no sea futura.');
    $vehiculoId = (int)($data['vehiculo_id'] ?? 0);
    if (!$vehiculoId || !db_one($conn, 'SELECT id FROM vehiculos WHERE id = ?', 'i', [$vehiculoId])) throw new InvalidArgumentException('Seleccione un vehículo registrado.');
    $servicioId = (int)($data['servicio_id'] ?? 0) ?: null;
    if ($servicioId) {
        $s = db_one($conn, 'SELECT id, vehiculo_id FROM servicios WHERE id = ?', 'i', [$servicioId]);
        if (!$s) throw new InvalidArgumentException('El servicio indicado no existe.');
        if ((int)$s['vehiculo_id'] !== $vehiculoId) throw new InvalidArgumentException('El servicio indicado no usó ese vehículo.');
    }
    crud_persistir($conn, 'gastos_operativos', [
        'fecha' => $fecha,
        'vehiculo_id' => $vehiculoId,
        'servicio_id' => $servicioId,
        'tipo_gasto' => validar_texto($data['tipo'] ?? $data['tipo_gasto'] ?? '', 'tipo', 50, true),
        'descripcion' => validar_texto($data['descripcion'] ?? '', 'descripción', 1000),
        'monto' => validar_monto($data['monto'] ?? '', true),
    ], 'Gasto operativo');
});

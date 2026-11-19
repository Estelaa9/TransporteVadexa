<?php
// gastos_administrativos/persistir.php - Alta y edición de gastos administrativos (columna tipo_gasto).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
crud_solo_incluido();
require_auth();
require_method('POST');
$data = get_request_data();

crud_ejecutar(function () use ($conn, $data) {
    $fecha = (string)($data['fecha'] ?? '');
    if (!validar_fecha($fecha) || $fecha > date('Y-m-d')) throw new InvalidArgumentException('Ingrese una fecha válida que no sea futura.');
    crud_persistir($conn, 'gastos_administrativos', [
        'fecha' => $fecha,
        'tipo_gasto' => validar_texto($data['tipo'] ?? $data['tipo_gasto'] ?? '', 'tipo', 50, true),
        'descripcion' => validar_texto($data['descripcion'] ?? '', 'descripción', 1000, true),
        'monto' => validar_monto($data['monto'] ?? '', true),
    ], 'Gasto administrativo');
});

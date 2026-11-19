<?php
// proveedores/persistir.php - Alta y edición de proveedores (transportistas tercerizados).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
crud_solo_incluido();
require_auth();
require_method('POST');
$data = get_request_data();

crud_ejecutar(function () use ($conn, $data) {
    $ruc = preg_replace('/\s+/', '', (string)($data['ruc'] ?? ''));
    if ($ruc !== '' && !validar_ruc($ruc)) throw new InvalidArgumentException('El RUC del proveedor no es válido.');
    crud_persistir($conn, 'proveedores', [
        'nombre' => validar_texto($data['nombre'] ?? '', 'nombre', 150, true),
        'ruc' => $ruc !== '' ? $ruc : null,
        'telefono' => validar_texto($data['telefono'] ?? '', 'teléfono', 20),
        'vehiculo' => validar_texto($data['vehiculo'] ?? '', 'vehículo', 100),
        'placa' => strtoupper(validar_texto($data['placa'] ?? '', 'placa', 20)),
        'estado' => validar_opcion($data['estado'] ?? 'activo', ['activo', 'inactivo'], 'estado'),
    ], 'Proveedor');
});

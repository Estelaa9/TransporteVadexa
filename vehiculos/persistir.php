<?php
// vehiculos/persistir.php - Alta y edición de vehículos (BD-07, BD-14).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
crud_solo_incluido();
require_auth();
require_method('POST');
$data = get_request_data();

crud_ejecutar(function () use ($conn, $data) {
    $placa = strtoupper(preg_replace('/\s+/', '', (string)($data['placa'] ?? '')));
    if (!preg_match('/^[A-Z0-9]{3}-?[A-Z0-9]{3}$/', $placa)) throw new InvalidArgumentException('Ingrese una placa válida (por ejemplo ABC-123).');
    $capacidadKg = trim((string)($data['capacidad_kg'] ?? ''));
    $capacidadKg = $capacidadKg === '' ? null : validar_monto($capacidadKg);
    crud_persistir($conn, 'vehiculos', [
        'placa' => $placa,
        'modelo' => validar_texto($data['modelo'] ?? '', 'modelo', 100),
        'tipo' => validar_texto($data['tipo'] ?? '', 'tipo', 50),
        'capacidad' => validar_texto($data['capacidad'] ?? '', 'capacidad', 50),
        'capacidad_kg' => $capacidadKg,
        'estado' => validar_opcion($data['estado'] ?? 'activo', ['activo', 'mantenimiento', 'inactivo'], 'estado'),
        'soat_vencimiento' => validar_fecha_opcional($data['soat_vencimiento'] ?? '', 'vencimiento del SOAT'),
        'revision_vencimiento' => validar_fecha_opcional($data['revision_vencimiento'] ?? '', 'vencimiento de la revisión técnica'),
    ], 'Vehículo');
});

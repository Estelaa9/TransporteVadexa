<?php
// conductores/persistir.php - Alta y edición de conductores (BD-07, BD-11).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
crud_solo_incluido();
require_auth();
require_method('POST');
$data = get_request_data();

crud_ejecutar(function () use ($conn, $data) {
    $licencia = strtoupper(preg_replace('/\s+/', '', (string)($data['licencia'] ?? '')));
    if (!preg_match('/^[A-Z0-9-]{5,20}$/', $licencia)) throw new InvalidArgumentException('Ingrese un número de licencia válido (5 a 20 caracteres).');
    $dni = preg_replace('/\D/', '', (string)($data['dni'] ?? ''));
    if ($dni !== '' && !validar_dni($dni)) throw new InvalidArgumentException('El DNI debe tener 8 dígitos.');
    $categoria = strtoupper(trim((string)($data['categoria_licencia'] ?? '')));
    if ($categoria !== '' && !preg_match('/^A-?(I|IIA|IIB|IIIA|IIIB|IIIC)$/', $categoria)) throw new InvalidArgumentException('Categoría de licencia no válida (A-I, A-IIa, A-IIb, A-IIIa, A-IIIb, A-IIIc).');
    crud_persistir($conn, 'conductores', [
        'nombre' => validar_texto($data['nombre'] ?? '', 'nombre', 150, true),
        'dni' => $dni !== '' ? $dni : null,
        'licencia' => $licencia,
        'categoria_licencia' => $categoria !== '' ? $categoria : null,
        'licencia_vencimiento' => validar_fecha_opcional($data['licencia_vencimiento'] ?? '', 'vencimiento de la licencia'),
        'telefono' => validar_texto($data['telefono'] ?? '', 'teléfono', 20),
        'direccion' => validar_texto($data['direccion'] ?? '', 'dirección', 255),
        'estado' => validar_opcion($data['estado'] ?? 'activo', ['activo', 'descanso', 'inactivo'], 'estado'),
    ], 'Conductor');
});

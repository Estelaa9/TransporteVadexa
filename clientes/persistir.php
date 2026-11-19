<?php
// clientes/persistir.php - Alta y edición de clientes (NEG-18, NEG-19, BD-10).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
crud_solo_incluido();
require_auth();
require_method('POST');
$data = get_request_data();

crud_ejecutar(function () use ($conn, $data) {
    $tipo = validar_opcion($data['tipo_cliente'] ?? 'Empresa', ['Empresa', 'Persona'], 'tipo de cliente');
    $documento = preg_replace('/\s+/', '', (string)($data['documento'] ?? ''));
    if ($tipo === 'Empresa' && !validar_ruc($documento)) throw new InvalidArgumentException('Ingrese un RUC válido de 11 dígitos (se verifica el dígito de control).');
    if ($tipo === 'Persona' && !validar_dni($documento) && !validar_ruc($documento)) throw new InvalidArgumentException('Ingrese un DNI de 8 dígitos o un RUC válido.');
    $email = validar_texto($data['email'] ?? '', 'correo', 150);
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('El correo electrónico no es válido.');
    $dias = (int)($data['dias_credito'] ?? 0);
    if (!in_array($dias, [0, 7, 15, 30, 45, 60], true)) throw new InvalidArgumentException('Los días de crédito deben ser 0, 7, 15, 30, 45 o 60.');
    crud_persistir($conn, 'clientes', [
        'nombre' => validar_texto($data['nombre'] ?? '', 'nombre o razón social', 150, true),
        'documento' => $documento,
        'telefono' => validar_texto($data['telefono'] ?? '', 'teléfono', 20),
        'email' => $email,
        'direccion' => validar_texto($data['direccion'] ?? '', 'dirección', 500),
        'tipo_cliente' => $tipo,
        'dias_credito' => $dias,
    ], 'Cliente');
});

<?php
// usuarios/index.php - Cuentas, roles disponibles y clientes vinculables (solo con permiso usuarios:ver).
require_once __DIR__ . '/../config/conexion.php';
require_auth();
require_method('GET');

$users = db_all($conn, 'SELECT u.id, u.nombre, u.usuario, u.rol, u.estado, u.cliente_id, c.nombre AS cliente, u.ultimo_acceso,
    u.debe_cambiar_password, (u.bloqueado_hasta IS NOT NULL AND u.bloqueado_hasta > NOW()) AS bloqueado
    FROM usuarios u LEFT JOIN clientes c ON c.id = u.cliente_id ORDER BY u.nombre, u.id');
$roles = db_all($conn, 'SELECT id, codigo, nombre, descripcion, es_sistema, activo FROM roles ORDER BY es_sistema DESC, nombre');
$clientes = db_all($conn, 'SELECT id, nombre, documento FROM clientes ORDER BY nombre LIMIT 5000');

json_response(['success' => true, 'data' => $users, 'roles' => $roles, 'clientes' => $clientes, 'csrf_token' => csrf_token()]);

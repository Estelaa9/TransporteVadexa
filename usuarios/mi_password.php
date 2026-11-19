<?php
// usuarios/mi_password.php - El propio usuario cambia su contraseña (obligatorio tras crear la cuenta).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/politica.php';
require_auth();
require_method('POST');
$data = get_request_data();
$actual = (string)($data['actual'] ?? '');
$nueva = (string)($data['nueva'] ?? '');

$row = db_one($conn, 'SELECT id, usuario, password FROM usuarios WHERE id = ?', 'i', [(int)$_SESSION['user_id']]);
$stored = (string)$row['password'];
$ok = preg_match('/^[a-f0-9]{32}$/i', $stored) ? hash_equals(strtolower($stored), md5($actual)) : password_verify($actual, $stored);
if (!$ok) json_response(['success' => false, 'error' => 'La contraseña actual no es correcta.'], 422);
if ($actual === $nueva) json_response(['success' => false, 'error' => 'La nueva contraseña debe ser distinta de la actual.'], 422);
$err = politica_password_error($nueva, $row['usuario']);
if ($err) json_response(['success' => false, 'error' => $err], 422);

db_query($conn, 'UPDATE usuarios SET password = ?, debe_cambiar_password = 0 WHERE id = ?', 'si', [password_hash($nueva, PASSWORD_DEFAULT), (int)$row['id']]);
$_SESSION['debe_cambiar_password'] = false;
session_regenerate_id(true);
auditar('cambiar_password', 'usuarios', $row['id']);
json_response(['success' => true, 'message' => 'Contraseña actualizada.']);

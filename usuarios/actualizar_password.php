<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/gestion.php';
require_auth();
gestion_post($_POST);
if (strlen($_POST['password'] ?? '') < 10) json_response(['success' => false, 'error' => 'Use al menos 10 caracteres.'], 422);
gestion_query($conn, 'UPDATE usuarios SET password=? WHERE usuario=?', 'ss', [password_hash($_POST['password'], PASSWORD_DEFAULT), $_SESSION['usuario']]);
header('Location: ../frontend/index.html');
exit;

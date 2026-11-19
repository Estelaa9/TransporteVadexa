<?php
// usuarios/politica.php - Política de contraseñas (SEG-28). No es un endpoint.
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'politica.php') { http_response_code(404); exit; }

function politica_password_error(string $password, string $usuario = ''): ?string {
    if (mb_strlen($password) < 10) return 'La contraseña debe tener al menos 10 caracteres.';
    if (mb_strlen($password) > 128) return 'La contraseña no puede superar 128 caracteres.';
    if (!preg_match('/[A-Za-zÁÉÍÓÚáéíóúÑñ]/u', $password) || !preg_match('/\d/', $password)) return 'La contraseña debe combinar letras y números.';
    $comunes = ['1234567890', '0123456789', 'password123', 'contraseña1', 'qwerty12345', 'admin12345', 'administrador1', 'vadexsa123', 'vadexsa2026', '1q2w3e4r5t'];
    if (in_array(mb_strtolower($password), $comunes, true)) return 'La contraseña es demasiado común.';
    if ($usuario !== '' && mb_stripos($password, $usuario) !== false) return 'La contraseña no debe contener el nombre de usuario.';
    return null;
}

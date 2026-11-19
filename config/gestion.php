<?php
// config/gestion.php - Alias de compatibilidad con los nombres usados por los módulos anteriores.
require_once __DIR__ . '/db.php';

function gestion_query($conn, $sql, $types = '', $params = []) { return db_query($conn, $sql, $types, $params); }
function gestion_fecha($value) { return validar_fecha($value); }
function gestion_monto($value) { return validar_monto($value); }
function gestion_csrf() { return csrf_token(); }
function gestion_post($data) {
    require_method('POST');
    csrf_verificar();
}

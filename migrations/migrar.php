<?php
// Ejecuta las migraciones pendientes desde la línea de comandos.
//   php migrations/migrar.php            aplica las migraciones pendientes
//   php migrations/migrar.php --unicos   reintenta los índices únicos omitidos por datos repetidos
//   php migrations/migrar.php --estado   muestra la versión y las observaciones
// Para otra base: VADEXSA_DB_NAME=mi_base php migrations/migrar.php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/../config/conexion.php';

$args = array_slice($argv, 1);
if (in_array('--unicos', $args, true)) {
    mig_unico($conn, 'usuarios', 'uq_usuarios_usuario', 'usuario');
    mig_unico($conn, 'clientes', 'uq_clientes_documento', 'documento');
    mig_unico($conn, 'conductores', 'uq_conductores_licencia', 'licencia');
    mig_unico($conn, 'vehiculos', 'uq_vehiculos_placa', 'placa');
    mig_unico($conn, 'servicios', 'uq_servicios_guia', 'guia_transportista');
}
echo 'Base de datos: ' . vadexsa_config('db_name') . PHP_EOL;
echo 'Versión del esquema: ' . db_value($conn, 'SELECT MAX(version) FROM schema_version') . ' (requerida ' . VADEXSA_SCHEMA_VERSION . ')' . PHP_EOL;
foreach (db_all($conn, 'SELECT creado_en, texto FROM migracion_observaciones ORDER BY id') as $n) {
    echo '- [' . $n['creado_en'] . '] ' . $n['texto'] . PHP_EOL;
}

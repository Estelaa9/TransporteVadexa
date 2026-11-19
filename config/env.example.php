<?php
// Copie este archivo como config/env.php y ajuste los valores del entorno.
// config/env.php está excluido del repositorio (.gitignore) para no publicar credenciales (SEG-05).
//
// Producción: cree un usuario propio de MySQL en lugar de root (SEG-04), por ejemplo:
//   CREATE USER 'vadexsa_app'@'localhost' IDENTIFIED BY 'una-clave-larga-y-aleatoria';
//   GRANT SELECT, INSERT, UPDATE, DELETE ON transporte_db.* TO 'vadexsa_app'@'localhost';
// Las migraciones automáticas necesitan además CREATE, ALTER, INDEX y REFERENCES; puede
// ejecutarlas una vez con un usuario administrador (php migrations/migrar.php) y dejar a la
// aplicación solo con los permisos de datos.
return [
    'db_host' => 'localhost',
    'db_user' => 'root',
    'db_pass' => '',
    'db_name' => 'transporte_db',

    // true solo en desarrollo: muestra el detalle de los errores en las respuestas.
    'debug' => false,

    // Cierre automático de sesión por inactividad, en minutos (SEG-14).
    'session_timeout_min' => 30,

    // Orígenes adicionales autorizados para CORS. Vacío = solo el mismo origen (SEG-17).
    'allowed_origins' => [],

    // NEG-17: una operación gravada genera IGV aunque no se emita comprobante.
    // Confirmar con el contador. true = la base imponible se calcula siempre sin IGV (precio / 1.18).
    'igv_sin_comprobante' => true,

    // Tasa de IGV vigente.
    'igv_tasa' => 0.18,
];

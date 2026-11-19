<?php
// config/migraciones.php - Migraciones versionadas e idempotentes.
// Se ejecutan automáticamente una sola vez cuando la base está en una versión anterior,
// o manualmente con: php migrations/migrar.php
// Fase 1 (base de datos) del plan de corrección de la auditoría.

const VADEXSA_SCHEMA_VERSION = 3;

function vadexsa_migrar_si_hace_falta(mysqli $conn): void {
    try {
        $version = (int)db_value($conn, 'SELECT MAX(version) FROM schema_version');
    } catch (mysqli_sql_exception $e) {
        $version = 0;
    }
    if ($version >= VADEXSA_SCHEMA_VERSION) return;

    $lock = (int)db_value($conn, 'SELECT GET_LOCK(CONCAT(DATABASE(), ":migracion"), 60)');
    if ($lock !== 1) throw new RuntimeException('No se pudo obtener el bloqueo de migración.');
    try {
        mysqli_query($conn, 'CREATE TABLE IF NOT EXISTS schema_version (version INT NOT NULL PRIMARY KEY, descripcion VARCHAR(255) NOT NULL, aplicada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
        $version = (int)db_value($conn, 'SELECT COALESCE(MAX(version), 0) FROM schema_version');
        if ($version < 1) {
            vadexsa_migracion_1($conn);
            db_query($conn, 'INSERT INTO schema_version (version, descripcion) VALUES (1, ?)', 's', ['Auditoría v2.1: RBAC, auditoría, facturación y cuentas por cobrar, análisis integral']);
        }
        if ($version < 2) {
            // Los administradores existentes conservan su contraseña sin cambio obligatorio.
            // Las cuentas creadas después siguen debiendo cambiar su contraseña inicial.
            mysqli_query($conn, "UPDATE usuarios SET debe_cambiar_password = 0 WHERE rol = 'administrador'");
            db_query($conn, 'INSERT INTO schema_version (version, descripcion) VALUES (2, ?)', 's', ['Administradores existentes sin cambio obligatorio de contraseña']);
        }
        if ($version < 3) {
            // BD-06: estados guardados como texto libre («Activo», 'activo ') se normalizan a minúsculas.
            foreach (['proveedores', 'vehiculos', 'conductores', 'usuarios'] as $t) {
                mysqli_query($conn, "UPDATE `$t` SET estado = LOWER(TRIM(estado)) WHERE estado <> LOWER(TRIM(estado)) COLLATE utf8mb4_bin");
            }
            mysqli_query($conn, "UPDATE servicios SET estado_servicio = LOWER(TRIM(estado_servicio)) WHERE estado_servicio <> LOWER(TRIM(estado_servicio)) COLLATE utf8mb4_bin");
            db_query($conn, 'INSERT INTO schema_version (version, descripcion) VALUES (3, ?)', 's', ['Estados normalizados a minúsculas']);
        }
    } finally {
        mysqli_query($conn, 'SELECT RELEASE_LOCK(CONCAT(DATABASE(), ":migracion"))');
    }
}

/* ---------- utilidades de esquema ---------- */

function mig_tabla_existe(mysqli $c, string $t): bool {
    return (int)db_value($c, 'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', 's', [$t]) > 0;
}
function mig_columna_existe(mysqli $c, string $t, string $col): bool {
    return (int)db_value($c, 'SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', 'ss', [$t, $col]) > 0;
}
function mig_indice_existe(mysqli $c, string $t, string $idx): bool {
    return (int)db_value($c, 'SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?', 'ss', [$t, $idx]) > 0;
}
function mig_columna(mysqli $c, string $t, string $col, string $def): void {
    if (!mig_columna_existe($c, $t, $col)) mysqli_query($c, "ALTER TABLE `$t` ADD COLUMN `$col` $def");
}
function mig_indice(mysqli $c, string $t, string $idx, string $def): void {
    if (!mig_indice_existe($c, $t, $idx)) mysqli_query($c, "ALTER TABLE `$t` ADD $def");
}
/** Crea un índice UNIQUE solo si no hay duplicados; si los hay, lo deja anotado para revisión. */
function mig_unico(mysqli $c, string $t, string $idx, string $col): void {
    if (mig_indice_existe($c, $t, $idx)) return;
    $dups = (int)db_value($c, "SELECT COUNT(*) FROM (SELECT `$col` FROM `$t` WHERE `$col` IS NOT NULL AND `$col` <> '' GROUP BY `$col` HAVING COUNT(*) > 1) d");
    if ($dups === 0) {
        mysqli_query($c, "ALTER TABLE `$t` ADD UNIQUE KEY `$idx` (`$col`)");
    } else {
        mig_nota($c, "No se creó el índice único $t.$col: hay $dups valores repetidos. Corríjalos y ejecute php migrations/migrar.php --unicos.");
    }
}
function mig_nota(mysqli $c, string $texto): void {
    db_query($c, 'INSERT INTO migracion_observaciones (texto) VALUES (?)', 's', [mb_substr($texto, 0, 1000)]);
}
function mig_auditoria_cols(mysqli $c, string $t): void {
    mig_columna($c, $t, 'created_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP');
    mig_columna($c, $t, 'updated_at', 'TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP');
    mig_columna($c, $t, 'created_by', 'VARCHAR(100) NULL');
    mig_columna($c, $t, 'updated_by', 'VARCHAR(100) NULL');
}

/* ---------- versión 1 ---------- */

function vadexsa_migracion_1(mysqli $c): void {
    $innodb = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';

    mysqli_query($c, "CREATE TABLE IF NOT EXISTS migracion_observaciones (id INT AUTO_INCREMENT PRIMARY KEY, texto VARCHAR(1000) NOT NULL, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP) $innodb");

    // Tablas que antes se creaban en cada petición.
    mysqli_query($c, "CREATE TABLE IF NOT EXISTS servicio_operacion (
        servicio_id INT NOT NULL PRIMARY KEY, proveedor_id INT NULL, provincia VARCHAR(100) NOT NULL DEFAULT '', distrito VARCHAR(100) NOT NULL DEFAULT '',
        referencia VARCHAR(255) NOT NULL DEFAULT '', contacto VARCHAR(150) NOT NULL DEFAULT '', telefono VARCHAR(40) NOT NULL DEFAULT '',
        almacen VARCHAR(150) NOT NULL DEFAULT '', temporada VARCHAR(100) NOT NULL DEFAULT '', frecuencia VARCHAR(100) NOT NULL DEFAULT '',
        observaciones TEXT NULL, actualizado_por VARCHAR(100) NOT NULL, actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX (proveedor_id)) $innodb");
    mysqli_query($c, "CREATE TABLE IF NOT EXISTS gastos_adicionales (id INT AUTO_INCREMENT PRIMARY KEY, servicio_id INT NULL, fecha DATE NOT NULL, concepto VARCHAR(255) NOT NULL,
        monto DECIMAL(12,2) NOT NULL, registrado_por VARCHAR(100) NOT NULL, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX (fecha), INDEX (servicio_id)) $innodb");
    mysqli_query($c, "CREATE TABLE IF NOT EXISTS servicio_abonos (id INT AUTO_INCREMENT PRIMARY KEY, servicio_id INT NOT NULL, fecha DATE NOT NULL, monto DECIMAL(12,2) NOT NULL,
        referencia VARCHAR(255) NOT NULL, registrado_por VARCHAR(100) NOT NULL, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX (servicio_id), INDEX (fecha)) $innodb");
    mysqli_query($c, "CREATE TABLE IF NOT EXISTS factura_pagos (servicio_id INT NOT NULL, numero_factura VARCHAR(255) NOT NULL, estado_pago ENUM('por_pagar','pagada') NOT NULL,
        fecha_pago DATE NULL, actualizado_por VARCHAR(255) NOT NULL, actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (servicio_id, numero_factura)) $innodb");
    foreach (['gastos_operativos', 'gastos_administrativos'] as $t) {
        mysqli_query($c, "CREATE TABLE IF NOT EXISTS $t (id INT AUTO_INCREMENT PRIMARY KEY, tipo_gasto VARCHAR(50) NULL, descripcion TEXT, monto DECIMAL(12,2) NULL, fecha DATE NULL) $innodb");
    }

    /* --- Auditoría (SEG-24) --- */
    mysqli_query($c, "CREATE TABLE IF NOT EXISTS auditoria (
        id BIGINT AUTO_INCREMENT PRIMARY KEY, usuario_id INT NULL, usuario VARCHAR(100) NOT NULL, accion VARCHAR(40) NOT NULL,
        tabla VARCHAR(60) NOT NULL, registro_id VARCHAR(40) NULL, valores_antes LONGTEXT NULL, valores_despues LONGTEXT NULL,
        ip VARCHAR(45) NOT NULL DEFAULT '', fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_aud_tabla (tabla, registro_id), INDEX idx_aud_fecha (fecha), INDEX idx_aud_usuario (usuario_id)) $innodb");

    /* --- Roles y permisos (Mejora 1, SEG-08, SEG-09) --- */
    mysqli_query($c, "CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY, codigo VARCHAR(40) NOT NULL UNIQUE, nombre VARCHAR(80) NOT NULL,
        descripcion VARCHAR(255) NOT NULL DEFAULT '', es_sistema TINYINT(1) NOT NULL DEFAULT 0, activo TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP) $innodb");
    mysqli_query($c, "CREATE TABLE IF NOT EXISTS rol_permisos (
        rol_id INT NOT NULL, modulo VARCHAR(40) NOT NULL, accion VARCHAR(20) NOT NULL, PRIMARY KEY (rol_id, modulo, accion),
        CONSTRAINT fk_rp_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE) $innodb");
    foreach (rbac_roles_base() as $codigo => $rol) {
        db_query($c, 'INSERT IGNORE INTO roles (codigo, nombre, descripcion, es_sistema) VALUES (?, ?, ?, 1)', 'sss', [$codigo, $rol['nombre'], $rol['descripcion']]);
        $rolId = (int)db_value($c, 'SELECT id FROM roles WHERE codigo = ?', 's', [$codigo]);
        foreach ($rol['permisos'] as $modulo => $acciones) {
            foreach ($acciones as $accion) {
                db_query($c, 'INSERT IGNORE INTO rol_permisos (rol_id, modulo, accion) VALUES (?, ?, ?)', 'iss', [$rolId, $modulo, $accion]);
            }
        }
    }

    /* --- Usuarios --- */
    mysqli_query($c, 'ALTER TABLE usuarios MODIFY password VARCHAR(255) NOT NULL');
    mig_columna($c, 'usuarios', 'cliente_id', 'INT NULL');
    mig_columna($c, 'usuarios', 'intentos_fallidos', 'INT NOT NULL DEFAULT 0');
    mig_columna($c, 'usuarios', 'bloqueado_hasta', 'DATETIME NULL');
    mig_columna($c, 'usuarios', 'debe_cambiar_password', 'TINYINT(1) NOT NULL DEFAULT 0');
    mig_columna($c, 'usuarios', 'ultimo_acceso', 'DATETIME NULL');
    mig_columna($c, 'usuarios', 'updated_at', 'TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP');
    mysqli_query($c, "UPDATE usuarios SET rol = 'administrador' WHERE LOWER(TRIM(rol)) IN ('admin', 'administrador')");
    mysqli_query($c, "UPDATE usuarios SET rol = 'operaciones' WHERE rol IS NULL OR rol NOT IN (SELECT codigo FROM roles)");
    mysqli_query($c, "UPDATE usuarios SET estado = 'activo' WHERE estado IS NULL OR estado = ''");
    mig_unico($c, 'usuarios', 'uq_usuarios_usuario', 'usuario');
    mig_indice($c, 'usuarios', 'idx_usuarios_cliente', 'INDEX idx_usuarios_cliente (cliente_id)');
    // Contraseñas MD5 heredadas: se migran a password_hash en el siguiente inicio de sesión (SEG-03).
    // Se conserva la contraseña actual del administrador (decisión del usuario); cámbiela antes de producción.

    mysqli_query($c, "CREATE TABLE IF NOT EXISTS login_intentos (
        id BIGINT AUTO_INCREMENT PRIMARY KEY, usuario VARCHAR(100) NOT NULL, ip VARCHAR(45) NOT NULL, exito TINYINT(1) NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_li_ip (ip, fecha), INDEX idx_li_usuario (usuario, fecha)) $innodb");

    /* --- Clientes --- */
    mig_columna($c, 'clientes', 'dias_credito', 'INT NOT NULL DEFAULT 0');
    mig_auditoria_cols($c, 'clientes');
    mysqli_query($c, "UPDATE clientes SET documento = TRIM(documento) WHERE documento <> TRIM(documento)");
    mig_unico($c, 'clientes', 'uq_clientes_documento', 'documento');

    /* --- Conductores (BD-07, BD-11) --- */
    mig_columna($c, 'conductores', 'direccion', 'VARCHAR(255) NULL');
    mig_columna($c, 'conductores', 'dni', 'VARCHAR(8) NULL');
    mig_columna($c, 'conductores', 'categoria_licencia', 'VARCHAR(10) NULL');
    mig_columna($c, 'conductores', 'licencia_vencimiento', 'DATE NULL');
    mig_auditoria_cols($c, 'conductores');
    mysqli_query($c, "UPDATE conductores SET estado = 'activo' WHERE estado IS NULL OR estado = ''");
    mig_unico($c, 'conductores', 'uq_conductores_licencia', 'licencia');

    /* --- Vehículos (BD-07, BD-14) --- */
    mig_columna($c, 'vehiculos', 'capacidad_kg', 'DECIMAL(10,2) NULL');
    mig_columna($c, 'vehiculos', 'soat_vencimiento', 'DATE NULL');
    mig_columna($c, 'vehiculos', 'revision_vencimiento', 'DATE NULL');
    mig_auditoria_cols($c, 'vehiculos');
    mysqli_query($c, "UPDATE vehiculos SET estado = 'activo' WHERE estado IS NULL OR estado = ''");
    $res = mysqli_query($c, "SELECT id, capacidad FROM vehiculos WHERE capacidad_kg IS NULL AND capacidad IS NOT NULL AND capacidad <> ''");
    while ($v = mysqli_fetch_assoc($res)) {
        if (preg_match('/([\d.,]+)\s*(t|ton|tn|kg)?/i', $v['capacidad'], $m)) {
            $num = (float)str_replace(',', '.', $m[1]);
            $unidad = strtolower($m[2] ?? '');
            $kg = $unidad === 'kg' ? $num : ($unidad !== '' || $num < 100 ? $num * 1000 : $num);
            db_query($c, 'UPDATE vehiculos SET capacidad_kg = ? WHERE id = ?', 'di', [$kg, (int)$v['id']]);
        }
    }
    mig_unico($c, 'vehiculos', 'uq_vehiculos_placa', 'placa');

    /* --- Proveedores --- */
    mig_columna($c, 'proveedores', 'ruc', 'VARCHAR(11) NULL');
    mig_auditoria_cols($c, 'proveedores');
    mysqli_query($c, "UPDATE proveedores SET estado = 'activo' WHERE estado IS NULL OR estado = ''");

    /* --- Gastos: vínculo con el servicio para el margen real (NEG-03) --- */
    foreach (['gastos_operativos', 'gastos_administrativos'] as $t) {
        mig_columna($c, $t, 'tipo_gasto', 'VARCHAR(50) NULL');
        mig_auditoria_cols($c, $t);
    }
    mig_columna($c, 'gastos_operativos', 'servicio_id', 'INT NULL');
    mig_indice($c, 'gastos_operativos', 'idx_go_servicio', 'INDEX idx_go_servicio (servicio_id)');
    mig_indice($c, 'gastos_operativos', 'idx_go_fecha', 'INDEX idx_go_fecha (fecha)');
    mig_indice($c, 'gastos_administrativos', 'idx_ga_fecha', 'INDEX idx_ga_fecha (fecha)');

    /* --- Servicios (BD-02, BD-03, BD-08, BD-13, NEG-21) --- */
    // Columnas que la versión anterior creaba en tiempo de ejecución: pueden faltar en una base instalada desde cero.
    mig_columna($c, 'servicios', 'proveedor_id', 'INT NULL');
    mig_columna($c, 'servicios', 'fecha_emision', 'DATE NULL');
    mig_columna($c, 'servicios', 'monto_detraccion', 'DECIMAL(12,2) NOT NULL DEFAULT 0.00');
    mig_columna($c, 'servicios', 'estado_comprobante', "VARCHAR(20) NOT NULL DEFAULT 'pendiente'");
    mig_columna($c, 'servicios', 'hora_fin_estimada', 'TIME NULL');
    mig_columna($c, 'servicios', 'peso_kg', 'DECIMAL(10,2) NULL');
    mig_columna($c, 'servicios', 'comprobante_id', 'INT NULL');
    mig_columna($c, 'servicios', 'motivo_cancelacion', 'VARCHAR(255) NULL');
    mig_columna($c, 'servicios', 'version', 'INT NOT NULL DEFAULT 0');
    mig_auditoria_cols($c, 'servicios');
    mig_indice($c, 'servicios', 'idx_srv_vehiculo_fecha', 'INDEX idx_srv_vehiculo_fecha (vehiculo_id, fecha_servicio)');
    mig_indice($c, 'servicios', 'idx_srv_conductor_fecha', 'INDEX idx_srv_conductor_fecha (conductor_id, fecha_servicio)');
    mig_indice($c, 'servicios', 'idx_srv_cliente_fecha', 'INDEX idx_srv_cliente_fecha (cliente_id, fecha_servicio)');
    mig_indice($c, 'servicios', 'idx_srv_comprobante', 'INDEX idx_srv_comprobante (comprobante_id)');
    mysqli_query($c, "UPDATE servicios SET estado_servicio = 'programado' WHERE estado_servicio IS NULL OR estado_servicio = ''");
    // Horario estimado de 4 horas para los servicios anteriores sin hora de fin.
    mysqli_query($c, "UPDATE servicios SET hora_fin_estimada = ADDTIME(COALESCE(hora_servicio, '08:00:00'), '04:00:00') WHERE hora_fin_estimada IS NULL");
    mysqli_query($c, "UPDATE servicios SET hora_servicio = '08:00:00' WHERE hora_servicio IS NULL");
    mig_unico($c, 'servicios', 'uq_servicios_guia', 'guia_transportista');
    // NEG-01 y NEG-17: base imponible sin IGV y margen = base imponible − costo del proveedor.
    $tasa = 1 + (float)vadexsa_config('igv_tasa', 0.18);
    if (vadexsa_config('igv_sin_comprobante', true)) {
        db_query($c, "UPDATE servicios SET base_imponible = ROUND(COALESCE(precio_cliente,0) / ?, 2), igv = ROUND(COALESCE(precio_cliente,0) - ROUND(COALESCE(precio_cliente,0) / ?, 2), 2) WHERE tipo_comprobante = 'SIN_COMPROBANTE' OR base_imponible IS NULL", 'dd', [$tasa, $tasa]);
    }
    mysqli_query($c, "UPDATE servicios SET utilidad = ROUND(COALESCE(base_imponible, 0) - COALESCE(costo_proveedor, 0), 2)");

    /* --- Facturación y cuentas por cobrar (Mejora 2, BD-16, CON-01, CON-02, NEG-12, NEG-13, NEG-20) --- */
    if (mig_tabla_existe($c, 'comprobantes') && !mig_columna_existe($c, 'comprobantes', 'estado')) {
        mysqli_query($c, 'RENAME TABLE comprobantes TO comprobantes_legacy');
        mig_nota($c, 'La tabla comprobantes anterior se conservó como comprobantes_legacy. Los comprobantes vigentes se reconstruyeron a partir de servicios.numero_factura.');
    }
    mysqli_query($c, "CREATE TABLE IF NOT EXISTS series_comprobante (
        serie VARCHAR(4) NOT NULL PRIMARY KEY, tipo ENUM('FACTURA','BOLETA','NOTA_CREDITO') NOT NULL, aplica_a ENUM('FACTURA','BOLETA') NULL,
        ultimo_numero INT NOT NULL DEFAULT 0, activo TINYINT(1) NOT NULL DEFAULT 1) $innodb");
    mysqli_query($c, "INSERT IGNORE INTO series_comprobante (serie, tipo, aplica_a) VALUES ('F001','FACTURA',NULL), ('B001','BOLETA',NULL), ('FC01','NOTA_CREDITO','FACTURA'), ('BC01','NOTA_CREDITO','BOLETA')");
    mysqli_query($c, "CREATE TABLE IF NOT EXISTS comprobantes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tipo ENUM('FACTURA','BOLETA','NOTA_CREDITO') NOT NULL, serie VARCHAR(4) NOT NULL, numero INT NOT NULL,
        cliente_id INT NULL, fecha_emision DATE NOT NULL, dias_credito INT NOT NULL DEFAULT 0, fecha_vencimiento DATE NOT NULL,
        base_imponible DECIMAL(12,2) NOT NULL, igv DECIMAL(12,2) NOT NULL, total DECIMAL(12,2) NOT NULL, monto_detraccion DECIMAL(12,2) NOT NULL DEFAULT 0,
        estado ENUM('emitida','anulada') NOT NULL DEFAULT 'emitida', motivo_anulacion VARCHAR(255) NULL, fecha_anulacion DATE NULL,
        comprobante_ref_id INT NULL, observacion VARCHAR(255) NULL,
        created_by VARCHAR(100) NULL, updated_by VARCHAR(100) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_comprobante_numero (serie, numero), INDEX idx_comp_cliente (cliente_id), INDEX idx_comp_emision (fecha_emision),
        INDEX idx_comp_venc (fecha_vencimiento), INDEX idx_comp_ref (comprobante_ref_id),
        CONSTRAINT fk_comp_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT) $innodb");
    mysqli_query($c, "CREATE TABLE IF NOT EXISTS comprobante_servicios (
        comprobante_id INT NOT NULL, servicio_id INT NOT NULL, base_imponible DECIMAL(12,2) NOT NULL, igv DECIMAL(12,2) NOT NULL, total DECIMAL(12,2) NOT NULL,
        PRIMARY KEY (comprobante_id, servicio_id), INDEX idx_cs_servicio (servicio_id),
        CONSTRAINT fk_cs_comprobante FOREIGN KEY (comprobante_id) REFERENCES comprobantes(id) ON DELETE RESTRICT,
        CONSTRAINT fk_cs_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE RESTRICT) $innodb");
    mysqli_query($c, "CREATE TABLE IF NOT EXISTS pagos (
        id INT AUTO_INCREMENT PRIMARY KEY, comprobante_id INT NOT NULL, fecha DATE NOT NULL, monto DECIMAL(12,2) NOT NULL,
        medio VARCHAR(30) NOT NULL DEFAULT 'transferencia', referencia VARCHAR(255) NOT NULL DEFAULT '',
        estado ENUM('registrado','anulado') NOT NULL DEFAULT 'registrado', motivo_anulacion VARCHAR(255) NULL,
        registrado_por VARCHAR(100) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_pagos_comp (comprobante_id), INDEX idx_pagos_fecha (fecha),
        CONSTRAINT fk_pagos_comprobante FOREIGN KEY (comprobante_id) REFERENCES comprobantes(id) ON DELETE RESTRICT) $innodb");
    mig_migrar_comprobantes($c);

    /* --- Reglas del diagnóstico (Mejora 3) --- */
    mysqli_query($c, "CREATE TABLE IF NOT EXISTS reglas_diagnostico (
        id INT AUTO_INCREMENT PRIMARY KEY, codigo VARCHAR(40) NOT NULL UNIQUE, nombre VARCHAR(120) NOT NULL,
        indicador VARCHAR(60) NOT NULL, operador ENUM('>','>=','<','<=','=') NOT NULL, umbral DECIMAL(14,2) NOT NULL,
        tipo ENUM('negativo','positivo') NOT NULL DEFAULT 'negativo', prioridad ENUM('critica','alta','media','baja') NOT NULL DEFAULT 'media',
        recomendacion VARCHAR(500) NOT NULL, activo TINYINT(1) NOT NULL DEFAULT 1,
        updated_by VARCHAR(100) NULL, updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) $innodb");
    $reglas = [
        ['DEUDA_VENCIDA_ALTA', 'Deuda vencida alta', 'pct_vencido', '>', 20, 'negativo', 'critica', 'Priorizar la cobranza de los clientes con mayor saldo vencido.'],
        ['RESULTADO_NEGATIVO', 'Resultado operativo negativo', 'resultado_operativo', '<', 0, 'negativo', 'critica', 'Revisar costos de proveedores y gastos; evaluar las tarifas por servicio.'],
        ['DOCUMENTOS_VENCIDOS', 'Documentos de flota vencidos', 'documentos_vencidos', '>', 0, 'negativo', 'critica', 'Regularizar licencias, SOAT o revisiones técnicas vencidas antes de programar viajes.'],
        ['CAIDA_SERVICIOS', 'Caída de servicios', 'servicios_vs_anterior_pct', '<', 80, 'negativo', 'alta', 'Revisar los servicios pendientes y cancelados del período.'],
        ['MARGEN_BAJO', 'Margen operativo bajo', 'margen_operativo_pct', '<', 10, 'negativo', 'alta', 'Revisar tarifas y costos por servicio.'],
        ['COBRO_LENTO', 'Cobranza lenta', 'ppc_dias', '>', 45, 'negativo', 'alta', 'Reforzar la gestión de cobranza y revisar las condiciones de crédito.'],
        ['UNIDAD_OCIOSA', 'Unidad ociosa', 'vehiculos_ociosos', '>', 0, 'negativo', 'media', 'Evaluar reasignar la unidad o sus costos fijos.'],
        ['CANCELACIONES_ALTAS', 'Cancelaciones elevadas', 'tasa_cancelacion_pct', '>', 15, 'negativo', 'media', 'Analizar con los clientes las causas de las cancelaciones.'],
        ['POR_FACTURAR', 'Servicios finalizados sin comprobante', 'servicios_por_facturar', '>', 0, 'negativo', 'media', 'Emitir los comprobantes de los servicios finalizados.'],
        ['DOCUMENTOS_POR_VENCER', 'Documentos por vencer', 'documentos_por_vencer', '>', 0, 'negativo', 'media', 'Programar la renovación de los documentos que vencen en los próximos 30 días.'],
        ['MARGEN_SALUDABLE', 'Margen operativo saludable', 'margen_operativo_pct', '>=', 20, 'positivo', 'baja', 'Mantener la estructura de costos y tarifas.'],
        ['CRECIMIENTO_INGRESOS', 'Crecimiento de ingresos', 'ingresos_vs_anterior_pct', '>=', 110, 'positivo', 'baja', 'Consolidar la relación con los clientes que impulsaron el crecimiento.'],
        ['CARTERA_SANA', 'Cartera al día', 'pct_vencido', '<=', 5, 'positivo', 'baja', 'Mantener la política de crédito y seguimiento.'],
    ];
    foreach ($reglas as $r) {
        db_query($c, 'INSERT IGNORE INTO reglas_diagnostico (codigo, nombre, indicador, operador, umbral, tipo, prioridad, recomendacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 'ssssdsss', $r);
    }
}

/** Reconstruye comprobantes, detalle y pagos a partir de los datos anteriores (servicios.numero_factura, abonos y factura_pagos). */
function mig_migrar_comprobantes(mysqli $c): void {
    if ((int)db_value($c, 'SELECT COUNT(*) FROM comprobantes') > 0) return;
    $res = mysqli_query($c, "SELECT s.*, c.dias_credito FROM servicios s LEFT JOIN clientes c ON c.id = s.cliente_id
        WHERE s.numero_factura IS NOT NULL AND TRIM(s.numero_factura) <> '' AND s.comprobante_id IS NULL ORDER BY s.id");
    $omitidos = 0;
    $tasa = (float)vadexsa_config('igv_tasa', 0.18);
    while ($s = mysqli_fetch_assoc($res)) {
        $numero = strtoupper(trim($s['numero_factura']));
        if (!preg_match('/^([FB][A-Z0-9]{3})-(\d{1,8})$/', $numero, $m)) { $omitidos++; continue; }
        $serie = $m[1];
        $num = (int)$m[2];
        if ((int)db_value($c, 'SELECT COUNT(*) FROM comprobantes WHERE serie = ? AND numero = ?', 'si', [$serie, $num]) > 0) { $omitidos++; continue; }
        $tipo = $serie[0] === 'F' ? 'FACTURA' : 'BOLETA';
        $total = round((float)$s['precio_cliente'], 2);
        $base = round($total / (1 + $tasa), 2);
        $igv = round($total - $base, 2);
        $emision = $s['fecha_emision'] ?: ($s['fecha_servicio'] ?: date('Y-m-d'));
        $dias = (int)($s['dias_credito'] ?? 0);
        if ($dias === 0 && preg_match('/cr[eé]dito/i', (string)$s['forma_pago'])) {
            $dias = preg_match('/(\d+)/', (string)$s['forma_pago'], $d) ? (int)$d[1] : 30;
        }
        $vence = date('Y-m-d', strtotime($emision . " +$dias days"));
        $cancelado = $s['estado_servicio'] === 'cancelado';
        db_query($c, "INSERT INTO comprobantes (tipo, serie, numero, cliente_id, fecha_emision, dias_credito, fecha_vencimiento, base_imponible, igv, total, monto_detraccion, estado, motivo_anulacion, fecha_anulacion, observacion, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Migrado del registro anterior', 'migracion')",
            'ssiisisddddsss', [$tipo, $serie, $num, $s['cliente_id'] !== null ? (int)$s['cliente_id'] : null, $emision, $dias, $vence, $base, $igv, $total,
                (float)($s['monto_detraccion'] ?? 0), $cancelado ? 'anulada' : 'emitida', $cancelado ? 'Servicio cancelado antes de la migración' : null, $cancelado ? $emision : null]);
        $compId = mysqli_insert_id($c);
        db_query($c, 'INSERT INTO comprobante_servicios (comprobante_id, servicio_id, base_imponible, igv, total) VALUES (?, ?, ?, ?, ?)', 'iiddd', [$compId, (int)$s['id'], $base, $igv, $total]);
        if ($cancelado) continue;
        db_query($c, 'UPDATE servicios SET comprobante_id = ?, tipo_comprobante = ?, fecha_emision = ? WHERE id = ?', 'issi', [$compId, $tipo, $emision, (int)$s['id']]);
        $pagado = 0.0;
        $ab = db_all($c, 'SELECT * FROM servicio_abonos WHERE servicio_id = ? ORDER BY fecha, id', 'i', [(int)$s['id']]);
        foreach ($ab as $a) {
            db_query($c, 'INSERT INTO pagos (comprobante_id, fecha, monto, medio, referencia, registrado_por) VALUES (?, ?, ?, ?, ?, ?)', 'isdsss',
                [$compId, $a['fecha'], (float)$a['monto'], 'otro', $a['referencia'], $a['registrado_por']]);
            $pagado += (float)$a['monto'];
        }
        $fp = db_one($c, 'SELECT * FROM factura_pagos WHERE servicio_id = ? AND numero_factura = ?', 'is', [(int)$s['id'], $s['numero_factura']]);
        if ($fp && $fp['estado_pago'] === 'pagada' && $total - $pagado > 0.004) {
            db_query($c, 'INSERT INTO pagos (comprobante_id, fecha, monto, medio, referencia, registrado_por) VALUES (?, ?, ?, ?, ?, ?)', 'isdsss',
                [$compId, $fp['fecha_pago'] ?: $emision, round($total - $pagado, 2), 'otro', 'Migración: comprobante marcado como pagado', $fp['actualizado_por']]);
        }
    }
    mysqli_query($c, "UPDATE series_comprobante sc JOIN (SELECT serie, MAX(numero) n FROM comprobantes GROUP BY serie) x ON x.serie = sc.serie SET sc.ultimo_numero = GREATEST(sc.ultimo_numero, x.n)");
    mysqli_query($c, "INSERT IGNORE INTO series_comprobante (serie, tipo, ultimo_numero) SELECT serie, MAX(tipo), MAX(numero) FROM comprobantes GROUP BY serie");
    if ($omitidos > 0) mig_nota($c, "$omitidos servicios con número de comprobante repetido o con formato no válido no se vincularon a un comprobante. Revíselos en Facturación.");
}

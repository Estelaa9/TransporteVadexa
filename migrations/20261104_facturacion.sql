-- Registra la fecha real de emisión sin asumirla a partir de la fecha del servicio.
-- La comprobación permite volver a ejecutar esta migración de forma segura.
SET @vadexsa_fecha_emision_existe = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'servicios'
      AND COLUMN_NAME = 'fecha_emision'
);
SET @vadexsa_fecha_emision_ddl = IF(
    @vadexsa_fecha_emision_existe = 0,
    'ALTER TABLE servicios ADD COLUMN fecha_emision DATE NULL',
    'SELECT 1'
);
PREPARE vadexsa_fecha_emision_stmt FROM @vadexsa_fecha_emision_ddl;
EXECUTE vadexsa_fecha_emision_stmt;
DEALLOCATE PREPARE vadexsa_fecha_emision_stmt;

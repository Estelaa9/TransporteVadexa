-- Superseded: las migraciones se aplican desde config/migraciones.php (php migrations/migrar.php).
-- Migración aditiva. Ejecutar después de facturas/esquema.sql en transporte_db.
-- No modifica ni elimina servicios existentes. Se puede ejecutar nuevamente.
CREATE TABLE IF NOT EXISTS servicio_operacion (
 servicio_id INT NOT NULL PRIMARY KEY,
 proveedor_id INT NULL,
 provincia VARCHAR(100) NOT NULL DEFAULT '',
 distrito VARCHAR(100) NOT NULL DEFAULT '',
 referencia VARCHAR(255) NOT NULL DEFAULT '',
 contacto VARCHAR(150) NOT NULL DEFAULT '',
 telefono VARCHAR(40) NOT NULL DEFAULT '',
 almacen VARCHAR(150) NOT NULL DEFAULT '',
 temporada VARCHAR(100) NOT NULL DEFAULT '',
 frecuencia VARCHAR(100) NOT NULL DEFAULT '',
 observaciones TEXT NULL,
 actualizado_por VARCHAR(100) NOT NULL,
 actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX (proveedor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS gastos_adicionales (
 id INT AUTO_INCREMENT PRIMARY KEY,
 servicio_id INT NULL,
 fecha DATE NOT NULL,
 concepto VARCHAR(255) NOT NULL,
 monto DECIMAL(12,2) NOT NULL,
 registrado_por VARCHAR(100) NOT NULL,
 creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX (fecha), INDEX (servicio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Preparar la columna para password_hash conservando las claves existentes.
ALTER TABLE usuarios MODIFY password VARCHAR(255) NOT NULL;

CREATE TABLE IF NOT EXISTS servicio_abonos (
 id INT AUTO_INCREMENT PRIMARY KEY,
 servicio_id INT NOT NULL,
 fecha DATE NOT NULL,
 monto DECIMAL(12,2) NOT NULL,
 referencia VARCHAR(255) NOT NULL,
 registrado_por VARCHAR(100) NOT NULL,
 creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX (servicio_id), INDEX (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

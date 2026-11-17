-- Ejecutar una vez en transporte_db antes de usar el módulo de facturas.
-- El estado se asocia al servicio y número para no reutilizar pagos al renumerar.
CREATE TABLE IF NOT EXISTS factura_pagos (
    servicio_id INT NOT NULL,
    numero_factura VARCHAR(255) NOT NULL,
    estado_pago ENUM('por_pagar', 'pagada') NOT NULL,
    fecha_pago DATE NULL,
    actualizado_por VARCHAR(255) NOT NULL,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (servicio_id, numero_factura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

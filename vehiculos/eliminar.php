<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
crud_ejecutar(fn() => crud_eliminar($conn, 'vehiculos', 'Vehículo', [
    ['servicios', 'vehiculo_id', 'El vehículo tiene servicios en el historial; cámbielo a Inactivo en lugar de eliminarlo.'],
    ['gastos_operativos', 'vehiculo_id', 'El vehículo tiene gastos registrados; cámbielo a Inactivo en lugar de eliminarlo.'],
]));

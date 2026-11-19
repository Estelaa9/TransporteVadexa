<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
crud_ejecutar(fn() => crud_eliminar($conn, 'conductores', 'Conductor', [
    ['servicios', 'conductor_id', 'El conductor tiene servicios en el historial; cámbielo a Inactivo en lugar de eliminarlo.'],
]));

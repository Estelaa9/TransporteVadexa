<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
crud_ejecutar(fn() => crud_eliminar($conn, 'clientes', 'Cliente', [
    ['servicios', 'cliente_id', 'El cliente tiene servicios en el historial; no se puede eliminar.'],
    ['comprobantes', 'cliente_id', 'El cliente tiene comprobantes registrados; no se puede eliminar.'],
    ['usuarios', 'cliente_id', 'El cliente tiene una cuenta del portal; elimine o reasigne primero el usuario.'],
]));

<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_auth();
crud_ejecutar(fn() => crud_eliminar($conn, 'gastos_administrativos', 'Gasto'));

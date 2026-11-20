<?php
// config/permisos.php - Modelo RBAC: usuario → rol → permisos (módulo × acción).
// Mejora 1 del documento de mejoras y hallazgos SEG-08, SEG-09, SEG-10, SEG-27 de la auditoría.

const RBAC_ACCIONES = [
    'ver' => 'Ver',
    'crear' => 'Crear',
    'editar' => 'Editar',
    'anular' => 'Anular',
    'exportar' => 'Exportar',
];

/** Catálogo de módulos y acciones que admite cada uno. */
function rbac_modulos(): array {
    $todas = array_keys(RBAC_ACCIONES);
    return [
        'dashboard' => ['nombre' => 'Dashboard', 'descripcion' => 'Indicadores financieros y operativos del mes.', 'acciones' => ['ver']],
        'servicios' => ['nombre' => 'Servicios', 'descripcion' => 'Registro, edición y anulación de servicios de transporte.', 'acciones' => $todas],
        'programacion' => ['nombre' => 'Programación', 'descripcion' => 'Calendario diario y cambio de estado de los viajes.', 'acciones' => ['ver', 'editar']],
        'operacion' => ['nombre' => 'Control operativo', 'descripcion' => 'Fichas operativas y proveedores de cada servicio.', 'acciones' => ['ver', 'editar', 'exportar']],
        'clientes' => ['nombre' => 'Clientes', 'descripcion' => 'Cartera de clientes y condiciones de crédito.', 'acciones' => $todas],
        'vehiculos' => ['nombre' => 'Vehículos', 'descripcion' => 'Flota propia, capacidad y documentos.', 'acciones' => $todas],
        'conductores' => ['nombre' => 'Conductores', 'descripcion' => 'Conductores, licencias y vencimientos.', 'acciones' => $todas],
        'proveedores' => ['nombre' => 'Proveedores', 'descripcion' => 'Transportistas tercerizados.', 'acciones' => $todas],
        'gastos_operativos' => ['nombre' => 'Gastos operativos', 'descripcion' => 'Combustible, peajes y mantenimiento de la flota.', 'acciones' => $todas],
        'gastos_administrativos' => ['nombre' => 'Gastos administrativos', 'descripcion' => 'Gastos generales de la empresa.', 'acciones' => $todas],
        'cierre' => ['nombre' => 'Cierre y adicionales', 'descripcion' => 'Resultado del período y gastos adicionales.', 'acciones' => ['ver', 'crear', 'exportar']],
        'facturas' => ['nombre' => 'Facturación', 'descripcion' => 'Emisión y anulación (nota de crédito) de comprobantes.', 'acciones' => ['ver', 'crear', 'anular', 'exportar']],
        'cuentas' => ['nombre' => 'Cuentas por cobrar', 'descripcion' => 'Pagos, saldos, vencimientos y alertas de cobranza.', 'acciones' => ['ver', 'crear', 'anular', 'exportar']],
        'reportes' => ['nombre' => 'Reportes', 'descripcion' => 'Reportes de servicios, facturación, margen y clientes.', 'acciones' => ['ver', 'exportar']],
        'analisis' => ['nombre' => 'Análisis integral', 'descripcion' => 'Indicadores comparados, diagnóstico y recomendaciones.', 'acciones' => ['ver', 'editar', 'exportar']],
        'auditoria' => ['nombre' => 'Auditoría', 'descripcion' => 'Registro de quién hizo cada cambio.', 'acciones' => ['ver', 'exportar']],
        'usuarios' => ['nombre' => 'Usuarios y roles', 'descripcion' => 'Cuentas, roles y matriz de permisos.', 'acciones' => ['ver', 'crear', 'editar']],
        'portal' => ['nombre' => 'Portal del cliente', 'descripcion' => 'Servicios, comprobantes y saldo del propio cliente.', 'acciones' => ['ver']],
    ];
}

/** Roles base que se crean con la migración. El administrador tiene todos los permisos. */
function rbac_roles_base(): array {
    $m = rbac_modulos();
    $todo = function (array $excluir = []) use ($m) {
        $out = [];
        foreach ($m as $mod => $def) {
            if (in_array($mod, $excluir, true)) continue;
            $out[$mod] = $def['acciones'];
        }
        return $out;
    };
    $lectura = [];
    foreach ($m as $mod => $def) {
        if (in_array($mod, ['usuarios', 'portal'], true)) continue;
        $lectura[$mod] = array_values(array_intersect($def['acciones'], ['ver', 'exportar']));
    }
    return [
        'administrador' => ['nombre' => 'Administrador', 'descripcion' => 'Acceso total, incluida la gestión de usuarios y roles.', 'permisos' => $todo(['portal'])],
        'gerencia' => ['nombre' => 'Gerencia', 'descripcion' => 'Consulta todos los módulos y define las reglas del diagnóstico.', 'permisos' => array_merge($lectura, ['analisis' => ['ver', 'editar', 'exportar']])],
        'contabilidad' => ['nombre' => 'Contabilidad', 'descripcion' => 'Facturación, cobranza, gastos y reportes.', 'permisos' => [
            'dashboard' => ['ver'], 'servicios' => ['ver', 'exportar'], 'clientes' => ['ver', 'crear', 'editar', 'exportar'],
            'proveedores' => ['ver'], 'facturas' => ['ver', 'crear', 'anular', 'exportar'], 'cuentas' => ['ver', 'crear', 'anular', 'exportar'],
            'gastos_operativos' => ['ver', 'crear', 'editar', 'anular', 'exportar'], 'gastos_administrativos' => ['ver', 'crear', 'editar', 'anular', 'exportar'],
            'cierre' => ['ver', 'crear', 'exportar'], 'reportes' => ['ver', 'exportar'], 'analisis' => ['ver', 'exportar'],
        ]],
        'operaciones' => ['nombre' => 'Operaciones', 'descripcion' => 'Registro y programación de servicios, flota y conductores. Sin acceso a finanzas.', 'permisos' => [
            'servicios' => ['ver', 'crear', 'editar'], 'programacion' => ['ver', 'editar'], 'operacion' => ['ver', 'editar'],
            'clientes' => ['ver', 'crear', 'editar'], 'vehiculos' => ['ver', 'crear', 'editar'], 'conductores' => ['ver', 'crear', 'editar'],
            'proveedores' => ['ver', 'crear', 'editar'], 'gastos_operativos' => ['ver', 'crear'],
        ]],
        'cliente' => ['nombre' => 'Cliente', 'descripcion' => 'Acceso al portal: solo sus propios servicios, comprobantes y saldo.', 'permisos' => ['portal' => ['ver']]],
    ];
}

/**
 * Permiso requerido por cada endpoint (deny by default: un script que no figure aquí solo lo usa el administrador).
 * Cada valor es una lista de alternativas [módulo, acción]; basta cumplir una.
 * Un arreglo indexado por método HTTP permite exigir permisos distintos para GET y POST.
 */
function rbac_endpoints(): array {
    $listaServicios = [['servicios', 'crear'], ['servicios', 'editar']];
    return [
        'dashboard/index.php' => [['dashboard', 'ver']],
        'chatbot/responder.php' => 'autenticado',
        'usuarios/index.php' => [['usuarios', 'ver']],
        'usuarios/gestionar.php' => [['usuarios', 'crear'], ['usuarios', 'editar']],
        'usuarios/guardar.php' => [['usuarios', 'crear'], ['usuarios', 'editar']],
        'usuarios/roles.php' => ['GET' => [['usuarios', 'ver']], 'POST' => [['usuarios', 'editar']]],
        'usuarios/permisos.php' => [['usuarios', 'editar']],
        'usuarios/mi_password.php' => 'autenticado',

        'servicios/index.php' => [['servicios', 'ver'], ['operacion', 'ver'], ['facturas', 'crear']],
        'servicios/guardar.php' => [['servicios', 'crear']],
        'servicios/actualizar.php' => [['servicios', 'editar']],
        'servicios/eliminar.php' => [['servicios', 'anular']],
        'servicios/cambiar_estado.php' => [['servicios', 'editar'], ['programacion', 'editar']],
        'servicios/correlativo.php' => $listaServicios,
        'servicios/imprimir.php' => [['servicios', 'ver'], ['operacion', 'ver']],
        'servicios/operacion.php' => ['GET' => [['operacion', 'ver']], 'POST' => [['operacion', 'editar']]],
        'servicios/programacion.php' => [['programacion', 'ver']],

        'clientes/index.php' => array_merge([['clientes', 'ver'], ['facturas', 'crear']], $listaServicios),
        'clientes/guardar.php' => [['clientes', 'crear']],
        'clientes/actualizar.php' => [['clientes', 'editar']],
        'clientes/eliminar.php' => [['clientes', 'anular']],
        'clientes/servicios.php' => [['clientes', 'ver']],

        'vehiculos/index.php' => array_merge([['vehiculos', 'ver'], ['gastos_operativos', 'ver']], $listaServicios),
        'vehiculos/guardar.php' => [['vehiculos', 'crear']],
        'vehiculos/actualizar.php' => [['vehiculos', 'editar']],
        'vehiculos/eliminar.php' => [['vehiculos', 'anular']],

        'conductores/index.php' => array_merge([['conductores', 'ver']], $listaServicios),
        'conductores/guardar.php' => [['conductores', 'crear']],
        'conductores/actualizar.php' => [['conductores', 'editar']],
        'conductores/eliminar.php' => [['conductores', 'anular']],
        'conductores/disponibles.php' => array_merge([['programacion', 'ver']], $listaServicios),

        'proveedores/index.php' => array_merge([['proveedores', 'ver'], ['operacion', 'ver']], $listaServicios),
        'proveedores/guardar.php' => [['proveedores', 'crear']],
        'proveedores/actualizar.php' => [['proveedores', 'editar']],
        'proveedores/eliminar.php' => [['proveedores', 'anular']],

        'gastos_operativos/index.php' => [['gastos_operativos', 'ver']],
        'gastos_operativos/guardar.php' => [['gastos_operativos', 'crear']],
        'gastos_operativos/actualizar.php' => [['gastos_operativos', 'editar']],
        'gastos_operativos/eliminar.php' => [['gastos_operativos', 'anular']],
        'gastos_administrativos/index.php' => [['gastos_administrativos', 'ver']],
        'gastos_administrativos/guardar.php' => [['gastos_administrativos', 'crear']],
        'gastos_administrativos/actualizar.php' => [['gastos_administrativos', 'editar']],
        'gastos_administrativos/eliminar.php' => [['gastos_administrativos', 'anular']],
        'gastos_adicionales/guardar.php' => [['cierre', 'crear']],

        'reportes/servicios.php' => [['reportes', 'ver']],
        'reportes/clientes.php' => [['reportes', 'ver']],
        'reportes/facturacion.php' => [['reportes', 'ver']],
        'reportes/utilidad.php' => [['reportes', 'ver']],
        'reportes/cierre.php' => [['cierre', 'ver']],

        'facturas/index.php' => [['facturas', 'ver']],
        'facturas/emitir.php' => [['facturas', 'crear']],
        'facturas/anular.php' => [['facturas', 'anular']],
        'facturas/cuentas.php' => [['cuentas', 'ver']],
        'facturas/pago.php' => [['cuentas', 'crear']],
        'facturas/anular_pago.php' => [['cuentas', 'anular']],

        'analisis/index.php' => [['analisis', 'ver']],
        'analisis/reglas.php' => ['GET' => [['analisis', 'ver']], 'POST' => [['analisis', 'editar']]],

        'auditoria/index.php' => [['auditoria', 'ver']],

        'portal/datos.php' => [['portal', 'ver']],
    ];
}

/** Carga los permisos efectivos del rol como ['modulo' => ['ver' => true, ...]]. */
function rbac_cargar_permisos(mysqli $conn, string $rol): array {
    $stmt = db_query($conn, 'SELECT p.modulo, p.accion FROM rol_permisos p JOIN roles r ON r.id = p.rol_id WHERE r.codigo = ? AND r.activo = 1', 's', [$rol]);
    $res = mysqli_stmt_get_result($stmt);
    $permisos = [];
    while ($row = mysqli_fetch_assoc($res)) {
        $permisos[$row['modulo']][$row['accion']] = true;
    }
    return $permisos;
}

function rbac_es_admin(?string $rol = null): bool {
    $rol = strtolower((string)($rol ?? ($_SESSION['rol'] ?? '')));
    return in_array($rol, ['administrador', 'admin'], true);
}

/** ¿El usuario en sesión puede hacer $accion en $modulo? */
function puede(string $modulo, string $accion = 'ver'): bool {
    if (rbac_es_admin()) return $modulo !== 'portal';
    return !empty($_SESSION['permisos'][$modulo][$accion]);
}

/** Termina con 403 si el usuario no tiene el permiso indicado. */
function require_permission(string $modulo, string $accion = 'ver'): void {
    require_auth(false);
    if (!puede($modulo, $accion)) {
        json_response(['success' => false, 'error' => 'No tiene permiso para realizar esta acción.'], 403);
    }
}

/** Verifica el permiso del endpoint en ejecución según rbac_endpoints(). */
function rbac_verificar_endpoint(): void {
    $root = realpath(__DIR__ . '/..');
    $script = realpath($_SERVER['SCRIPT_FILENAME'] ?? '') ?: '';
    $rel = str_replace('\\', '/', ltrim(substr($script, strlen((string)$root)), '\\/'));
    $mapa = rbac_endpoints();
    $regla = $mapa[$rel] ?? null;
    if ($regla === 'autenticado') return;
    if (is_array($regla) && isset($regla['GET']) || is_array($regla) && isset($regla['POST'])) {
        $metodo = $_SERVER['REQUEST_METHOD'] === 'GET' ? 'GET' : 'POST';
        $regla = $regla[$metodo] ?? null;
    }
    if ($regla === null) {
        // Endpoint no catalogado: solo administrador (deny by default).
        if (!rbac_es_admin()) json_response(['success' => false, 'error' => 'No tiene permiso para acceder a este recurso.'], 403);
        return;
    }
    foreach ($regla as [$modulo, $accion]) {
        if (puede($modulo, $accion)) return;
    }
    json_response(['success' => false, 'error' => 'No tiene permiso para acceder a este módulo.'], 403);
}

/** Permisos en formato de lista para el frontend. */
function rbac_permisos_sesion(): array {
    if (rbac_es_admin()) {
        $out = [];
        foreach (rbac_modulos() as $mod => $def) {
            if ($mod === 'portal') continue;
            $out[$mod] = $def['acciones'];
        }
        return $out;
    }
    $out = [];
    foreach ($_SESSION['permisos'] ?? [] as $mod => $acciones) {
        $out[$mod] = array_keys(array_filter($acciones));
    }
    return $out;
}

<?php
// tests/api.integration.php - Pruebas de integración de la API contra un servidor en ejecución.
// Cubre las pruebas de la sección 5 del informe de auditoría y los flujos de las tres mejoras.
//
// NO ejecutar contra la base de producción: crea usuarios, clientes, servicios y comprobantes de prueba.
// Uso (con una copia de la base):
//   VADEXSA_DB_NAME=transporte_db_prueba php -S 127.0.0.1:8099 -t .
//   php tests/api.integration.php http://127.0.0.1:8099 <usuario_admin> <clave_admin>
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
date_default_timezone_set('America/Lima'); // misma zona que el servidor
$base = rtrim($argv[1] ?? 'http://127.0.0.1:8099', '/');
$adminUser = $argv[2] ?? 'admin';
$adminPass = $argv[3] ?? 'admin123';
$nuevaClaveAdmin = 'ClaveSegura2026x';

final class Cliente {
    private string $jar;
    public string $csrf = '';
    public function __construct(private string $base) { $this->jar = tempnam(sys_get_temp_dir(), 'vdx'); }
    public function req(string $method, string $path, ?array $body = null, bool $csrf = true): array {
        $ch = $this->handle($method, $path, $body, $csrf);
        $raw = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return $this->parse($status, $raw);
    }
    public function handle(string $method, string $path, ?array $body = null, bool $csrf = true) {
        $ch = curl_init($this->base . '/' . ltrim($path, '/'));
        $headers = ['Accept: application/json'];
        if ($csrf && $this->csrf) $headers[] = 'X-CSRF-Token: ' . $this->csrf;
        if ($body !== null) { $headers[] = 'Content-Type: application/json'; curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body)); }
        curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers,
            CURLOPT_COOKIEJAR => $this->jar, CURLOPT_COOKIEFILE => $this->jar, CURLOPT_TIMEOUT => 60]);
        return $ch;
    }
    public function parse(int $status, $raw): array {
        $json = json_decode((string)$raw, true);
        if (!is_array($json)) $json = ['_raw' => substr((string)$raw, 0, 500)];
        if (!empty($json['csrf_token'])) $this->csrf = $json['csrf_token'];
        return [$status, $json];
    }
    public function login(string $u, string $p): array {
        $this->req('GET', 'login/validar.php?action=me');
        return $this->req('POST', 'login/validar.php', ['usuario' => $u, 'password' => $p]);
    }
}

$ok = 0; $fail = 0;
function check(string $nombre, bool $cond, $detalle = null): void {
    global $ok, $fail;
    if ($cond) { $ok++; echo "  ✔ $nombre\n"; }
    else { $fail++; echo "  ✘ $nombre\n"; if ($detalle !== null) echo '      ' . substr(json_encode($detalle, JSON_UNESCAPED_UNICODE), 0, 600) . "\n"; }
}
function ruc(string $prefijo10): string {
    $f = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]; $s = 0;
    for ($i = 0; $i < 10; $i++) $s += (int)$prefijo10[$i] * $f[$i];
    $dv = 11 - ($s % 11); if ($dv === 10) $dv = 0; if ($dv === 11) $dv = 1;
    return $prefijo10 . $dv;
}
$uid = substr((string)time(), -6);
$hoy = date('Y-m-d');
$fecha = $hoy;

echo "== Autenticación y sesión ==\n";
$anon = new Cliente($base);
[$s] = $anon->login("' OR '1'='1", "' OR '1'='1");
check('1. Inyección SQL en el login es rechazada (401)', $s === 401);
[$s] = $anon->req('GET', 'servicios/index.php');
check('Sin sesión la API responde 401', $s === 401);

$admin = new Cliente($base);
[$s, $r] = $admin->login($adminUser, $adminPass);
if ($s !== 200) { [$s, $r] = $admin->login($adminUser, $nuevaClaveAdmin); $adminPass = $nuevaClaveAdmin; }
check('Login de administrador', $s === 200 && !empty($r['success']), $r);
if (!empty($r['user']['debe_cambiar_password'])) {
    [$s] = $admin->req('GET', 'dashboard/index.php');
    check('Con contraseña inicial débil se exige el cambio (403)', $s === 403);
    [$s, $r] = $admin->req('POST', 'usuarios/mi_password.php', ['actual' => $adminPass, 'nueva' => $nuevaClaveAdmin]);
    check('Cambio de contraseña inicial', $s === 200, $r);
    $adminPass = $nuevaClaveAdmin;
}
[$s, $r] = $admin->req('POST', 'clientes/guardar.php', ['nombre' => 'X', 'tipo_cliente' => 'Empresa', 'documento' => ruc('2099' . $uid)], false);
check('POST sin token CSRF es rechazado (403)', $s === 403, $r);

echo "== Clientes, flota y validaciones ==\n";
$rucA = ruc('2060' . $uid); $rucB = ruc('2061' . $uid);
[$s, $r] = $admin->req('POST', 'clientes/guardar.php', ['nombre' => '<img src=x onerror=alert(1)> Cliente A', 'tipo_cliente' => 'Empresa', 'documento' => $rucA, 'dias_credito' => 30]);
check('Registrar cliente A con RUC válido', $s === 201, $r);
$clienteA = $r['id'] ?? 0;
[$s, $r] = $admin->req('GET', "clientes/index.php?id=$clienteA");
check('6. El nombre con HTML se devuelve literal (el frontend lo escapa)', ($r['data']['nombre'] ?? '') === '<img src=x onerror=alert(1)> Cliente A');
[$s, $r] = $admin->req('POST', 'clientes/guardar.php', ['nombre' => 'Cliente B', 'tipo_cliente' => 'Empresa', 'documento' => $rucB]);
$clienteB = $r['id'] ?? 0;
[$s] = $admin->req('POST', 'clientes/guardar.php', ['nombre' => 'RUC malo', 'tipo_cliente' => 'Empresa', 'documento' => '20123456789']);
check('RUC con dígito verificador incorrecto es rechazado (422)', $s === 422);
[$s] = $admin->req('POST', 'clientes/guardar.php', ['nombre' => 'Duplicado', 'tipo_cliente' => 'Empresa', 'documento' => $rucA]);
check('Documento duplicado es rechazado (409)', $s === 409);

$placa = 'T' . substr($uid, -2) . '-' . substr($uid, 0, 3);
[$s, $r] = $admin->req('POST', 'vehiculos/guardar.php', ['placa' => $placa, 'modelo' => 'Prueba', 'tipo' => 'Camión', 'capacidad_kg' => 5000, 'estado' => 'activo',
    'soat_vencimiento' => date('Y-m-d', strtotime('+1 year')), 'revision_vencimiento' => date('Y-m-d', strtotime('+1 year'))]);
check('Registrar vehículo', $s === 201, $r);
$veh = $r['id'] ?? 0;
[$s, $r] = $admin->req('POST', 'vehiculos/guardar.php', ['placa' => 'M' . substr($uid, -2) . '-' . substr($uid, 0, 3), 'estado' => 'mantenimiento']);
$vehMant = $r['id'] ?? 0;
[$s, $r] = $admin->req('POST', 'conductores/guardar.php', ['nombre' => 'Conductor Prueba', 'licencia' => 'Q' . $uid . '01', 'estado' => 'activo', 'licencia_vencimiento' => date('Y-m-d', strtotime('+1 year'))]);
check('Registrar conductor', $s === 201, $r);
$cond = $r['id'] ?? 0;
[$s, $r] = $admin->req('POST', 'conductores/guardar.php', ['nombre' => 'Conductor Vencido', 'licencia' => 'Q' . $uid . '02', 'estado' => 'activo', 'licencia_vencimiento' => date('Y-m-d', strtotime('-1 day'))]);
$condVencido = $r['id'] ?? 0;
[$s, $r] = $admin->req('POST', 'proveedores/guardar.php', ['nombre' => 'Transportes Tercero ' . $uid, 'estado' => 'activo']);
$prov = $r['id'] ?? 0;
[$s, $r] = $admin->req('POST', 'gastos_operativos/guardar.php', ['fecha' => $hoy, 'vehiculo_id' => $veh, 'tipo' => 'Combustible', 'descripcion' => 'Prueba', 'monto' => 100]);
check('Registrar gasto operativo (antes fallaba por la columna tipo)', $s === 201, $r);

echo "== Servicios: reglas de negocio ==\n";
$srv = fn(array $extra) => array_merge(['fecha_servicio' => $fecha, 'hora_servicio' => '08:00', 'hora_fin_estimada' => '14:00', 'cliente_id' => $clienteA,
    'modalidad' => 'propio', 'vehiculo_id' => $veh, 'conductor_id' => $cond, 'tipo_servicio' => 'Local', 'forma_pago' => 'Crédito 30 días',
    'origen' => 'Lima', 'destino' => 'Callao', 'tipo_comprobante' => 'FACTURA', 'precio_cliente' => 1180], $extra);
[$s, $r] = $admin->req('POST', 'servicios/guardar.php', $srv([]));
check('Registrar servicio 08:00–14:00', $s === 201, $r);
$s1 = $r['id'] ?? 0;
[$s, $r] = $admin->req('POST', 'servicios/guardar.php', $srv(['hora_servicio' => '10:00', 'hora_fin_estimada' => '12:00']));
check('8. Mismo vehículo 10:00–12:00 se rechaza por solapamiento (409)', $s === 409, $r);
[$s] = $admin->req('POST', 'servicios/guardar.php', $srv(['hora_servicio' => '22:00', 'hora_fin_estimada' => '02:00', 'fecha_servicio' => date('Y-m-d', strtotime("$fecha -1 day"))]));
check('Viaje que cruza la medianoche sin solape se acepta', $s === 201);
[$s, $r] = $admin->req('POST', 'servicios/guardar.php', $srv(['vehiculo_id' => $vehMant, 'hora_servicio' => '15:00', 'hora_fin_estimada' => '16:00']));
check('9a. Vehículo en mantenimiento se rechaza', $s === 409, $r);
[$s, $r] = $admin->req('POST', 'servicios/guardar.php', $srv(['conductor_id' => $condVencido, 'hora_servicio' => '15:00', 'hora_fin_estimada' => '16:00']));
check('9b. Conductor con licencia vencida se rechaza', $s === 409, $r);
[$s, $r] = $admin->req('POST', 'servicios/guardar.php', $srv(['modalidad' => 'tercerizado', 'proveedor_id' => $prov, 'costo_proveedor' => 500, 'hora_servicio' => '09:00', 'hora_fin_estimada' => '11:00']));
check('Servicio tercerizado no ocupa flota propia (sin cruce)', $s === 201, $r);
$s2 = $r['id'] ?? 0;
[$s, $r] = $admin->req('GET', "servicios/index.php?id=$s2");
$d = $r['data'] ?? [];
check('7. S/ 1,180 con costo 500 → base 1,000.00; IGV 180.00; margen 500.00', (float)($d['base_imponible'] ?? 0) === 1000.0 && (float)($d['igv'] ?? 0) === 180.0 && (float)($d['utilidad'] ?? 0) === 500.0, $d);
check('NEG-11: tercerizado sin vehículo ni conductor propios', array_key_exists('vehiculo_id', $d) && $d['vehiculo_id'] === null && $d['conductor_id'] === null, $d);
[$s] = $admin->req('POST', 'servicios/guardar.php', $srv(['precio_cliente' => -10, 'hora_servicio' => '18:00', 'hora_fin_estimada' => '19:00']));
check('Monto negativo rechazado en el servidor (422)', $s === 422);
[$s] = $admin->req('POST', 'servicios/cambiar_estado.php', ['id' => $s1, 'estado_servicio' => 'programado']);
check('Transición de estado inválida rechazada (409)', $s === 409);

echo "== Facturación y cuentas por cobrar ==\n";
[$s, $r] = $admin->req('POST', 'facturas/emitir.php', ['servicio_ids' => [$s1], 'tipo' => 'FACTURA', 'fecha_emision' => $hoy]);
check('No se factura un servicio programado (NEG-12)', $s === 409, $r);
foreach ([$s1, $s2] as $sid) {
    $admin->req('POST', 'servicios/cambiar_estado.php', ['id' => $sid, 'estado_servicio' => 'en_ruta']);
    $admin->req('POST', 'servicios/cambiar_estado.php', ['id' => $sid, 'estado_servicio' => 'finalizado']);
}
// 10. Dos emisiones simultáneas obtienen números distintos.
$mh = curl_multi_init();
$h1 = $admin->handle('POST', 'facturas/emitir.php', ['servicio_ids' => [$s1], 'tipo' => 'FACTURA', 'fecha_emision' => $fecha]);
$h2 = $admin->handle('POST', 'facturas/emitir.php', ['servicio_ids' => [$s2], 'tipo' => 'FACTURA', 'fecha_emision' => $fecha]);
curl_multi_add_handle($mh, $h1); curl_multi_add_handle($mh, $h2);
do { curl_multi_exec($mh, $running); curl_multi_select($mh); } while ($running);
[$st1, $e1] = $admin->parse(curl_getinfo($h1, CURLINFO_HTTP_CODE), curl_multi_getcontent($h1));
[$st2, $e2] = $admin->parse(curl_getinfo($h2, CURLINFO_HTTP_CODE), curl_multi_getcontent($h2));
check('10. Emisiones simultáneas con números distintos', $st1 === 201 && $st2 === 201 && ($e1['numero'] ?? 1) !== ($e2['numero'] ?? 1), [$e1, $e2]);
$comp1 = $e1['id'] ?? 0; $comp2 = $e2['id'] ?? 0;
check('Vencimiento a 30 días según la forma de pago', ($e1['fecha_vencimiento'] ?? '') === date('Y-m-d', strtotime("$fecha +30 days")), $e1);
[$s] = $admin->req('POST', 'facturas/emitir.php', ['servicio_ids' => [$s1], 'tipo' => 'FACTURA', 'fecha_emision' => $fecha]);
check('No se factura dos veces el mismo servicio (409)', $s === 409);
[$s, $r] = $admin->req('POST', 'servicios/actualizar.php', $srv(['id' => $s1, 'precio_cliente' => 2000, 'estado_servicio' => 'finalizado']));
check('NEG-15: no se cambia el importe de un servicio facturado (409)', $s === 409, $r);
[$s, $r] = $admin->req('POST', 'facturas/pago.php', ['comprobante_id' => $comp1, 'fecha' => date('Y-m-d', strtotime('-1 day')), 'monto' => 500, 'medio' => 'transferencia', 'referencia' => 'OP-1']);
check('Pago anterior a la emisión rechazado', $s === 422, $r);
[$s, $r] = $admin->req('POST', 'facturas/anular.php', ['id' => $comp2, 'motivo' => 'Prueba de anulación con nota de crédito']);
check('Anulación con nota de crédito', $s === 200, $r);
[$s, $r] = $admin->req('GET', "facturas/index.php?id=$comp2");
check('11a. Anular comprobante genera nota de crédito y conserva el número', ($r['data']['estado'] ?? '') === 'anulada' && !empty($r['data']['nota_credito']), $r['data'] ?? $r);
[$s, $r] = $admin->req('POST', 'servicios/eliminar.php', ['id' => $s1, 'motivo' => 'Prueba']);
check('11b. No se cancela un servicio con comprobante vigente (409)', $s === 409, $r);
[$s, $r] = $admin->req('GET', "servicios/index.php?id=$s2");
check('11c. El servicio queda libre para refacturar tras la nota de crédito', array_key_exists('comprobante_id', $r['data'] ?? []) && $r['data']['comprobante_id'] === null, $r['data'] ?? $r);

// Comprobante con fecha de hoy para pagos parciales.
[$s, $r] = $admin->req('POST', 'servicios/guardar.php', $srv(['fecha_servicio' => $hoy, 'hora_servicio' => '03:00', 'hora_fin_estimada' => '04:00', 'estado_servicio' => 'finalizado']));
$s3 = $r['id'] ?? 0;
[$s, $r] = $admin->req('POST', 'facturas/emitir.php', ['servicio_ids' => [$s3], 'tipo' => 'FACTURA', 'fecha_emision' => $hoy, 'dias_credito' => 0]);
$comp3 = $r['id'] ?? 0;
[$s, $r] = $admin->req('POST', 'facturas/pago.php', ['comprobante_id' => $comp3, 'fecha' => $hoy, 'monto' => 2000, 'medio' => 'transferencia', 'referencia' => 'OP-X']);
check('Pago mayor al saldo rechazado', $s === 422, $r);
[$s, $r] = $admin->req('POST', 'facturas/pago.php', ['comprobante_id' => $comp3, 'fecha' => $hoy, 'monto' => 180, 'medio' => 'yape', 'referencia' => 'OP-2']);
check('Pago parcial registrado', $s === 201 && abs(($r['saldo'] ?? 0) - 1000) < 0.01, $r);
[$s, $r] = $admin->req('GET', "facturas/index.php?id=$comp3");
check('Estado de pago calculado: parcial', ($r['data']['estado_pago'] ?? '') === 'parcial', $r['data'] ?? $r);
[$s, $r] = $admin->req('POST', 'facturas/pago.php', ['comprobante_id' => $comp3, 'fecha' => $hoy, 'monto' => 1000, 'medio' => 'transferencia', 'referencia' => 'OP-3']);
[$s, $r] = $admin->req('GET', "facturas/index.php?id=$comp3");
check('Estado de pago calculado: pagada', ($r['data']['estado_pago'] ?? '') === 'pagada', $r['data'] ?? $r);
[$s, $r] = $admin->req('GET', 'facturas/cuentas.php');
check('Cuentas por cobrar con resumen, antigüedad y PPC', $s === 200 && isset($r['resumen']['antiguedad'], $r['resumen']['pct_vencido']) && array_key_exists('ppc_dias', $r['resumen']), $r['resumen'] ?? $r);

echo "== Roles y permisos ==\n";
[$s, $r] = $admin->req('POST', 'usuarios/gestionar.php', ['nombre' => 'Operador Prueba', 'usuario' => "oper$uid", 'password' => 'Operador2026x', 'rol' => 'operaciones', 'estado' => 'activo']);
check('Crear usuario con rol Operaciones', $s === 200, $r);
[$s] = $admin->req('POST', 'usuarios/gestionar.php', ['nombre' => 'Débil', 'usuario' => "debil$uid", 'password' => '123', 'rol' => 'operaciones']);
check('Contraseña débil rechazada (422)', $s === 422);
$oper = new Cliente($base);
$oper->login("oper$uid", 'Operador2026x');
$oper->req('POST', 'usuarios/mi_password.php', ['actual' => 'Operador2026x', 'nueva' => 'Operador2026y']);
[$s] = $oper->req('GET', 'dashboard/index.php');
check('4. Rol Operaciones no accede al dashboard financiero (403)', $s === 403);
[$s] = $oper->req('GET', 'facturas/cuentas.php');
check('Rol Operaciones no accede a cuentas por cobrar (403)', $s === 403);
[$s] = $oper->req('GET', 'servicios/index.php?limit=5');
check('Rol Operaciones sí consulta servicios', $s === 200);
[$s] = $oper->req('POST', 'usuarios/gestionar.php', ['nombre' => 'Hacker', 'usuario' => "hack$uid", 'password' => 'Hacker2026xx', 'rol' => 'administrador']);
check('Rol Operaciones no puede crear usuarios (403)', $s === 403);
[$s] = $oper->req('POST', 'servicios/eliminar.php', ['id' => $s1, 'motivo' => 'Intento sin permiso']);
check('Rol Operaciones no puede anular servicios (403)', $s === 403);
[$s] = $oper->req('GET', 'servicios/eliminar.php?id=1');
check('3. GET a un endpoint que modifica datos responde 405 o 403', in_array($s, [403, 405], true));
[$s] = $admin->req('GET', 'servicios/eliminar.php?id=1');
check('3. GET a eliminar con sesión de administrador responde 405', $s === 405);

echo "== Portal del cliente ==\n";
$admin->req('POST', 'usuarios/gestionar.php', ['nombre' => 'Portal A', 'usuario' => "porta$uid", 'password' => 'PortalA2026x', 'rol' => 'cliente', 'cliente_id' => $clienteA, 'estado' => 'activo']);
[$s, $r] = $admin->req('POST', 'usuarios/gestionar.php', ['nombre' => 'Portal sin cliente', 'usuario' => "portx$uid", 'password' => 'PortalX2026x', 'rol' => 'cliente']);
check('Rol Cliente exige cliente vinculado (422)', $s === 422, $r);
$portal = new Cliente($base);
[$s, $r] = $portal->login("porta$uid", 'PortalA2026x');
check('Login de cliente redirige al portal', ($r['redirect'] ?? '') === 'portal.html', $r);
$portal->req('POST', 'usuarios/mi_password.php', ['actual' => 'PortalA2026x', 'nueva' => 'PortalA2026y']);
[$s, $r] = $portal->req('GET', 'portal/datos.php');
$soloA = $s === 200 && count(array_filter($r['servicios'] ?? [], fn($x) => true)) > 0;
check('El cliente ve sus servicios', $soloA, $r);
[$s, $r] = $admin->req('POST', 'servicios/guardar.php', $srv(['cliente_id' => $clienteB, 'hora_servicio' => '16:00', 'hora_fin_estimada' => '17:00']));
$srvB = $r['id'] ?? 0;
[$s] = $portal->req('GET', "portal/datos.php?servicio_id=$srvB");
check('5. El cliente A no ve el servicio del cliente B (404)', $s === 404);
[$s] = $portal->req('GET', "servicios/index.php?id=$srvB");
check('El cliente no accede a la API interna (403)', $s === 403);

echo "== Análisis integral y auditoría ==\n";
[$s, $r] = $admin->req('GET', 'analisis/index.php?desde=' . date('Y-m-01') . '&hasta=' . date('Y-m-t', strtotime($fecha)));
check('Análisis integral con indicadores y hallazgos', $s === 200 && count($r['data']['indicadores'] ?? []) >= 15 && isset($r['data']['hallazgos']['critico']), $r);
[$s, $r] = $admin->req('GET', 'analisis/reglas.php');
check('Reglas del diagnóstico configurables', $s === 200 && count($r['data'] ?? []) >= 10);
[$s, $r] = $admin->req('GET', 'auditoria/index.php?tabla=comprobantes&limit=5');
check('La auditoría registra la emisión y anulación de comprobantes', $s === 200 && count($r['data'] ?? []) > 0, $r);

echo "== Bloqueo por intentos fallidos ==\n";
$bf = new Cliente($base);
for ($i = 0; $i < 5; $i++) $bf->login("oper$uid", 'incorrecta');
[$s] = $bf->login("oper$uid", 'Operador2026y');
check('Tras 5 intentos fallidos la cuenta se bloquea temporalmente (429)', $s === 429);

echo "\nResultado: $ok correctas, $fail con error.\n";
exit($fail ? 1 : 0);

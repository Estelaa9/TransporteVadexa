<?php
// php tests/gestion.integration.php — base aislada, nunca usa datos de negocio.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$db = new mysqli('localhost', 'root', '');
$name = 'vadexsa_test_' . bin2hex(random_bytes(5));
$server = null;
$http = curl_init();
$log = tempnam(sys_get_temp_dir(), 'vadexsa-test-');
$checks = 0;
function check($condition, $message) { global $checks; if (!$condition) throw new RuntimeException($message); $checks++; echo "OK $message\n"; }
function request($path, $data = null) {
    global $http;
    curl_setopt_array($http, [CURLOPT_URL => 'http://127.0.0.1:18097/' . $path, CURLOPT_RETURNTRANSFER => true, CURLOPT_COOKIEFILE => '', CURLOPT_PROXY => '', CURLOPT_TIMEOUT => 10, CURLOPT_HTTPHEADER => ['Accept: application/json', 'Content-Type: application/json']]);
    curl_setopt($http, CURLOPT_POST, $data !== null);
    if ($data !== null) curl_setopt($http, CURLOPT_POSTFIELDS, json_encode($data));
    $raw = curl_exec($http);
    $json = json_decode($raw, true);
    if (!is_array($json)) throw new RuntimeException('Respuesta inválida en ' . $path . ': ' . substr($raw, 0, 400));
    return [curl_getinfo($http, CURLINFO_HTTP_CODE), $json];
}
try {
    $db->query("CREATE DATABASE `$name` CHARACTER SET utf8mb4");
    $tables = $db->query('SHOW TABLES FROM transporte_db')->fetch_all();
    foreach ($tables as [$table]) {
        if (!preg_match('/^[a-z_]+$/', $table)) throw new RuntimeException('Nombre de tabla inesperado');
        $db->query("CREATE TABLE `$name`.`$table` LIKE transporte_db.`$table`");
    }
    $db->select_db($name);
    foreach (['facturas/esquema.sql', 'migrations/20260922_gestion.sql'] as $file) {
        $db->multi_query(file_get_contents(__DIR__ . '/../' . $file));
        do { if ($r = $db->store_result()) $r->free(); } while ($db->more_results() && $db->next_result());
    }
    $hash = password_hash('Prueba-123456', PASSWORD_DEFAULT);
    $stmt = $db->prepare("INSERT INTO usuarios (nombre,usuario,password,rol,estado) VALUES ('Prueba','testadmin',?,'administrador','activo'),('Operador','testuser',?,'usuario','activo')");
    $stmt->bind_param('ss', $hash, $hash); $stmt->execute();
    $db->query("INSERT INTO clientes (id,nombre,tipo_cliente) VALUES (1,'Cliente de prueba','Empresa')");
    $db->query("INSERT INTO vehiculos (id,placa,estado) VALUES (1,'TEST-01','activo')");
    $db->query("INSERT INTO conductores (id,nombre,estado) VALUES (1,'Conductor prueba','activo')");
    $db->query("INSERT INTO proveedores (id,nombre,estado) VALUES (1,'Proveedor prueba','activo')");
    $env = getenv(); $env['VADEXSA_DB_NAME'] = $name;
    $server = proc_open([PHP_BINARY, '-S', '127.0.0.1:18097', '-t', realpath(__DIR__ . '/..')], [0=>['pipe','r'],1=>['file',$log,'a'],2=>['file',$log,'a']], $pipes, null, $env);
    if (!is_resource($server)) throw new RuntimeException('No se pudo iniciar PHP de prueba.');
    fclose($pipes[0]); usleep(500000);
    [$status] = request('facturas/index.php'); check($status===401,'facturas exige sesión');
    [$status,$session]=request('login/validar.php?action=me');check($status===200 && $session['logged_in']===false,'consulta de sesión anónima permite mostrar login sin respuesta de error');
    request('login/validar.php', ['usuario'=>'testadmin','password'=>'Prueba-123456']);
    [$status, $initialUsers] = request('usuarios/index.php');
    $initialOperator = array_values(array_filter($initialUsers['data'], static fn($user) => $user['usuario'] === 'testuser'))[0];
    $basicModules = ['servicios','programacion','clientes','vehiculos','conductores','proveedores','gastos_operativos'];
    [$status] = request('usuarios/permisos.php', [
        'user_id' => $initialOperator['id'], 'modulos' => $basicModules, 'csrf_token' => $initialUsers['csrf_token']
    ]);
    check($status === 200, 'administrador configura perfil operativo limitado');
    request('login/logout.php', []);
    [$status] = request('login/validar.php', ['usuario'=>'testuser','password'=>'Prueba-123456']); check($status===200,'login con password_hash');
    foreach (['usuarios/index.php','facturas/index.php','reportes/cierre.php','dashboard/index.php'] as $path) { [$status]=request($path); check($status===403,"permiso de perfil bloquea $path"); }
    [$status]=request('servicios/index.php');check($status===200,'operador consulta servicios');
    request('login/logout.php', []);
    request('login/validar.php', ['usuario'=>'testadmin','password'=>'Prueba-123456']);
    $moduleReads = [
        'dashboard/index.php?json=1&mes=9&anio=2026',
        'servicios/index.php',
        'servicios/programacion.php?json=1&fecha=2026-09-01',
        'clientes/index.php',
        'vehiculos/index.php',
        'conductores/index.php',
        'conductores/disponibles.php?fecha=2026-09-01',
        'proveedores/index.php',
        'gastos_operativos/index.php?mes=9&anio=2026',
        'gastos_administrativos/index.php?mes=9&anio=2026',
        'reportes/servicios.php?json=1&desde=2026-09-01&hasta=2026-09-30',
        'reportes/facturacion.php?json=1&desde=2026-09-01&hasta=2026-09-30',
        'reportes/utilidad.php?json=1&desde=2026-09-01&hasta=2026-09-30',
        'reportes/clientes.php?json=1&desde=2026-09-01&hasta=2026-09-30',
        'facturas/index.php',
        'facturas/cuentas.php',
        'reportes/cierre.php?desde=2026-09-01&hasta=2026-09-30',
        'usuarios/index.php'
    ];
    foreach ($moduleReads as $path) {
        [$status, $response] = request($path);
        check($status === 200 && !empty($response['success']), "módulo carga: $path");
    }
    [$status, $userList] = request('usuarios/index.php');
    $operator = array_values(array_filter($userList['data'], static fn($user) => $user['usuario'] === 'testuser'))[0];
    $allowedModules = array_values(array_map(static fn($module) => $module['modulo'], array_filter(
        $userList['module_catalog'],
        static fn($module) => $module['modulo'] !== 'clientes'
    )));
    [$status] = request('usuarios/permisos.php', [
        'user_id' => $operator['id'], 'modulos' => ['no_existe'], 'csrf_token' => $userList['csrf_token']
    ]);
    check($status === 422, 'endpoint de permisos rechaza módulos desconocidos');
    [$status] = request('usuarios/permisos.php', [
        'user_id' => $operator['id'], 'modulos' => $allowedModules, 'csrf_token' => $userList['csrf_token']
    ]);
    check($status === 200, 'administrador actualiza permisos por módulo con CSRF');
    request('login/logout.php', []);
    request('login/validar.php', ['usuario'=>'testuser','password'=>'Prueba-123456']);
    [$status] = request('clientes/index.php'); check($status === 403, 'permiso desactivado bloquea el endpoint del módulo');
    [$status] = request('servicios/index.php'); check($status === 200, 'permiso habilitado conserva acceso al módulo');
    request('login/logout.php', []);
    request('login/validar.php', ['usuario'=>'testadmin','password'=>'Prueba-123456']);
    $service=['fecha_servicio'=>'2026-09-01','hora_servicio'=>'08:00','cliente_id'=>1,'vehiculo_id'=>1,'conductor_id'=>1,'tipo_servicio'=>'Provincia','modalidad'=>'tercerizado','origen'=>'Callao','destino'=>'Arequipa','precio_cliente'=>118,'costo_proveedor'=>30,'tipo_comprobante'=>'FACTURA','estado_servicio'=>'programado'];
    [$status,$r]=request('servicios/guardar.php',$service);check($status===201 && $r['numero_factura']==='','guardar servicio sin facturar');$id=$r['id'];
    [$status]=request('servicios/guardar.php',$service);check($status===409,'evita reserva duplicada');
    [$status,$r]=request('servicios/operacion.php?id='.$id);check($status===200,'consulta ficha');$csrf=$r['csrf_token'];
    [$status]=request('servicios/operacion.php',['servicio_id'=>$id,'proveedor_id'=>1]);check($status===403,'ficha exige CSRF');
    [$status]=request('servicios/operacion.php',['servicio_id'=>$id,'proveedor_id'=>1,'provincia'=>'Arequipa','contacto'=>'Recepción','csrf_token'=>$csrf]);check($status===200,'guarda proveedor y destino');
    [$status]=request('servicios/cambiar_estado.php',['id'=>$id,'estado_servicio'=>'finalizado']);check($status===409,'no salta de programado a finalizado');
    foreach(['en_ruta','finalizado'] as $estado){[$status]=request('servicios/cambiar_estado.php',['id'=>$id,'estado_servicio'=>$estado]);check($status===200,'transición '.$estado);}
    [$status]=request('facturas/registrar.php',['id'=>$id,'tipo_comprobante'=>'FACTURA','numero_factura'=>'F001-000001','csrf_token'=>$csrf]);check($status===200,'registro de comprobante');
    [$status]=request('facturas/registrar.php',['id'=>$id,'tipo_comprobante'=>'FACTURA','numero_factura'=>'F001-000002','csrf_token'=>$csrf]);check($status===409,'no renumera comprobante');
    [$status,$r]=request('facturas/index.php');check($status===200 && count($r['data'])===1,'lista comprobantes');
    [$status]=request('facturas/abonar.php',['servicio_id'=>$id,'fecha'=>'2026-09-01','monto'=>20,'referencia'=>'Adelanto prueba','csrf_token'=>$csrf]);check($status===201,'registra abono parcial');
    [$status,$cuentas]=request('facturas/cuentas.php');check($status===200 && $cuentas['data'][0]['saldo']==98,'saldo descuenta abonos');
    [$status,$facturas]=request('facturas/index.php');check($facturas['data'][0]['estado_pago']==='parcial' && (float)$facturas['data'][0]['saldo']===98.0,'facturas muestra pago parcial y saldo pendiente');
    [$status]=request('facturas/abonar.php',['servicio_id'=>$id,'fecha'=>'2026-09-01','monto'=>100,'referencia'=>'Exceso prueba','csrf_token'=>$csrf]);check($status===422,'rechaza abonos superiores al saldo');
    [$status]=request('facturas/actualizar_pago.php',['id'=>$id,'numero_factura'=>'F001-000001','estado_pago'=>'pagada','fecha_pago'=>'2026-09-01','csrf_token'=>$r['csrf_token']]);check($status===200,'registro del cobro');
    [$status,$facturas]=request('facturas/index.php');check($status===200 && (float)$facturas['data'][0]['saldo']===0.0,'saldo queda en cero al confirmar el pago total');
    [$status]=request('gastos_adicionales/guardar.php',['fecha'=>'2026-09-01','concepto'=>'Peaje adicional','monto'=>8,'servicio_id'=>$id,'csrf_token'=>$csrf]);check($status===201,'registro de gasto adicional');
    [$status,$r]=request('reportes/cierre.php?desde=2026-09-01&hasta=2026-09-01');check($status===200 && $r['resumen']['resultado']==80 && $r['resumen']['cobrado']==118,'cierre resta proveedores y gastos sin duplicar cobros');
    [$status]=request('servicios/actualizar.php',array_merge($service,['id'=>$id,'precio_cliente'=>200]));check($status===409,'protege importes facturados');
    [$status]=request('servicios/eliminar.php',['id'=>$id]);check($status===409,'protege servicios facturados');
    [$status]=request('usuarios/gestionar.php',['nombre'=>'Nuevo','usuario'=>'nuevo','password'=>'Nueva-123456','rol'=>'usuario','estado'=>'activo','csrf_token'=>$csrf]);check($status===200,'administrador crea usuario');
    [$status]=request('usuarios/guardar.php',['nombre'=>'Otro']);check($status===403,'ruta antigua de usuarios también exige CSRF');
    [$status]=request('reportes/cierre.php?desde=2026-09-03&hasta=2026-09-01');check($status===422,'rechaza rango de fechas invertido');
    [$status]=request('servicios/guardar.php',array_merge($service,['precio_cliente'=>'abc']));check($status===422,'rechaza importe no numérico');
    [$status,$other]=request('servicios/guardar.php',array_merge($service,['hora_servicio'=>'09:00']));check($status===201,'otro horario disponible');
    [$status]=request('facturas/registrar.php',['id'=>$other['id'],'tipo_comprobante'=>'FACTURA','numero_factura'=>'F001-000001','csrf_token'=>$csrf]);check($status===409,'impide número duplicado entre servicios');
    request('login/logout.php', []);
    request('login/validar.php',['usuario'=>'testuser','password'=>'Prueba-123456']);
    $db->query("UPDATE usuarios SET estado='inactivo' WHERE usuario='testuser'");
    [$status]=request('servicios/index.php');check($status===401,'desactivación revoca una sesión existente');
    echo "$checks comprobaciones completadas.\n";
} finally {
    if (is_resource($server)) { proc_terminate($server); proc_close($server); }
    curl_close($http);
    if (preg_match('/^vadexsa_test_[a-f0-9]{10}$/', $name)) $db->query("DROP DATABASE IF EXISTS `$name`");
    if (is_file($log)) unlink($log);
}

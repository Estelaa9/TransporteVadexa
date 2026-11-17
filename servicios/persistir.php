<?php
// Persistencia común de altas y ediciones: validación, reservas y montos.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/gestion.php';
require_auth();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['success'=>false,'error'=>'Método no permitido.'],405);
$data = get_request_data();
$editing = defined('SERVICIO_EDITAR') && SERVICIO_EDITAR;
$id = $editing ? (int)($data['id'] ?? 0) : 0;
$locked = false;
try {
    if ($editing && $id <= 0) throw new InvalidArgumentException('Servicio no especificado.');
    $fecha = (string)($data['fecha_servicio'] ?? '');
    $hora = trim((string)($data['hora_servicio'] ?? $data['hora'] ?? '')) ?: '00:00:00';
    if (strlen($hora)===5) $hora .= ':00';
    if (!gestion_fecha($fecha) || !preg_match('/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/',$hora)) throw new InvalidArgumentException('Fecha u hora no válida.');
    $values = ['fecha_servicio'=>$fecha,'hora_servicio'=>$hora];
    foreach (['cliente_id'=>'clientes','vehiculo_id'=>'vehiculos','conductor_id'=>'conductores'] as $key=>$table) {
        $value = (int)($data[$key] ?? 0);
        $stmt = gestion_query($conn,"SELECT id FROM $table WHERE id=?",'i',[$value]);
        if (!$value || !mysqli_fetch_assoc(mysqli_stmt_get_result($stmt))) throw new InvalidArgumentException('Seleccione cliente, vehículo y conductor registrados.');
        $values[$key]=$value;
    }
    foreach (['tipo_servicio'=>['Local',50],'tipo_carga'=>['General',100],'modalidad'=>['propio',20],'forma_pago'=>['Contado',50],'origen'=>['',4000],'destino'=>['',4000],'guia_remitente'=>['',30],'tipo_comprobante'=>['FACTURA',20],'estado_servicio'=>['programado',20]] as $key=>[$default,$max]) {
        $value=trim((string)($data[$key]??$default));
        if (mb_strlen($value)>$max) throw new InvalidArgumentException("El campo $key es demasiado largo.");
        $values[$key]=$value;
    }
    if (!$values['origen'] || !$values['destino'] || !in_array($values['modalidad'],['propio','tercerizado'],true) || !in_array($values['tipo_comprobante'],['FACTURA','BOLETA','SIN_COMPROBANTE'],true) || !in_array($values['estado_servicio'],['programado','en_ruta','finalizado','cancelado'],true)) throw new InvalidArgumentException('Revise origen, destino, modalidad, comprobante y estado.');
    $values['precio_cliente']=gestion_monto($data['precio_cliente']??'');
    $values['costo_proveedor']=$values['modalidad']==='propio'?0:gestion_monto($data['costo_proveedor']??0);
    $lock=mysqli_fetch_row(mysqli_query($conn,"SELECT GET_LOCK(CONCAT(DATABASE(), ':reservas'),5)"));
    if ((int)$lock[0]!==1) throw new RuntimeException('No se pudo bloquear la programación.');
    $locked=true; mysqli_begin_transaction($conn);
    $original=null;
    if ($editing) {
        $stmt=gestion_query($conn,'SELECT * FROM servicios WHERE id=? FOR UPDATE','i',[$id]);
        $original=mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
        if (!$original) throw new InvalidArgumentException('Servicio no encontrado.');
        $issued=trim($original['numero_factura']??'')!=='';
        if ($issued && ($values['precio_cliente']!=(float)$original['precio_cliente'] || $values['cliente_id']!=$original['cliente_id'] || $values['tipo_comprobante']!==$original['tipo_comprobante'] || $values['estado_servicio']==='cancelado')) throw new DomainException('El servicio tiene comprobante: no puede cambiar cliente, importe, tipo ni cancelarlo.');
        $stmt=gestion_query($conn,'SELECT COALESCE(SUM(monto),0) FROM servicio_abonos WHERE servicio_id=?','i',[$id]);
        $abonado=(float)mysqli_fetch_row(mysqli_stmt_get_result($stmt))[0];
        if ($abonado>0 && ($values['precio_cliente']<$abonado || $values['cliente_id']!=$original['cliente_id'] || $values['estado_servicio']==='cancelado')) throw new DomainException('El servicio tiene abonos: conserve el cliente y un importe que cubra lo cobrado; no puede cancelarlo.');
        $transitions=['programado'=>['en_ruta','cancelado'],'en_ruta'=>['finalizado','cancelado'],'finalizado'=>[],'cancelado'=>[]];
        if ($values['estado_servicio']!==$original['estado_servicio'] && !in_array($values['estado_servicio'],$transitions[$original['estado_servicio']]??[],true)) throw new DomainException('La transición de estado no está permitida.');
    }
    if ($values['estado_servicio']!=='cancelado') {
        $stmt=gestion_query($conn,"SELECT id FROM servicios WHERE id<>? AND fecha_servicio=? AND hora_servicio=? AND estado_servicio<>'cancelado' AND (vehiculo_id=? OR conductor_id=?) LIMIT 1",'issii',[$id,$fecha,$hora,$values['vehiculo_id'],$values['conductor_id']]);
        if (mysqli_fetch_assoc(mysqli_stmt_get_result($stmt))) throw new DomainException('El vehículo o conductor ya está reservado en esa fecha y horario.');
    }
    $values['base_imponible']=$values['tipo_comprobante']==='SIN_COMPROBANTE'?$values['precio_cliente']:round($values['precio_cliente']/1.18,2);
    $values['igv']=round($values['precio_cliente']-$values['base_imponible'],2);
    $values['utilidad']=round($values['precio_cliente']-$values['costo_proveedor'],2);
    if ($editing) {
        $columns=implode(', ',array_map(fn($key)=>"$key=?",array_keys($values)));
        gestion_query($conn,"UPDATE servicios SET $columns WHERE id=?",str_repeat('s',count($values)).'i',array_merge(array_values($values),[$id]));
        if ($values['modalidad']==='propio') {
            gestion_query($conn,'UPDATE servicios SET proveedor_id=NULL WHERE id=?','i',[$id]);
            gestion_query($conn,'UPDATE servicio_operacion SET proveedor_id=NULL WHERE servicio_id=?','i',[$id]);
        }
        $guia=$original['guia_transportista']; $numero=$original['numero_factura'];
    } else {
        $values['numero_factura']='';
        $columns=implode(',',array_keys($values)); $marks=implode(',',array_fill(0,count($values),'?'));
        gestion_query($conn,"INSERT INTO servicios ($columns) VALUES ($marks)",str_repeat('s',count($values)),array_values($values));
        $id=mysqli_insert_id($conn); $guia='GRT-'.str_pad($id,6,'0',STR_PAD_LEFT); $numero='';
        gestion_query($conn,'UPDATE servicios SET guia_transportista=? WHERE id=?','si',[$guia,$id]);
    }
    mysqli_commit($conn);
    mysqli_query($conn,"SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':reservas'))");
    json_response(['success'=>true,'id'=>$id,'guia_transportista'=>$guia,'numero_factura'=>$numero,'message'=>'Servicio guardado correctamente.'],$editing?200:201);
} catch (Throwable $e) {
    if ($locked) { mysqli_rollback($conn); mysqli_query($conn,"SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':reservas'))"); }
    error_log($e->getMessage());
    $known=$e instanceof InvalidArgumentException || $e instanceof DomainException;
    json_response(['success'=>false,'error'=>$known?$e->getMessage():'No se pudo guardar el servicio. Verifique los datos y la migración de gestión.'],$e instanceof DomainException?409:($known?422:500));
}

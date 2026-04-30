<?php

include("../config/conexion.php");

// ============================
// DATOS DEL FORMULARIO
// ============================

$fecha = $_POST['fecha_servicio'];
$hora = $_POST['hora'];

$cliente = $_POST['cliente_id'];
$vehiculo = $_POST['vehiculo_id'];
$conductor = $_POST['conductor_id'];

$tipo_servicio = $_POST['tipo_servicio'];
$tipo_carga = $_POST['tipo_carga'];

$modalidad = $_POST['modalidad'];
$forma_pago = $_POST['forma_pago'];

$origen = $_POST['origen'];
$destino = $_POST['destino'];

$monto = floatval($_POST['precio_cliente']);

$costo_proveedor = isset($_POST['costo_proveedor']) ? floatval($_POST['costo_proveedor']) : 0;

$guia_remitente = $_POST['guia_remitente'];

$estado = $_POST['estado_servicio'];

$tipo_comprobante = $_POST['tipo_comprobante'];


// ============================
// CONTROL MODALIDAD
// ============================

if($modalidad=="propio"){
$costo_proveedor = 0;
}


// ============================
// CALCULO IGV
// ============================

$base = $monto;
$igv = 0;

if($tipo_comprobante!="SIN_COMPROBANTE"){

$base = round($monto / 1.18,2);
$igv = round($monto - $base,2);

}


// ============================
// CALCULO UTILIDAD
// ============================

$utilidad = $monto - $costo_proveedor;


// ============================
// VALIDAR VEHICULO OCUPADO
// ============================

$verificar="SELECT * FROM servicios 
WHERE vehiculo_id='$vehiculo' 
AND fecha_servicio='$fecha'
AND hora_servicio='$hora'";

$res=mysqli_query($conn,$verificar);

if(mysqli_num_rows($res)>0){

echo "⚠ Este vehículo ya tiene un servicio programado en ese horario";
exit();

}


// ============================
// VALIDAR CONDUCTOR OCUPADO
// ============================

$verificar_conductor="SELECT * FROM servicios 
WHERE conductor_id='$conductor' 
AND fecha_servicio='$fecha'
AND hora_servicio='$hora'";

$res2=mysqli_query($conn,$verificar_conductor);

if(mysqli_num_rows($res2)>0){

echo "⚠ Este conductor ya tiene un servicio asignado en ese horario";
exit();

}


// ============================
// GENERAR GUIA TRANSPORTISTA
// ============================

$consulta="SELECT IFNULL(MAX(id),0) as ultimo FROM servicios";
$res=mysqli_query($conn,$consulta);
$row=mysqli_fetch_assoc($res);

$num=$row['ultimo']+1;

$guia_transportista="GRT-".str_pad($num,6,"0",STR_PAD_LEFT);


// ============================
// GENERAR FACTURA / BOLETA
// ============================

$numero_factura="";

if($tipo_comprobante=="FACTURA"){

$consulta="SELECT COUNT(*) as total FROM servicios WHERE tipo_comprobante='FACTURA'";
$res=mysqli_query($conn,$consulta);
$row=mysqli_fetch_assoc($res);

$num=$row['total']+1;

$numero_factura="F001-".str_pad($num,6,"0",STR_PAD_LEFT);

}

elseif($tipo_comprobante=="BOLETA"){

$consulta="SELECT COUNT(*) as total FROM servicios WHERE tipo_comprobante='BOLETA'";
$res=mysqli_query($conn,$consulta);
$row=mysqli_fetch_assoc($res);

$num=$row['total']+1;

$numero_factura="B001-".str_pad($num,6,"0",STR_PAD_LEFT);

}


// ============================
// INSERTAR SERVICIO
// ============================

$sql="INSERT INTO servicios
(
fecha_servicio,
hora_servicio,
cliente_id,
vehiculo_id,
conductor_id,
tipo_servicio,
tipo_carga,
modalidad,
forma_pago,
origen,
destino,
precio_cliente,
base_imponible,
igv,
costo_proveedor,
utilidad,
guia_remitente,
guia_transportista,
numero_factura,
tipo_comprobante,
estado_servicio
)

VALUES
(
'$fecha',
'$hora',
'$cliente',
'$vehiculo',
'$conductor',
'$tipo_servicio',
'$tipo_carga',
'$modalidad',
'$forma_pago',
'$origen',
'$destino',
'$monto',
'$base',
'$igv',
'$costo_proveedor',
'$utilidad',
'$guia_remitente',
'$guia_transportista',
'$numero_factura',
'$tipo_comprobante',
'$estado'
)";

mysqli_query($conn,$sql);


// ============================
// REDIRECCION
// ============================

header("Location:index.php");

?>
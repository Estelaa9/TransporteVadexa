<?php
include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$clientes=mysqli_query($conn,"SELECT * FROM clientes");
$vehiculos=mysqli_query($conn,"SELECT * FROM vehiculos");
$conductores=mysqli_query($conn,"SELECT * FROM conductores");

/* GENERAR GUIA TRANSPORTISTA */

$sql="SELECT IFNULL(MAX(id),0) as ultimo FROM servicios";
$res=mysqli_query($conn,$sql);
$row=mysqli_fetch_assoc($res);

$num=$row['ultimo']+1;

$guia_transportista="GRT-".str_pad($num,6,"0",STR_PAD_LEFT);


/* GENERAR NUMERO COMPROBANTE */

$sql="SELECT COUNT(*) as total FROM servicios";
$res=mysqli_query($conn,$sql);
$row=mysqli_fetch_assoc($res);

$num_comp=$row['total']+1;

$numero_factura="F001-".str_pad($num_comp,6,"0",STR_PAD_LEFT);
$numero_boleta="B001-".str_pad($num_comp,6,"0",STR_PAD_LEFT);
?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-primary text-white">
<h5><i class="bi bi-truck"></i> Registrar Servicio</h5>
</div>

<div class="card-body">

<form action="guardar.php" method="POST">

<div class="row">

<div class="col-md-3 mb-3">
<label>Fecha</label>
<input type="date" name="fecha_servicio" class="form-control" required>
</div>

<div class="col-md-3 mb-3">
<label>Hora</label>
<input type="time" name="hora" class="form-control">
</div>

<div class="col-md-6 mb-3">
<label>Cliente</label>
<select name="cliente_id" class="form-control">

<?php while($c=mysqli_fetch_assoc($clientes)){ ?>

<option value="<?php echo $c['id']; ?>">
<?php echo $c['nombre']; ?>
</option>

<?php } ?>

</select>
</div>

<div class="col-md-4 mb-3">
<label>Tipo Servicio</label>
<select name="tipo_servicio" class="form-control">
<option value="Mudanza">Mudanza</option>
<option value="Transporte">Transporte</option>
<option value="Distribucion">Distribución</option>
</select>
</div>

<div class="col-md-4 mb-3">
<label>Tipo de Carga</label>
<input type="text" name="tipo_carga" class="form-control">
</div>

<div class="col-md-4 mb-3">
<label>Modalidad</label>
<select name="modalidad" id="modalidad" class="form-control">
<option value="propio">Propio</option>
<option value="tercerizado">Tercerizado</option>
</select>
</div>

<div class="col-md-6 mb-3">
<label>Origen</label>
<input type="text" name="origen" class="form-control">
</div>

<div class="col-md-6 mb-3">
<label>Destino</label>
<input type="text" name="destino" class="form-control">
</div>

<div class="col-md-4 mb-3">
<label>Vehículo</label>
<select name="vehiculo_id" class="form-control">

<?php while($v=mysqli_fetch_assoc($vehiculos)){ ?>

<option value="<?php echo $v['id']; ?>">
<?php echo $v['placa']; ?>
</option>

<?php } ?>

</select>
</div>

<div class="col-md-4 mb-3">
<label>Conductor</label>
<select name="conductor_id" class="form-control">

<?php while($co=mysqli_fetch_assoc($conductores)){ ?>

<option value="<?php echo $co['id']; ?>">
<?php echo $co['nombre']; ?>
</option>

<?php } ?>

</select>
</div>

<div class="col-md-4 mb-3">
<label>Forma de Pago</label>
<select name="forma_pago" class="form-control">
<option value="contado">Contado</option>
<option value="transferencia">Transferencia</option>
<option value="yape">Yape</option>
<option value="plin">Plin</option>
<option value="credito">Crédito</option>
</select>
</div>

<div class="col-md-3 mb-3">
<label>Tipo Comprobante</label>
<select name="tipo_comprobante" id="tipo_comprobante" class="form-control">
<option value="FACTURA">Factura</option>
<option value="BOLETA">Boleta</option>
<option value="SIN_COMPROBANTE">Sin comprobante</option>
</select>
</div>

<div class="col-md-4 mb-3">
<label>Monto</label>
<input type="number" name="precio_cliente" id="precio_cliente" class="form-control">
</div>

<div class="col-md-3 mb-3">
<label>Base Imponible</label>
<input type="text" id="base_imponible" class="form-control" readonly>
</div>

<div class="col-md-3 mb-3">
<label>IGV (18%)</label>
<input type="text" id="igv" class="form-control" readonly>
</div>

<div class="col-md-4 mb-3">
<label>Costo Proveedor</label>
<input type="number" name="costo_proveedor" id="costo_proveedor" class="form-control">
</div>

<div class="col-md-4 mb-3">
<label>N° Guía Remitente</label>
<input type="text" name="guia_remitente" class="form-control">
</div>

<div class="col-md-4 mb-3">
<label>N° Guía Transportista</label>
<input type="text" name="guia_transportista" class="form-control" value="<?php echo $guia_transportista; ?>" readonly>
</div>

<div class="col-md-4 mb-3">
<label>N° Factura / Boleta</label>
<input type="text" name="numero_factura" id="numero_factura" class="form-control" value="<?php echo $numero_factura; ?>" readonly>
</div>

<div class="col-md-4 mb-3">
<label>Estado Servicio</label>
<select name="estado_servicio" class="form-control">
<option value="programado">Programado</option>
<option value="en_ruta">En Ruta</option>
<option value="finalizado">Finalizado</option>
</select>
</div>

</div>

<button class="btn btn-success">
<i class="bi bi-save"></i> Guardar Servicio
</button>

<a href="index.php" class="btn btn-secondary">
Volver
</a>

</form>

</div>

</div>

</div>

<script>

/* CONTROL COMPROBANTE */

const tipoComprobante = document.getElementById("tipo_comprobante");
const factura = document.getElementById("numero_factura");

tipoComprobante.addEventListener("change",function(){

let tipo=this.value;

if(tipo==="SIN_COMPROBANTE"){

factura.value="";
factura.disabled=true;

}else if(tipo==="FACTURA"){

factura.disabled=false;
factura.value="<?php echo $numero_factura; ?>";

}else if(tipo==="BOLETA"){

factura.disabled=false;
factura.value="<?php echo $numero_boleta; ?>";

}

calcularIGV();

});


/* CONTROL MODALIDAD */

const modalidad = document.getElementById("modalidad");
const costo = document.getElementById("costo_proveedor");

modalidad.addEventListener("change",function(){

if(this.value==="propio"){

costo.value="";
costo.disabled=true;

}else{

costo.disabled=false;

}

});


/* CALCULO IGV */

const montoInput = document.getElementById("precio_cliente");
const baseInput = document.getElementById("base_imponible");
const igvInput = document.getElementById("igv");

function calcularIGV(){

let monto = parseFloat(montoInput.value) || 0;
let tipo = tipoComprobante.value;

if(tipo==="SIN_COMPROBANTE"){

baseInput.value = monto.toFixed(2);
igvInput.value = "0.00";

}else{

let base = monto / 1.18;
let igv = monto - base;

baseInput.value = base.toFixed(2);
igvInput.value = igv.toFixed(2);

}

}

montoInput.addEventListener("input", calcularIGV);

calcularIGV();

</script>
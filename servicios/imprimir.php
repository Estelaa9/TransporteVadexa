<?php
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/gestion.php';
require_auth();
$id = (int)($_GET['id'] ?? 0);
try {
    $stmt = gestion_query($conn, 'SELECT s.*, c.nombre AS cliente, c.documento, v.placa, co.nombre AS conductor, o.provincia, o.distrito, o.referencia, o.contacto, o.telefono, o.almacen, o.observaciones FROM servicios s LEFT JOIN clientes c ON c.id=s.cliente_id LEFT JOIN vehiculos v ON v.id=s.vehiculo_id LEFT JOIN conductores co ON co.id=s.conductor_id LEFT JOIN servicio_operacion o ON o.servicio_id=s.id WHERE s.id=?', 'i', [$id]);
    $s = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    if (!$s) json_response(['success' => false, 'error' => 'Servicio no encontrado.'], 404);
} catch (Throwable $e) {
    error_log($e->getMessage());
    json_response(['success' => false, 'error' => 'No se pudo preparar la impresión. Verifique la migración de gestión.'], 500);
}
function h($v) { return htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8'); }
$tipo = $_GET['tipo'] ?? 'orden';
$titulos = ['orden' => 'Orden de servicio', 'remitente' => 'Referencia de guía remitente', 'transportista' => 'Referencia de guía transportista', 'comprobante' => 'Resumen de comprobante'];
if (!isset($titulos[$tipo])) $tipo = 'orden';
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title><?=h($titulos[$tipo])?> #<?=h($id)?></title>
<style>body{font:15px system-ui;color:#172033;max-width:900px;margin:40px auto;padding:20px}header{border-bottom:3px solid #2447a8}dl{display:grid;grid-template-columns:210px 1fr;gap:12px}dt{font-weight:bold}dd{margin:0}nav{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px}a,button{padding:8px;color:#2447a8}footer{margin-top:40px;border-top:1px solid #aaa;padding-top:16px}@media print{nav{display:none}body{margin:0;padding:0}}</style></head><body>
<nav><button onclick="window.print()">Imprimir / guardar PDF</button><?php foreach($titulos as $key=>$label): ?><a href="?id=<?=$id?>&amp;tipo=<?=h($key)?>"><?=h($label)?></a><?php endforeach ?></nav>
<header><h2>VADEXSA LOGISTIC</h2><h1><?=h($titulos[$tipo])?> #<?=$id?></h1></header>
<dl><?php foreach(['fecha_servicio'=>'Fecha','hora_servicio'=>'Hora','cliente'=>'Cliente','documento'=>'Documento','tipo_servicio'=>'Tipo de servicio','estado_servicio'=>'Estado','origen'=>'Origen','almacen'=>'Almacén','destino'=>'Destino','provincia'=>'Provincia','distrito'=>'Distrito','referencia'=>'Referencia','contacto'=>'Contacto','telefono'=>'Teléfono','placa'=>'Vehículo','conductor'=>'Conductor','modalidad'=>'Modalidad','guia_remitente'=>'Guía remitente','guia_transportista'=>'Guía transportista','numero_factura'=>'Comprobante','observaciones'=>'Observaciones'] as $key=>$label): ?><dt><?=h($label)?></dt><dd><?=h($s[$key] ?: '—')?></dd><?php endforeach ?>
<?php if($tipo === 'comprobante'): ?><dt>Base</dt><dd>S/ <?=number_format((float)$s['base_imponible'],2)?></dd><dt>IGV registrado</dt><dd>S/ <?=number_format((float)$s['igv'],2)?></dd><dt>Total</dt><dd>S/ <?=number_format((float)$s['precio_cliente'],2)?></dd><dt>Detracción registrada</dt><dd>S/ <?=number_format((float)($s['monto_detraccion']??0),2)?></dd><?php endif ?></dl>
<footer>Documento interno de control. Las referencias impresas no sustituyen comprobantes ni guías electrónicas emitidas.<p>Conformidad de entrega: ____________________ Fecha: ______________</p></footer></body></html>

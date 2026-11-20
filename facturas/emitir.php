<?php
// facturas/emitir.php - Registra un comprobante para uno o varios servicios finalizados del mismo cliente.
// NEG-12 (solo servicios finalizados), BD-16 (entidad propia, varios servicios), CON-01/02 (numeración con bloqueo),
// NEG-18 (factura solo con RUC válido), NOR-01 (registro de control interno: la emisión electrónica oficial se hace en SUNAT/PSE).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_once __DIR__ . '/lib.php';
require_auth();
require_method('POST');
$data = get_request_data();

crud_ejecutar(function () use ($conn, $data) {
    $ids = array_values(array_unique(array_map('intval', (array)($data['servicio_ids'] ?? ($data['id'] ?? [])))));
    $ids = array_filter($ids, fn($v) => $v > 0);
    if (!$ids || count($ids) > 50) throw new InvalidArgumentException('Seleccione entre 1 y 50 servicios.');
    $tipo = validar_opcion($data['tipo'] ?? $data['tipo_comprobante'] ?? '', ['FACTURA', 'BOLETA'], 'tipo de comprobante');
    $serie = strtoupper(trim((string)($data['serie'] ?? ($tipo === 'FACTURA' ? 'F001' : 'B001'))));
    $manual = trim((string)($data['numero'] ?? ''));
    $manual = $manual === '' ? null : (int)$manual;
    $emision = (string)($data['fecha_emision'] ?? date('Y-m-d'));
    if (!validar_fecha($emision) || $emision > date('Y-m-d')) throw new InvalidArgumentException('Ingrese una fecha de emisión válida que no sea futura.');
    $detraccion = validar_monto($data['monto_detraccion'] ?? 0);

    mysqli_begin_transaction($conn);
    $serieRow = db_one($conn, 'SELECT tipo FROM series_comprobante WHERE serie = ? AND activo = 1', 's', [$serie]);
    if (!$serieRow || $serieRow['tipo'] !== $tipo) throw new InvalidArgumentException("La serie $serie no corresponde a $tipo.");

    $marks = implode(',', array_fill(0, count($ids), '?'));
    $servicios = db_all($conn, "SELECT * FROM servicios WHERE id IN ($marks) ORDER BY id FOR UPDATE", str_repeat('i', count($ids)), $ids);
    if (count($servicios) !== count($ids)) throw new InvalidArgumentException('Alguno de los servicios no existe.');
    $clienteId = (int)$servicios[0]['cliente_id'];
    $maxFecha = '';
    foreach ($servicios as $s) {
        if ((int)$s['cliente_id'] !== $clienteId) throw new InvalidArgumentException('Todos los servicios del comprobante deben ser del mismo cliente.');
        if ($s['estado_servicio'] !== 'finalizado') throw new DomainException("El servicio #{$s['id']} no está finalizado; el comprobante se emite al terminar el viaje.");
        if (!empty($s['comprobante_id'])) throw new DomainException("El servicio #{$s['id']} ya tiene un comprobante vigente.");
        $maxFecha = max($maxFecha, (string)$s['fecha_servicio']);
    }
    if ($emision < $maxFecha) throw new InvalidArgumentException('La fecha de emisión no puede ser anterior a la fecha del servicio.');
    $cliente = db_one($conn, 'SELECT id, documento, dias_credito FROM clientes WHERE id = ?', 'i', [$clienteId]);
    if (!$cliente) throw new InvalidArgumentException('El servicio no tiene un cliente válido.');
    if ($tipo === 'FACTURA' && !validar_ruc((string)$cliente['documento'])) throw new InvalidArgumentException('La factura requiere que el cliente tenga un RUC válido. Use boleta o corrija el documento del cliente.');

    $dias = isset($data['dias_credito']) && $data['dias_credito'] !== '' ? (int)$data['dias_credito'] : dias_credito_por_defecto($servicios[0]['forma_pago'], (int)$cliente['dias_credito']);
    if ($dias < 0 || $dias > 120) throw new InvalidArgumentException('Los días de crédito deben estar entre 0 y 120.');
    $vence = date('Y-m-d', strtotime("$emision +$dias days"));

    $base = $igv = $total = 0.0;
    $detalle = [];
    foreach ($servicios as $s) {
        $precio = round((float)$s['precio_cliente'], 2);
        [$b, $i] = calcular_igv($precio, $tipo);
        $detalle[] = [(int)$s['id'], $b, $i, $precio, (float)$s['costo_proveedor']];
        $base += $b; $igv += $i; $total += $precio;
    }
    $total = round($total, 2);
    if ($detraccion > $total) throw new InvalidArgumentException('La detracción no puede superar el total del comprobante.');
    $numero = serie_siguiente($conn, $serie, $manual);
    $usuario = $_SESSION['usuario'];
    db_query($conn, 'INSERT INTO comprobantes (tipo, serie, numero, cliente_id, fecha_emision, dias_credito, fecha_vencimiento, base_imponible, igv, total, monto_detraccion, observacion, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 'ssiisisddddss',
        [$tipo, $serie, $numero, $clienteId, $emision, $dias, $vence, round($base, 2), round($igv, 2), $total, $detraccion,
            validar_texto($data['observacion'] ?? '', 'observación', 255) ?: null, $usuario]);
    $compId = mysqli_insert_id($conn);
    $numeroCompleto = $serie . '-' . str_pad((string)$numero, 6, '0', STR_PAD_LEFT);
    foreach ($detalle as [$sid, $b, $i, $t, $costo]) {
        db_query($conn, 'INSERT INTO comprobante_servicios (comprobante_id, servicio_id, base_imponible, igv, total) VALUES (?, ?, ?, ?, ?)', 'iiddd', [$compId, $sid, $b, $i, $t]);
        db_query($conn, 'UPDATE servicios SET comprobante_id = ?, numero_factura = ?, tipo_comprobante = ?, fecha_emision = ?, base_imponible = ?, igv = ?, utilidad = ?, updated_by = ?, version = version + 1 WHERE id = ?',
            'isssdddsi', [$compId, $numeroCompleto, $tipo, $emision, $b, $i, round($b - $costo, 2), $usuario, $sid]);
    }
    auditar('crear', 'comprobantes', $compId, null, ['numero' => $numeroCompleto, 'tipo' => $tipo, 'cliente_id' => $clienteId, 'servicios' => $ids, 'total' => $total, 'vence' => $vence]);
    mysqli_commit($conn);
    json_response(['success' => true, 'id' => $compId, 'numero' => $numeroCompleto, 'fecha_vencimiento' => $vence,
        'message' => "Comprobante $numeroCompleto registrado. Recuerde: es un registro de control interno; la emisión electrónica oficial se realiza en SUNAT o su proveedor autorizado."], 201);
});

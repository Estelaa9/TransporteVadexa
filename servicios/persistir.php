<?php
// servicios/persistir.php - Alta (guardar.php) y edición (actualizar.php) de servicios.
// NEG-01 margen sin IGV · NEG-06 solapamiento por intervalos · NEG-07 estado de unidad/conductor
// NEG-08 misma validación al editar · NEG-09 documentos vencidos · NEG-10 capacidad · NEG-11 tercerizados
// NEG-12 el comprobante se emite después en Facturación · NEG-14 máquina de estados · NEG-15 bloqueo tras facturar
// NEG-16 montos recalculados en el servidor · CON-03 validación e inserción bajo bloqueo · CON-04 control de versión.
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_once __DIR__ . '/reglas.php';
crud_solo_incluido();
require_auth();
require_method('POST');
$data = get_request_data();
$editing = defined('SERVICIO_EDITAR');
$locked = false;

try {
    $id = $editing ? (int)($data['id'] ?? 0) : 0;
    if ($editing && $id <= 0) throw new InvalidArgumentException('Servicio no especificado.');

    $fecha = (string)($data['fecha_servicio'] ?? '');
    if (!validar_fecha($fecha)) throw new InvalidArgumentException('Ingrese una fecha de servicio válida.');
    $hora = validar_hora($data['hora_servicio'] ?? $data['hora'] ?? '');
    if (!$hora) throw new InvalidArgumentException('Ingrese la hora de inicio del servicio.');
    $horaFin = trim((string)($data['hora_fin_estimada'] ?? ''));
    $horaFin = $horaFin === '' ? date('H:i:s', strtotime("$fecha $hora +4 hours")) : validar_hora($horaFin);
    if (!$horaFin || $horaFin === $hora) throw new InvalidArgumentException('Ingrese una hora de fin estimada distinta de la hora de inicio.');

    $clienteId = (int)($data['cliente_id'] ?? 0);
    $cliente = db_one($conn, 'SELECT id, documento, tipo_cliente FROM clientes WHERE id = ?', 'i', [$clienteId]);
    if (!$cliente) throw new InvalidArgumentException('Seleccione un cliente registrado.');

    $modalidad = validar_opcion($data['modalidad'] ?? 'propio', ['propio', 'tercerizado'], 'modalidad');
    $tipoComprobante = validar_opcion($data['tipo_comprobante'] ?? 'FACTURA', ['FACTURA', 'BOLETA', 'SIN_COMPROBANTE'], 'comprobante');
    if ($tipoComprobante === 'FACTURA' && !validar_ruc((string)$cliente['documento'])) {
        throw new InvalidArgumentException('Para emitir factura el cliente debe tener un RUC válido. Corrija el cliente o elija boleta.');
    }
    $precio = validar_monto($data['precio_cliente'] ?? '', true);
    $peso = trim((string)($data['peso_kg'] ?? ''));
    $peso = $peso === '' ? null : validar_monto($peso);

    $values = [
        'fecha_servicio' => $fecha,
        'hora_servicio' => $hora,
        'hora_fin_estimada' => $horaFin,
        'cliente_id' => $clienteId,
        'modalidad' => $modalidad,
        'tipo_servicio' => validar_opcion($data['tipo_servicio'] ?? 'Local', ['Local', 'Provincia', 'Mudanza', 'Distribución', 'Especial'], 'tipo de servicio'),
        'tipo_carga' => validar_texto($data['tipo_carga'] ?? 'General', 'tipo de carga', 100),
        'forma_pago' => validar_opcion($data['forma_pago'] ?? 'Contado', ['Contado', 'Crédito 15 días', 'Crédito 30 días', 'Contra entrega'], 'forma de pago'),
        'origen' => validar_texto($data['origen'] ?? '', 'origen', 500, true),
        'destino' => validar_texto($data['destino'] ?? '', 'destino', 500, true),
        'guia_remitente' => validar_texto($data['guia_remitente'] ?? '', 'guía de remitente', 30),
        'tipo_comprobante' => $tipoComprobante,
        'precio_cliente' => $precio,
        'peso_kg' => $peso,
    ];

    // NEG-11: un servicio tercerizado no ocupa flota propia y exige proveedor.
    $avisos = [];
    if ($modalidad === 'tercerizado') {
        $proveedorId = (int)($data['proveedor_id'] ?? 0);
        $prov = db_one($conn, 'SELECT id, estado FROM proveedores WHERE id = ?', 'i', [$proveedorId]);
        if (!$prov) throw new InvalidArgumentException('Seleccione el proveedor que realizará el servicio tercerizado.');
        if (strtolower(trim((string)$prov['estado'])) !== 'activo') throw new InvalidArgumentException('El proveedor seleccionado está inactivo.');
        $values += ['vehiculo_id' => null, 'conductor_id' => null, 'proveedor_id' => $proveedorId, 'costo_proveedor' => validar_monto($data['costo_proveedor'] ?? 0)];
    } else {
        $vehiculoId = (int)($data['vehiculo_id'] ?? 0);
        $conductorId = (int)($data['conductor_id'] ?? 0);
        $avisos = servicio_validar_asignacion($conn, $vehiculoId, $conductorId, $fecha, $peso);
        $values += ['vehiculo_id' => $vehiculoId, 'conductor_id' => $conductorId, 'proveedor_id' => null, 'costo_proveedor' => 0.0];
    }

    // NEG-16: el servidor recalcula siempre los montos; NEG-01: margen = base imponible − costo del proveedor (sin IGV).
    [$values['base_imponible'], $values['igv']] = calcular_igv($precio, $tipoComprobante);
    $values['utilidad'] = round($values['base_imponible'] - $values['costo_proveedor'], 2);

    $lock = (int)db_value($conn, "SELECT GET_LOCK(CONCAT(DATABASE(), ':reservas'), 10)");
    if ($lock !== 1) throw new RuntimeException('No se pudo bloquear la programación. Intente de nuevo.');
    $locked = true;
    mysqli_begin_transaction($conn);

    $original = null;
    if ($editing) {
        $original = db_one($conn, 'SELECT * FROM servicios WHERE id = ? FOR UPDATE', 'i', [$id]);
        if (!$original) throw new InvalidArgumentException('Servicio no encontrado.');
        if (isset($data['version']) && (int)$data['version'] !== (int)$original['version']) {
            throw new DomainException('Otro usuario modificó este servicio mientras lo editaba. Vuelva a abrirlo para ver los cambios.');
        }
        if ($original['estado_servicio'] === 'cancelado') throw new DomainException('El servicio está anulado y no se puede editar.');
        if (!empty($original['comprobante_id'])) {
            foreach (['cliente_id', 'precio_cliente', 'tipo_comprobante', 'costo_proveedor', 'modalidad'] as $campo) {
                $cambio = is_numeric($values[$campo]) ? round((float)$values[$campo], 2) !== round((float)$original[$campo], 2) : (string)$values[$campo] !== (string)$original[$campo];
                if ($cambio) {
                    throw new DomainException('El servicio ya tiene comprobante: no puede cambiar cliente, importes, modalidad ni tipo de comprobante. Corrija con una nota de crédito en Facturación.');
                }
            }
        }
        $estado = validar_opcion($data['estado_servicio'] ?? $original['estado_servicio'], ['programado', 'en_ruta', 'finalizado'], 'estado');
        if ($estado !== $original['estado_servicio'] && !servicio_transicion_valida($original['estado_servicio'], $estado)) {
            throw new DomainException('La transición de estado no está permitida.');
        }
    } else {
        $estado = validar_opcion($data['estado_servicio'] ?? 'programado', ['programado', 'en_ruta', 'finalizado'], 'estado');
    }
    $values['estado_servicio'] = $estado;

    if ($modalidad === 'propio') {
        $cruce = servicio_buscar_cruce($conn, $id, $fecha, $hora, $horaFin, $values['vehiculo_id'], $values['conductor_id']);
        if ($cruce) {
            throw new DomainException("El vehículo o el conductor ya está asignado al servicio #{$cruce['id']} de {$cruce['inicio']} a {$cruce['fin']}.");
        }
    }

    $usuario = $_SESSION['usuario'];
    if ($editing) {
        $values['updated_by'] = $usuario;
        $set = implode(', ', array_map(fn($k) => "`$k` = ?", array_keys($values)));
        db_query($conn, "UPDATE servicios SET $set, version = version + 1 WHERE id = ?", str_repeat('s', count($values)) . 'i', array_merge(array_values($values), [$id]));
        if ($modalidad === 'propio') db_query($conn, 'UPDATE servicio_operacion SET proveedor_id = NULL WHERE servicio_id = ?', 'i', [$id]);
        auditar('editar', 'servicios', $id, $original, $values);
        $guia = $original['guia_transportista'];
    } else {
        $values['created_by'] = $usuario;
        $cols = implode(', ', array_map(fn($k) => "`$k`", array_keys($values)));
        db_query($conn, "INSERT INTO servicios ($cols) VALUES (" . implode(', ', array_fill(0, count($values), '?')) . ')', str_repeat('s', count($values)), array_values($values));
        $id = mysqli_insert_id($conn);
        // Correlativo interno de la guía a partir del id autoincremental: no se repite aunque se registren dos a la vez (CON-01).
        $guia = 'GRT-' . str_pad((string)$id, 6, '0', STR_PAD_LEFT);
        db_query($conn, 'UPDATE servicios SET guia_transportista = ? WHERE id = ?', 'si', [$guia, $id]);
        auditar('crear', 'servicios', $id, null, $values + ['guia_transportista' => $guia]);
    }
    mysqli_commit($conn);
    mysqli_query($conn, "SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':reservas'))");
    json_response(['success' => true, 'id' => $id, 'guia_transportista' => $guia, 'avisos' => $avisos,
        'message' => 'Servicio guardado correctamente.' . ($avisos ? ' Atención: ' . implode(' ', $avisos) : '')], $editing ? 200 : 201);
} catch (InvalidArgumentException | DomainException $e) {
    if ($locked) { mysqli_rollback($conn); mysqli_query($conn, "SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':reservas'))"); }
    json_response(['success' => false, 'error' => $e->getMessage()], $e instanceof DomainException ? 409 : 422);
} catch (Throwable $e) {
    if ($locked) { mysqli_rollback($conn); mysqli_query($conn, "SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':reservas'))"); }
    throw $e;
}

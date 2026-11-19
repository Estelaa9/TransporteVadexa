<?php
// servicios/reglas.php - Reglas de negocio de la programación de servicios. No es un endpoint.
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'reglas.php') { http_response_code(404); exit; }

/** Máquina de estados del servicio (NEG-14). La cancelación se hace con servicios/eliminar.php (anular). */
function servicio_transiciones(): array {
    return [
        'programado' => ['en_ruta', 'finalizado', 'cancelado'],
        'en_ruta' => ['finalizado', 'cancelado'],
        'finalizado' => [],
        'cancelado' => [],
    ];
}

function servicio_transicion_valida(string $desde, string $hacia): bool {
    return in_array($hacia, servicio_transiciones()[$desde] ?? [], true);
}

/**
 * Valida vehículo y conductor propios: existen, están activos y sus documentos están vigentes en la fecha
 * del servicio (NEG-07, NEG-09). Devuelve avisos no bloqueantes (sobrecarga, documentos por vencer).
 */
function servicio_validar_asignacion(mysqli $conn, int $vehiculoId, int $conductorId, string $fecha, ?float $pesoKg): array {
    $avisos = [];
    $v = db_one($conn, 'SELECT id, placa, estado, capacidad_kg, soat_vencimiento, revision_vencimiento FROM vehiculos WHERE id = ?', 'i', [$vehiculoId]);
    if (!$v) throw new InvalidArgumentException('Seleccione un vehículo de la flota propia.');
    if (strtolower(trim((string)$v['estado'])) !== 'activo') throw new DomainException("El vehículo {$v['placa']} está en estado «{$v['estado']}» y no puede asignarse.");
    foreach (['soat_vencimiento' => 'SOAT', 'revision_vencimiento' => 'revisión técnica'] as $col => $label) {
        if ($v[$col] && $v[$col] < $fecha) throw new DomainException("El $label del vehículo {$v['placa']} vence el {$v[$col]}, antes de la fecha del servicio.");
        if ($v[$col] && $v[$col] <= date('Y-m-d', strtotime("$fecha +30 days"))) $avisos[] = "El $label del vehículo {$v['placa']} vence el {$v[$col]}.";
    }
    if ($pesoKg !== null && $v['capacidad_kg'] !== null && $pesoKg > (float)$v['capacidad_kg']) {
        $avisos[] = "La carga ({$pesoKg} kg) supera la capacidad registrada del vehículo ({$v['capacidad_kg']} kg).";
    }

    $c = db_one($conn, 'SELECT id, nombre, estado, licencia_vencimiento FROM conductores WHERE id = ?', 'i', [$conductorId]);
    if (!$c) throw new InvalidArgumentException('Seleccione un conductor registrado.');
    if (strtolower(trim((string)$c['estado'])) !== 'activo') throw new DomainException("El conductor {$c['nombre']} está en estado «{$c['estado']}» y no puede asignarse.");
    if ($c['licencia_vencimiento'] && $c['licencia_vencimiento'] < $fecha) {
        throw new DomainException("La licencia de {$c['nombre']} vence el {$c['licencia_vencimiento']}, antes de la fecha del servicio.");
    }
    if ($c['licencia_vencimiento'] && $c['licencia_vencimiento'] <= date('Y-m-d', strtotime("$fecha +30 days"))) {
        $avisos[] = "La licencia de {$c['nombre']} vence el {$c['licencia_vencimiento']}.";
    }
    if (!$c['licencia_vencimiento']) $avisos[] = "No se registró el vencimiento de la licencia de {$c['nombre']}.";
    return $avisos;
}

/**
 * Busca otro servicio no cancelado del mismo vehículo o conductor cuyo intervalo se solape (NEG-06):
 * inicio_nuevo < fin_existente AND fin_nuevo > inicio_existente. Considera los viajes que cruzan la medianoche.
 */
function servicio_buscar_cruce(mysqli $conn, int $excluirId, string $fecha, string $hora, string $horaFin, ?int $vehiculoId, ?int $conductorId): ?array {
    $inicio = "$fecha $hora";
    $fin = date('Y-m-d H:i:s', strtotime($horaFin <= $hora ? "$fecha $horaFin +1 day" : "$fecha $horaFin"));
    $finExistente = "TIMESTAMP(fecha_servicio, COALESCE(hora_fin_estimada, ADDTIME(hora_servicio, '04:00:00'))) + INTERVAL IF(COALESCE(hora_fin_estimada, ADDTIME(hora_servicio, '04:00:00')) <= hora_servicio, 1, 0) DAY";
    return db_one($conn, "SELECT id, TIMESTAMP(fecha_servicio, hora_servicio) AS inicio, $finExistente AS fin FROM servicios
        WHERE id <> ? AND estado_servicio <> 'cancelado' AND (vehiculo_id = ? OR conductor_id = ?)
          AND fecha_servicio BETWEEN DATE_SUB(?, INTERVAL 1 DAY) AND DATE_ADD(?, INTERVAL 1 DAY)
          AND TIMESTAMP(fecha_servicio, hora_servicio) < ? AND $finExistente > ?
        LIMIT 1 FOR UPDATE", 'iiissss', [$excluirId, $vehiculoId, $conductorId, $fecha, $fecha, $fin, $inicio]);
}

<?php
// analisis/reglas.php - Reglas del diagnóstico con umbrales configurables (Mejora 3).
// GET: reglas y catálogo de indicadores. POST: crea o actualiza una regla (permiso analisis:editar).
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/crud.php';
require_once __DIR__ . '/lib.php';
require_auth();
$catalogo = analisis_catalogo();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_response(['success' => true, 'data' => db_all($conn, "SELECT * FROM reglas_diagnostico ORDER BY FIELD(prioridad, 'critica', 'alta', 'media', 'baja'), nombre"),
        'indicadores' => array_map(fn($k, $v) => ['clave' => $k, 'etiqueta' => $v[0], 'unidad' => $v[1]], array_keys($catalogo), $catalogo),
        'csrf_token' => csrf_token()]);
}
require_method('POST');
$data = get_request_data();
crud_ejecutar(function () use ($conn, $data, $catalogo) {
    $id = (int)($data['id'] ?? 0);
    $valores = [
        'nombre' => validar_texto($data['nombre'] ?? '', 'nombre', 120, true),
        'indicador' => validar_opcion($data['indicador'] ?? '', array_keys($catalogo), 'indicador'),
        'operador' => validar_opcion($data['operador'] ?? '', ['>', '>=', '<', '<=', '='], 'operador'),
        'umbral' => is_numeric($data['umbral'] ?? null) ? round((float)$data['umbral'], 2) : throw new InvalidArgumentException('Ingrese un umbral numérico.'),
        'tipo' => validar_opcion($data['tipo'] ?? 'negativo', ['negativo', 'positivo'], 'tipo'),
        'prioridad' => validar_opcion($data['prioridad'] ?? 'media', ['critica', 'alta', 'media', 'baja'], 'prioridad'),
        'recomendacion' => validar_texto($data['recomendacion'] ?? '', 'recomendación', 500, true),
        'activo' => !empty($data['activo']) ? 1 : 0,
        'updated_by' => $_SESSION['usuario'],
    ];
    if ($id) {
        $antes = db_one($conn, 'SELECT * FROM reglas_diagnostico WHERE id = ?', 'i', [$id]);
        if (!$antes) throw new InvalidArgumentException('Regla no encontrada.');
        $set = implode(', ', array_map(fn($k) => "`$k` = ?", array_keys($valores)));
        db_query($conn, "UPDATE reglas_diagnostico SET $set WHERE id = ?", str_repeat('s', count($valores)) . 'i', array_merge(array_values($valores), [$id]));
        auditar('editar', 'reglas_diagnostico', $id, $antes, $valores);
    } else {
        $codigo = strtoupper(substr(preg_replace('/[^A-Z0-9]+/i', '_', iconv('UTF-8', 'ASCII//TRANSLIT', $valores['nombre'])), 0, 30)) . '_' . substr(bin2hex(random_bytes(3)), 0, 4);
        $valores = ['codigo' => $codigo] + $valores;
        db_query($conn, 'INSERT INTO reglas_diagnostico (' . implode(', ', array_keys($valores)) . ') VALUES (' . implode(', ', array_fill(0, count($valores), '?')) . ')',
            str_repeat('s', count($valores)), array_values($valores));
        $id = mysqli_insert_id($conn);
        auditar('crear', 'reglas_diagnostico', $id, null, $valores);
    }
    json_response(['success' => true, 'id' => $id]);
});

# Documentación del sistema — VADEXSA LOGISTIC / Transporte

> Actualización 22/09/2026: la aplicación utiliza la interfaz SPA de `frontend/index.html` y endpoints JSON. Consulte [Gestión operativa](docs/GESTION_OPERATIVA.md) para el flujo actual, roles, abonos, migración y pruebas. Las secciones históricas siguientes describen también las pantallas PHP anteriores.

Sistema web interno para gestionar servicios de transporte y mudanzas, clientes, flota, conductores, proveedores, gastos y reportes operativos.

## Actualización de correcciones y continuidad del proyecto (noviembre 2026)

Durante esta fase de trabajo se estabilizó la base del sistema y se corrigió el flujo de arranque y de autenticación para que el proyecto sea usable en un entorno local con WAMP. Los cambios más relevantes fueron:

- Ajuste del launcher `ABRIR_SISTEMA.bat` para detectar la ruta del proyecto, comprobar la disponibilidad del sistema y abrir la URL correcta del login y del frontend.
- Unificación del acceso del launcher en la SPA (`frontend/#login`), evitando abrir el login PHP clásico y el frontend en pestañas separadas; actualización del identificador del router para que el navegador no reutilice la versión anterior en caché.
- Protección de la navegación frente a contenedores ausentes y rutas inválidas, mostrando un error explícito en vez de enviar silenciosamente al usuario al dashboard.
- Ajuste de la validación de sesión en el frontend: una sesión anónima se distingue de un fallo de servidor; el error de conexión ya no se oculta como si el usuario solo estuviera desconectado. La sesión validada se reutiliza al navegar, mientras el backend sigue verificando autenticación en cada API protegida.
- Corrección del bootstrap de base de datos en `config/conexion.php` para crear tablas y columnas faltantes de forma compatible con bases de datos parcialmente migradas.
- Reforzamiento del control de sesión y permisos en `require_auth()` para invalidar accesos de usuarios inactivos o sin sesión válida.
- Corrección de la vinculación de parámetros SQL al cargar los permisos predeterminados; el usuario que audita la inserción ahora se pasa por referencia correctamente, evitando el error fatal durante `login/validar.php?action=me`.
- Inclusión de un catálogo de módulos y soporte de acceso por usuario en `usuario_modulos`, con funciones para devolver permisos por defecto y verificar acceso por módulo.
- Preparación del flujo de administración de usuarios y permisos mediante `usuarios/index.php` y el nuevo endpoint `usuarios/permisos.php`.
- Registro en el enrutador SPA de todos los enlaces presentes en el menú: control operativo, cuentas por cobrar, cierre y gastos adicionales, facturas y administración de usuarios. Antes, los enlaces sin ruta asociada caían en el dashboard.
- Conversión del formulario de servicio a un asistente de cuatro pasos: cliente/fecha, modalidad, disponibilidad de vehículo y conductor, y datos finales con resumen previo al guardado. Las unidades y los conductores ocupados en el mismo horario no se ofrecen.
- Implementación de la administración visual de cuentas y permisos: toggles de activo/inactivo, edición de perfil y tarjetas de acceso por módulo.
- Aplicación de los permisos seleccionados tanto en la navegación SPA como en cada endpoint protegido; el cambio de permisos se vuelve a consultar con cada petición. La administración de usuarios continúa reservada a administradores.
- Cobertura de lectura autenticada para dashboard, operaciones, servicios, programación, clientes, flota, conductores, proveedores, gastos, reportes, facturas, cuentas y usuarios en `tests/gestion.integration.php`.
- Validación de los 15 enlaces del menú, carga del login en Chrome headless, sintaxis de los 17 módulos JavaScript, pruebas JS y 59 comprobaciones de integración PHP.

### Archivos clave modificados

- `ABRIR_SISTEMA.bat`: apertura segura de la pantalla de login SPA y visualización de la URL.
- `config/conexion.php`: conexión, sesión, permisos y creación automática de esquema compatible.
- `usuarios/index.php`: respuesta JSON con datos del usuario y módulos activos del usuario.
- `usuarios/permisos.php`: gestión de permisos por módulo para cada usuario.
- `frontend/js/router.js`, `frontend/js/modules/auth.js` y `frontend/js/api.js`: navegación SPA, gestión de sesión y manejo de errores de API.
- `frontend/js/modules/servicios.js`: asistente multi-etapa y selección de recursos disponibles.
- `frontend/js/modules/gestion.js`: pantalla administrativa de usuarios, estado de cuenta y toggles de permisos.
- `frontend/css/app.css`: estilos adaptables para el asistente y la pantalla de permisos.
- `tests/gestion.integration.php`: prueba de carga autenticada de los principales endpoints de los módulos.

### Estado funcional actual

El proyecto se encuentra en un estado estable para continuar el desarrollo y la sustentación. La problemática principal que generaba bloqueos operativos era la diferencia de esquema entre entornos locales y migraciones parciales; esa condición se mitigó con validaciones automáticas en arranque sin romper la lógica existente. La aplicación también quedó mejor preparada para la administración de perfiles, roles y permisos por módulo.

### Recomendaciones para continuidad

1. Mantener la disciplina de migraciones SQL para cada cambio de esquema.
2. Validar el entorno local con una base de datos limpia antes de desplegar cambios importantes.
3. En WAMP, recorrer el wizard y la administración con perfiles administrador y operador para validar el flujo visual y las restricciones según la configuración local.
4. Repetir las pruebas automatizadas JS/PHP después de cada modificación funcional.

---

## 1. Tecnologías utilizadas

| Capa | Tecnología |
|------|------------|
| Lenguaje del servidor | **PHP** (scripts por página, sin framework) |
| Base de datos | **MySQL** vía extensión **mysqli** |
| Sesiones | **PHP `session_start()`** para autenticación |
| Interfaz | **HTML5**, **CSS** (estilos en `layout/header.php` y páginas puntuales) |
| Componentes UI | **Bootstrap 5.3.2** (CDN) |
| Iconos | **Bootstrap Icons** (CDN) |
| Tablas interactivas | **jQuery 3.7.1** + **DataTables** (1.13.6/7) con idioma **es-ES** |
| Exportación / impresión desde tablas | **DataTables Buttons**, **JSZip**, exportación HTML5 |

**Infraestructura esperada:** servidor con PHP y MySQL/MariaDB (por ejemplo **XAMPP**, **WAMP** o hosting LAMP). La conexión apunta por defecto a `localhost`, usuario `root`, sin contraseña, base de datos `transporte_db` (ver `config/conexion.php`).

---

## 2. Arquitectura general

El proyecto sigue un patrón **clásico PHP por archivos**:

- **`config/conexion.php`**: crea `$conn` con `mysqli_connect` y termina la ejecución si falla la conexión.
- **`layout/header.php`**: inicia sesión, exige `$_SESSION['usuario']` o redirige a `login.php`, e incluye cabecera HTML, estilos y scripts comunes.
- **`layout/sidebar.php`**: menú lateral con enlaces a los módulos.
- **Cada módulo** (por ejemplo `servicios/`, `clientes/`) suele tener:
  - **`index.php`**: listado (muchas veces con DataTables).
  - **`crear.php`**: formulario de alta.
  - **`guardar.php`**: procesamiento POST e `INSERT`.
  - **`editar.php`**: formulario de edición cargando registro por `id`.
  - **`actualizar.php`**: procesamiento POST y `UPDATE`.
  - **`eliminar.php`**: borrado por `id` (GET o según implementación).

No hay una API REST separada: el navegador envía formularios o enlaces GET y el servidor responde con redirecciones (`header("Location: ...")`) o HTML.

---

## 3. Flujos principales del sistema

### 3.1 Acceso y seguridad

1. El usuario abre **`login.php`** e ingresa usuario y contraseña.
2. El formulario puede enviar a **`validar_login.php`** (raíz del proyecto) o, si se usara la variante en carpeta, a **`login/validar.php`**.
3. La contraseña se compara usando **hash MD5** del valor enviado frente al campo almacenado en la tabla `usuarios`.
4. Si las credenciales coinciden, se guardan en sesión datos como `usuario`, `rol` y, en `login/validar.php`, también `nombre`; luego se redirige al **dashboard**.
5. **`layout/header.php`** protege las páginas internas: si no existe sesión de usuario, redirige al login.
6. **`logout.php`** destruye la sesión y vuelve al login.

**Nota de diseño:** existen dos rutas de validación (`validar_login.php` en la raíz y `login/validar.php`). La de `login/validar.php` además exige `estado='activo'` en el usuario. Conviene unificar un solo punto de entrada para evitar comportamientos distintos.

### 3.2 Dashboard

**`dashboard/index.php`** consulta la base de datos para el **mes y año calendario actuales** y muestra:

- Cantidad de **servicios** del mes.
- **Facturación** (suma de `precio_cliente` de servicios del mes).
- **IGV** estimado para servicios con comprobante distinto de `SIN_COMPROBANTE` (lógica basada en tasa 18%).
- **Gastos operativos** y **administrativos** del mes (sumas por fecha).
- **Utilidad** aproximada: facturación menos la suma de ambos gastos.

### 3.3 Servicios de transporte (núcleo del negocio)

- **Listado:** `servicios/index.php` une `servicios` con `clientes`, `vehiculos` y `conductores` y muestra la tabla con DataTables.
- **Alta:** `servicios/guardar.php` recibe datos del formulario (fecha, hora, cliente, vehículo, conductor, tipo de servicio/carga, modalidad, forma de pago, origen/destino, montos, guía remitente, estado, tipo de comprobante).

**Reglas de negocio destacadas en `guardar.php`:**

- Si la **modalidad** es “propio”, el **costo proveedor** se fuerza a 0.
- **IGV y base imponible:** si el comprobante no es `SIN_COMPROBANTE`, se calcula base e IGV del 18% sobre el monto al cliente.
- **Utilidad del servicio:** precio al cliente menos costo proveedor.
- **Antidoble reserva:** no permite dos servicios el mismo día y hora para el mismo **vehículo** ni el mismo **conductor**.
- **Guía transportista:** se genera un correlativo tipo `GRT-000001` según el máximo `id` de servicios.
- **Numeración de comprobantes:** para `FACTURA` o `BOLETA` se generan series tipo `F001-000001` o `B001-000001` contando registros existentes por tipo.

### 3.4 Programación operativa

**`servicios/programacion.php`** permite elegir una **fecha** y listar servicios de ese día ordenados por hora, con badges según estado (`programado`, `en_ruta`, `finalizado`, `cancelado`). Desde aquí se pueden pasar estados **programado → en_ruta** y **en_ruta → finalizado** mediante **`servicios/cambiar_estado.php`** (actualiza `estado_servicio` y redirige de vuelta a la programación).

### 3.5 Módulos maestros (CRUD)

Cada uno sigue el patrón listado en la sección 2:

| Módulo | Carpeta | Entidad principal en BD (inferida) |
|--------|---------|-------------------------------------|
| Clientes | `clientes/` | `clientes` |
| Vehículos | `vehiculos/` | `vehiculos` |
| Conductores | `conductores/` | `conductores` |
| Proveedores | `proveedores/` | `proveedores` |
| Gastos operativos | `gastos_operativos/` | `gastos_operativos` |
| Gastos administrativos | `gastos_administrativos/` | `gastos_administrativos` |

Los formularios envían datos a scripts `guardar.php` / `actualizar.php` que ejecutan SQL con `mysqli_query`.

### 3.6 Reportes

**`reportes/index.php`** actúa como **índice** hacia vistas especializadas:

- Servicios, facturación, utilidad, facturación por cliente (archivos `servicios.php`, `facturacion.php`, `utilidad.php`, `clientes.php` en la misma carpeta).

En muchos listados se reutilizan DataTables y, donde esté configurado, botones de exportación.

### 3.7 Usuarios y contraseña

En **`usuarios/`** hay flujos para guardar usuario y **cambiar contraseña** (`cambiar_password.php`, `actualizar_password.php`), alineados con la gestión de la tabla `usuarios`.

---

## 4. Modelo de datos (resumen lógico)

No se incluye un script `.sql` en el repositorio analizado; a partir del código, las tablas relevantes incluyen al menos:

- **`usuarios`:** autenticación (por ejemplo `usuario`, `password`, `rol`, y en una variante `estado`, `nombre`).
- **`servicios`:** operación diaria (fechas, horas, FK a cliente/vehículo/conductor, precios, IGV, utilidad, guías, factura, estado, tipo de comprobante, etc.).
- **`clientes`**, **`vehiculos`**, **`conductores`**, **`proveedores`**, **`gastos_operativos`**, **`gastos_administrativos`:** maestros y movimientos según el módulo.

Las relaciones en listados usan **`cliente_id`**, **`vehiculo_id`**, **`conductor_id`** en `servicios`.

---

## 5. Consideraciones de seguridad y calidad (recomendaciones)

- Las consultas construyen SQL con **concatenación de variables** (`'$usuario'`). Esto expone a **inyección SQL** si los datos no están validados; lo adecuado es usar **consultas preparadas** (`mysqli_prepare` / `bind_param`).
- **MD5** para contraseñas es obsoleto para seguridad; se recomienda **`password_hash`** / **`password_verify`** (bcrypt/argon2).
- Unificar **un solo** flujo de login y política de usuarios activos.
- Revisar permisos por **`rol`** si el negocio requiere que no todos los usuarios vean todos los módulos (hoy el menú es común para quien tenga sesión).

---

## 6. Cómo poner en marcha el proyecto (referencia)

1. Copiar el proyecto en la carpeta del servidor web (por ejemplo `htdocs` en XAMPP).
2. Crear la base **`transporte_db`** e importar el esquema y datos (si se dispone de un dump SQL externo).
3. Ajustar **`config/conexion.php`** (host, usuario, contraseña, nombre de base) al entorno real.
4. Acceder con el navegador a **`login.php`**.

---

*Documentación generada a partir del código del proyecto en la carpeta `transporte`. Si se añaden módulos o se cambia la base de datos, conviene actualizar este archivo en la misma línea.*

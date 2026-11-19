# Correcciones de la auditoría v2.1 y mejoras implementadas (versión 2.2)

Este documento relaciona cada hallazgo del *Informe de auditoría técnica VADEXSA v2.1* y cada mejora del documento *Definición de las tres mejoras* con el cambio realizado.

Estados: ✅ corregido en el código · 🟡 parcial o depende de una decisión/infraestructura externa · ⬜ pendiente.

Verificación: `php tests/api.integration.php` (56 comprobaciones contra una copia de la base) y `node --test tests/*.mjs` (6 pruebas). Ver [DESPLIEGUE.md](DESPLIEGUE.md).

## Mejoras del documento de definición

| Mejora | Implementación |
|---|---|
| **1. Control de acceso basado en roles (RBAC)** | Modelo usuario → rol → permisos (módulo × acción: ver, crear, editar, anular, exportar). Se unificaron "perfil" y "rol". Roles base: Administrador, Gerencia, Contabilidad, Operaciones y **Cliente**. El servidor valida cada endpoint (`config/permisos.php`, *deny by default*). Pantalla *Usuarios y roles* con matriz editable. Auditoría de cada operación (tabla `auditoria`, pantalla *Auditoría*). Separación de funciones: Operaciones registra servicios pero no los anula ni ve finanzas; Contabilidad emite y anula comprobantes. Ver [MATRIZ_PERMISOS.md](MATRIZ_PERMISOS.md). |
| **2. Facturación y cuentas por cobrar** | Comprobante como entidad propia (`comprobantes`, `comprobante_servicios`), uno o varios servicios finalizados por comprobante, numeración por serie con bloqueo, anulación con nota de crédito, pagos parciales y totales (`pagos`). Estado del comprobante guardado (emitida/anulada); estado de pago y situación de vencimiento **calculados**. Indicadores: periodo promedio de cobro, % vencido, monto vencido, antigüedad de la deuda y alertas de cobranza. Se aclara en pantalla que es un registro de control interno y que la emisión electrónica oficial se hace en SUNAT o el proveedor autorizado. |
| **3. Análisis integral de indicadores** | Pantalla *Análisis integral*: 19 indicadores operativos, financieros y de cobranza para un período, comparados con el período anterior de igual duración. Motor de reglas con umbrales configurables (`reglas_diagnostico`): cada regla tiene condición, tipo (positivo/negativo), prioridad y recomendación; las negativas críticas se muestran como puntos críticos. Incluye las tres reglas de ejemplo del documento. Reporte imprimible/PDF y CSV; se registra el tiempo de generación para medir la mejora. No se presenta como inteligencia artificial. |

**Línea base (antes de desarrollar los módulos 2 y 3):** el documento recomienda medir la situación actual. Los datos anteriores a la versión 2.2 no tienen fechas de pago confiables, por lo que el periodo promedio de cobro y el % vencido empiezan a medirse desde que se registren los pagos en el sistema. Registre a mano, antes de usarlo, cuántos días tarda hoy una cobranza y cuánto tarda armar el reporte del mes.

## Seguridad (SEG)

| ID | Estado | Corrección |
|---|---|---|
| SEG-01 | ✅ | Todas las consultas con datos del usuario usan sentencias preparadas (`db_query` en `config/db.php`); se reescribieron todos los endpoints. |
| SEG-02 | ✅ | Sin `mysqli_real_escape_string`; `utf8mb4` fijado en la conexión. |
| SEG-03 | ✅ | `password_hash`/`password_verify`; los hash MD5 se migran en el siguiente inicio de sesión. |
| SEG-04 | 🟡 | Credenciales configurables (`config/env.php`) con instrucciones para crear un usuario propio. Crear ese usuario en el servidor de producción. |
| SEG-05 | ✅ | `config/env.php` fuera del repositorio; `config/` bloqueada por web. |
| SEG-06 | ✅ | Acciones que modifican datos solo por POST; GET responde 405. |
| SEG-07 | ✅ | Token CSRF por sesión en la cabecera `X-CSRF-Token`; cookie `SameSite=Lax`. |
| SEG-08 | ✅ | `require_auth()` valida rol y permiso de cada endpoint; matriz documentada. |
| SEG-09 | ✅ | Rol Cliente y `usuarios.cliente_id`; el portal filtra por `$_SESSION['cliente_id']`. |
| SEG-10 | ✅ | El portal responde 404 a registros de otro cliente; la API interna exige permiso del módulo. |
| SEG-11 | ✅ | El asistente responde según los permisos del rol y no está disponible para clientes. |
| SEG-12 | 🟡 | Escapado de HTML en todas las plantillas (`esc()`); CSP en las respuestas de la API. Falta una CSP estricta para la SPA (usa estilos en línea). |
| SEG-13 | ✅ | Respuestas del asistente como texto (`textContent`). |
| SEG-14 | ✅ | `session_regenerate_id`, cookie HttpOnly/SameSite/Secure (con HTTPS) y cierre por 30 min de inactividad. |
| SEG-15 | ✅ | Bloqueo de 15 min tras 5 intentos por usuario y límite por IP; tabla `login_intentos`. |
| SEG-16 | ✅ | Mensaje único "Usuario o contraseña incorrectos". |
| SEG-17 | ✅ | Sin `*`: solo el mismo origen o los configurados. |
| SEG-18 | 🟡 | Redirección a HTTPS y HSTS en el código. Falta instalar el certificado en el servidor. |
| SEG-19 | ✅ | Vistas PHP antiguas retiradas (`layout/`, `*/crear.php`, `*/editar.php`, etc.). |
| SEG-20 | ✅ | `test_form.html` eliminado; `.htaccess` bloquea archivos de desarrollo. |
| SEG-21 | ✅ | `display_errors` desactivado, mensajes genéricos y log en `logs/`. |
| SEG-22 | 🟡 | `nosniff`, `X-Frame-Options`, `Referrer-Policy` y CSP en la API. Ver SEG-12 para la SPA. |
| SEG-23 | ✅ | Atributo `integrity` (SRI) en Bootstrap Icons. |
| SEG-24 | ✅ | Tabla `auditoria` (usuario, acción, tabla, id, antes/después, fecha, IP) y pantalla de consulta. |
| SEG-25 | 🟡 | `scripts/respaldo.bat` con retención y copia externa. Falta programarlo y probar la restauración mensual. |
| SEG-26 | ✅ | Validación en el servidor de tipos, rangos, longitudes y listas de valores. |
| SEG-27 | ✅ | Solo quien tiene permiso de usuarios crea cuentas; solo un administrador otorga el rol Administrador; el rol se valida contra la tabla `roles`. |
| SEG-28 | ✅ | Mínimo 10 caracteres con letras y números, lista de contraseñas comunes y cambio obligatorio de la contraseña inicial. |
| SEG-29 | 🟡 | Probado en PHP 8.3 y MySQL 8.4 LTS. Falta desplegar en un servidor con esas versiones. |
| SEG-30 | ✅ | Las exportaciones CSV neutralizan `=`, `+`, `-` y `@`. |

## Lógica de negocio (NEG)

| ID | Estado | Corrección |
|---|---|---|
| NEG-01 | ✅ | Margen = base imponible − costo del proveedor (sin IGV). Se recalculó el histórico. |
| NEG-02 | ✅ | "Resultado operativo" sin IGV en dashboard, cierre, asistente y análisis. Ver [CRITERIOS_FINANCIEROS.md](CRITERIOS_FINANCIEROS.md). |
| NEG-03 | ✅ | `gastos_operativos.servicio_id`; el reporte de margen descuenta los gastos del viaje. |
| NEG-04 | 🟡 | Regla documentada: costos y gastos sin IGV. Separar base e IGV de cada gasto requiere definirlo con contabilidad. |
| NEG-05 | ✅ | Solo servicios finalizados y no anulados en los ingresos. |
| NEG-06 | ✅ | Solapamiento por intervalos, incluidos los viajes que cruzan la medianoche. |
| NEG-07 | ✅ | Se rechaza un vehículo o conductor que no esté activo. |
| NEG-08 | ✅ | La misma validación al editar, excluyendo el propio servicio. |
| NEG-09 | ✅ | Se bloquea con licencia, SOAT o revisión vencidos; aviso a 30 días; regla en el análisis. |
| NEG-10 | ✅ | Capacidad y peso numéricos con aviso de sobrecarga. |
| NEG-11 | ✅ | Tercerizado: sin vehículo ni conductor propios, proveedor obligatorio, no bloquea la flota. |
| NEG-12 | ✅ | El comprobante se registra después de finalizar el servicio, como entidad separada. |
| NEG-13 | ✅ | Anulación con nota de crédito y motivo; el servicio solo se cancela sin comprobante vigente. |
| NEG-14 | ✅ | Máquina de estados en el servidor (`servicios/reglas.php`). |
| NEG-15 | ✅ | No se cambian importes, cliente ni tipo de un servicio facturado. |
| NEG-16 | ✅ | El servidor recalcula los montos e ignora los del navegador. |
| NEG-17 | 🟡 | Configurable (`igv_sin_comprobante`, por defecto se trata como gravado). Confirmar con el contador. |
| NEG-18 | ✅ | Factura solo con RUC válido. |
| NEG-19 | ✅ | RUC con dígito verificador y DNI de 8 dígitos. |
| NEG-20 | ✅ | Pagos, saldos, vencimientos y reporte de cuentas por cobrar (mejora 2). |
| NEG-21 | ✅ | `hora_servicio` es la hora de inicio y se agregó `hora_fin_estimada`. |
| NEG-22 | 🟡 | Los reportes de facturación usan la fecha de emisión. Validar el criterio con contabilidad. |

## Base de datos (BD) y concurrencia (CON)

| ID | Estado | Corrección |
|---|---|---|
| BD-01 | ✅ | `servicios.proveedor_id` obligatorio en tercerizados. |
| BD-02 | ✅ | `hora_fin_estimada`. |
| BD-03 | ✅ | `created_at`, `updated_at`, `created_by`, `updated_by` en las tablas principales + tabla `auditoria`. |
| BD-04 | ✅ | Servicios, comprobantes y pagos se anulan con motivo, nunca se borran; los catálogos con historial no se eliminan. |
| BD-05 | 🟡 | `UNIQUE(serie, numero)` en comprobantes. El índice único de la guía se crea si no hay duplicados; si los hay, la migración lo informa (`php migrations/migrar.php`). |
| BD-06 | 🟡 | Las tablas nuevas usan ENUM o catálogo (`roles`); en las existentes los valores se validan contra listas en el servidor. |
| BD-07 | ✅ | Vencimiento de licencia, SOAT y revisión técnica. |
| BD-08 | ✅ | `peso_kg`, estado de pago calculado, series en tabla; el portal muestra solo datos reales. |
| BD-09 | ⬜ | Tabla de vehículos por proveedor: pendiente. |
| BD-10 | ✅ | Índice único en el documento del cliente (si no hay duplicados). |
| BD-11 | 🟡 | `categoria_licencia` separada; único en la licencia si no hay duplicados. |
| BD-12 | ✅ | InnoDB y `ON DELETE RESTRICT` en las relaciones nuevas. |
| BD-13 | ✅ | Índices (vehiculo, fecha), (conductor, fecha), (cliente, fecha). |
| BD-14 | ✅ | `capacidad_kg` numérico (se convirtió el texto existente). |
| BD-15 | ⬜ | Normalización por ubigeo: pendiente. |
| BD-16 | ✅ | Tabla `comprobantes` relacionada con servicios. |
| CON-01 | ✅ | Serie con `SELECT … FOR UPDATE`; la guía se deriva del id autoincremental. Probado con dos emisiones simultáneas. |
| CON-02 | ✅ | Igual que CON-01; los números nunca se reutilizan. |
| CON-03 | ✅ | Validación e inserción bajo bloqueo y transacción. |
| CON-04 | ✅ | Columna `version` verificada al guardar el servicio. |

## Arquitectura, infraestructura, experiencia de usuario, normativa y calidad

| ID | Estado | Corrección |
|---|---|---|
| ARQ-01 | 🟡 | Se documenta como API HTTP/JSON con GET y POST; no se reestructuró en rutas REST. |
| ARQ-02 | ✅ | Catálogo completo en [MATRIZ_PERMISOS.md](MATRIZ_PERMISOS.md). |
| ARQ-03 | ✅ | Capa común `config/db.php` y `config/crud.php`. |
| ARQ-04 | 🟡 | `limit` y `offset` en los listados del servidor; las tablas siguen filtrando en el navegador. |
| ARQ-05 | ✅ | 400/401/403/404/405/409/422/429/500 de forma consistente. |
| ARQ-06 | ✅ | Log mensual en `logs/`. |
| ARQ-07 | ✅ | Sin `?v=` manual: el servidor obliga a revalidar JS/CSS (`frontend/.htaccess`). |
| INF-01 | ⬜ | Desplegar en un servidor con dominio y HTTPS. |
| INF-02 | 🟡 | Una base y un `env.php` por entorno (documentado). |
| INF-03 | 🟡 | Archivos de acceso local bloqueados por web; no copiarlos a producción. |
| INF-04 | 🟡 | Flujo de ramas y etiquetas documentado. |
| UX-01 | ✅ | "Asistente de consultas basado en reglas". |
| UX-02 | ✅ | "Seguimiento por estado del servicio" (sin GPS). |
| UX-03 | ✅ | Se retiró el widget de tipo de cambio con valores fijos. |
| UX-04 | ✅ | CSV separado por punto y coma. |
| UX-05 | 🟡 | Facturación, cuentas, análisis, auditoría y portal exportan desde los datos; los catálogos aún exportan la tabla visible (se avisa). |
| UX-06 | ✅ | Los errores quedan visibles hasta cerrarlos. |
| UX-07 | ⬜ | Revisión de contraste WCAG 2.1 AA pendiente. |
| UX-08 | ✅ | Archivos de prueba retirados de la lista de funcionalidades. |
| NOR-01 | 🟡 | Comprobantes y guías rotulados como registro de control interno. La integración con SUNAT/OSE queda fuera del alcance. |
| NOR-02 | 🟡 | Accesos restringidos por rol y aviso de la Ley 29733 en el inicio de sesión y el portal. Falta definir plazos de conservación. |
| QA-01 | 🟡 | Pruebas de integración de la API y unitarias del frontend (sin PHPUnit). |
| QA-02 | ⬜ | Escaneo OWASP ZAP antes de publicar. |
| QA-03 | ✅ | Pruebas de concurrencia, solapamientos, montos negativos y transiciones inválidas. |

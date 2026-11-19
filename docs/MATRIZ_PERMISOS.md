# Matriz de permisos y catálogo de endpoints

Generado a partir de `config/permisos.php`. Modelo RBAC: **usuario → rol → permisos (módulo × acción)**. El servidor valida cada petición contra esta matriz; un endpoint que no figure en el catálogo solo lo usa el administrador (*deny by default*).

Acciones: **V** ver · **C** crear · **E** editar · **A** anular · **X** exportar. Los roles base se crean con la migración; el administrador puede crear roles nuevos y editar su matriz en *Usuarios y roles*.

## Roles base

| Módulo | Administrador | Gerencia | Contabilidad | Operaciones | Cliente |
|---|---|---|---|---|---|
| Dashboard | V | V | V | — | — |
| Servicios | VCEAX | VX | VX | VCE | — |
| Programación | VE | V | — | VE | — |
| Control operativo | VEX | VX | — | VE | — |
| Clientes | VCEAX | VX | VCEX | VCE | — |
| Vehículos | VCEAX | VX | — | VCE | — |
| Conductores | VCEAX | VX | — | VCE | — |
| Proveedores | VCEAX | VX | V | VCE | — |
| Gastos operativos | VCEAX | VX | VCEAX | VC | — |
| Gastos administrativos | VCEAX | VX | VCEAX | — | — |
| Cierre y adicionales | VCX | VX | VCX | — | — |
| Facturación | VCAX | VX | VCAX | — | — |
| Cuentas por cobrar | VCAX | VX | VCAX | — | — |
| Reportes | VX | VX | VX | — | — |
| Análisis integral | VEX | VEX | VX | — | — |
| Auditoría | VX | VX | — | — | — |
| Usuarios y roles | VCE | — | — | — | — |
| Portal del cliente | — | — | — | — | V |

- **Administrador**: Acceso total, incluida la gestión de usuarios y roles.
- **Gerencia**: Consulta todos los módulos y define las reglas del diagnóstico.
- **Contabilidad**: Facturación, cobranza, gastos y reportes.
- **Operaciones**: Registro y programación de servicios, flota y conductores. Sin acceso a finanzas.
- **Cliente**: Acceso al portal: solo sus propios servicios, comprobantes y saldo.

## Catálogo de endpoints (ARQ-02)

Todos responden JSON. Las peticiones que modifican datos usan **POST** con la cabecera `X-CSRF-Token`; un GET a ellas responde 405.

| Endpoint | Método | Permiso requerido (basta uno) |
|---|---|---|
| login/validar.php | GET `?action=me` · POST | Público (inicio de sesión) |
| login/logout.php | POST | Público |
| dashboard/index.php | GET | dashboard:ver |
| chatbot/responder.php | POST | Cualquier usuario con sesión |
| usuarios/index.php | GET | usuarios:ver |
| usuarios/gestionar.php | POST | usuarios:crear · usuarios:editar |
| usuarios/guardar.php | POST | usuarios:crear · usuarios:editar |
| usuarios/roles.php | GET · POST | GET: usuarios:ver — POST: usuarios:editar |
| usuarios/permisos.php | POST | usuarios:editar |
| usuarios/mi_password.php | POST | Cualquier usuario con sesión |
| servicios/index.php | GET | servicios:ver · operacion:ver · facturas:crear |
| servicios/guardar.php | POST | servicios:crear |
| servicios/actualizar.php | POST | servicios:editar |
| servicios/eliminar.php | POST | servicios:anular |
| servicios/cambiar_estado.php | POST | servicios:editar · programacion:editar |
| servicios/correlativo.php | GET | servicios:crear · servicios:editar |
| servicios/imprimir.php | GET | servicios:ver · operacion:ver |
| servicios/operacion.php | GET · POST | GET: operacion:ver — POST: operacion:editar |
| servicios/programacion.php | GET | programacion:ver |
| clientes/index.php | GET | clientes:ver · facturas:crear · servicios:crear · servicios:editar |
| clientes/guardar.php | POST | clientes:crear |
| clientes/actualizar.php | POST | clientes:editar |
| clientes/eliminar.php | POST | clientes:anular |
| clientes/servicios.php | GET | clientes:ver |
| vehiculos/index.php | GET | vehiculos:ver · gastos_operativos:ver · servicios:crear · servicios:editar |
| vehiculos/guardar.php | POST | vehiculos:crear |
| vehiculos/actualizar.php | POST | vehiculos:editar |
| vehiculos/eliminar.php | POST | vehiculos:anular |
| conductores/index.php | GET | conductores:ver · servicios:crear · servicios:editar |
| conductores/guardar.php | POST | conductores:crear |
| conductores/actualizar.php | POST | conductores:editar |
| conductores/eliminar.php | POST | conductores:anular |
| conductores/disponibles.php | GET | programacion:ver · servicios:crear · servicios:editar |
| proveedores/index.php | GET | proveedores:ver · operacion:ver · servicios:crear · servicios:editar |
| proveedores/guardar.php | POST | proveedores:crear |
| proveedores/actualizar.php | POST | proveedores:editar |
| proveedores/eliminar.php | POST | proveedores:anular |
| gastos_operativos/index.php | GET | gastos_operativos:ver |
| gastos_operativos/guardar.php | POST | gastos_operativos:crear |
| gastos_operativos/actualizar.php | POST | gastos_operativos:editar |
| gastos_operativos/eliminar.php | POST | gastos_operativos:anular |
| gastos_administrativos/index.php | GET | gastos_administrativos:ver |
| gastos_administrativos/guardar.php | POST | gastos_administrativos:crear |
| gastos_administrativos/actualizar.php | POST | gastos_administrativos:editar |
| gastos_administrativos/eliminar.php | POST | gastos_administrativos:anular |
| gastos_adicionales/guardar.php | POST | cierre:crear |
| reportes/servicios.php | GET | reportes:ver |
| reportes/clientes.php | GET | reportes:ver |
| reportes/facturacion.php | GET | reportes:ver |
| reportes/utilidad.php | GET | reportes:ver |
| reportes/cierre.php | GET | cierre:ver |
| facturas/index.php | GET | facturas:ver |
| facturas/emitir.php | POST | facturas:crear |
| facturas/anular.php | POST | facturas:anular |
| facturas/cuentas.php | GET | cuentas:ver |
| facturas/pago.php | POST | cuentas:crear |
| facturas/anular_pago.php | POST | cuentas:anular |
| analisis/index.php | GET | analisis:ver |
| analisis/reglas.php | GET · POST | GET: analisis:ver — POST: analisis:editar |
| auditoria/index.php | GET | auditoria:ver |
| portal/datos.php | GET | portal:ver |

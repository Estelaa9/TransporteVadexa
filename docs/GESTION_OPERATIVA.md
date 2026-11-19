> **Versión 2.2 (18/11/2026):** este documento describe versiones anteriores. Los cambios de la auditoría v2.1 y las tres mejoras (roles y permisos, facturación y cuentas por cobrar, análisis integral) están en [docs/CAMBIOS_AUDITORIA.md](CAMBIOS_AUDITORIA.md). Instalación: [docs/DESPLIEGUE.md](DESPLIEGUE.md).

# Gestión operativa de VADEXSA

Implementación de las cinco hojas de ideas (22/09/2026). La entrada principal es `frontend/index.html`.

## Ideas y pantallas

| Idea de las notas | Implementación |
| --- | --- |
| Viajes propios y de terceros, vehículo y conductor | Servicios conserva la asignación de flota y conductor. Control operativo permite filtrar por placa, conductor, modalidad, tipo, fechas y estado. La ficha vincula el proveedor para terceros. |
| Lima, provincias, mudanzas, temporadas y frecuencia | Tipos Local, Provincia y Mudanza; ficha con provincia, distrito, referencia, almacén, contacto, teléfono, temporada, frecuencia y observaciones. |
| Clientes personas y empresas | Se reutiliza el directorio existente con tipo Persona Natural / Empresa y su historial. |
| Programado, en ruta y finalizado | Estado del viaje independiente del comprobante y del pago. Transiciones programado → en ruta → finalizado; cancelación conserva el registro. |
| Guardar sin facturar | El alta guarda el viaje sin número. Facturas incluye los servicios pendientes, incluso los que tienen tipo SIN_COMPROBANTE. |
| Factura, boleta, IGV y detracción | Registro posterior del número emitido, base e IGV con el cálculo existente, importe de detracción ingresado por el administrador. No se genera un número fiscal al programar. |
| Adelantos y cuentas por cobrar | Cuentas por cobrar registra abonos con fecha, importe, referencia y autor. Calcula el saldo, impide excederlo y conserva el historial. |
| Gastos adicionales y resultado del día | Cierre y adicionales integra gastos operativos, administrativos, adicionales y costo de terceros; consulta por día o período. |
| Gráfico y leyenda | Cierre incluye una comparación de ingresos por servicios finalizados y gastos, con leyenda y valores. |
| Reportes por fechas e impresión | Se conservan reportes, filtros y exportación; se añaden órdenes de servicio y referencias imprimibles de guías y comprobantes. El navegador permite guardar PDF. |
| Administrador separado de usuario | Administración de usuarios con alta, edición, rol y activación. Menú y dashboard reducidos para usuarios; validación de permisos también en PHP. |

## Flujo recomendado

1. Registrar clientes, vehículos, conductores y proveedores en sus catálogos.
2. Crear el viaje en Servicios. Se valida fecha, hora, importes y asignaciones; una misma placa o conductor no puede reservarse dos veces en el mismo horario.
3. Abrir Control operativo → Ficha para registrar el proveedor y los datos de entrega. Los terceros requieren proveedor al guardar la ficha.
4. Iniciar y finalizar desde Servicios o Programación diaria. Finalizado significa que terminó el viaje; no implica facturado ni pagado.
5. Registrar adelantos desde Cuentas por cobrar, incluso antes de disponer de comprobante.
6. En Facturas → Por emitir, registrar el número del comprobante emitido en el sistema correspondiente y, si aplica, el importe de detracción. El número no puede repetirse.
7. Registrar más abonos o confirmar el pago total en Facturas. “Pagada” confirma la cancelación de todo el saldo; los abonos previos se conservan.
8. Consultar Cierre y adicionales para un día o rango. No duplicar el mismo gasto en varios módulos.

## Cálculos y alcance

- **Resultado operativo** = precios de servicios finalizados del período − costo de terceros de esos servicios − gastos operativos − administrativos − adicionales del período.
- **Cobros registrados** = abonos por su fecha + saldo restante de comprobantes marcados pagados por su fecha de pago. Los adelantos no se vuelven a sumar al confirmar el pago.
- **Saldo por cobrar** = precio − abonos; es cero si se confirmó el pago completo del comprobante.
- **Margen antes de gastos**, en el reporte de utilidad por servicio, resta únicamente el costo del proveedor. Para el resultado que incluye gastos se usa Cierre.
- Facturación se presenta por fecha del servicio, tal como en el esquema existente. No representa un libro fiscal por fecha de emisión.
- El resultado es un indicador operativo con los precios registrados; no reemplaza una liquidación tributaria. La detracción es un dato del comprobante, no un gasto adicional ni un descuento del precio total por cobrar.

## Roles

| Función | Usuario | Administrador |
| --- | --- | --- |
| Servicios, programación, fichas y catálogos | Sí | Sí |
| Gastos operativos | Sí | Sí |
| Facturas, abonos, cuentas por cobrar | No | Sí |
| Gastos administrativos, adicionales, cierre y reportes financieros | No | Sí |
| Crear cuentas, cambiar rol o desactivar | No | Sí |
| Cancelar desde la acción administrativa del listado | No | Sí |

Se admiten los roles administrativos existentes `administrador` y `admin`. La sesión reconsulta el rol y estado para que las bajas o cambios de permisos se apliquen de inmediato. Una cuenta no puede retirarse su propio rol administrativo ni desactivarse. Las nuevas claves usan `password_hash`; el login sigue aceptando las claves MD5 heredadas.

## Estructura técnica

- `config/gestion.php`: consultas preparadas, validación de fechas/importes, CSRF y permiso administrativo.
- `servicios/persistir.php`: alta y edición compartidas, transacciones, protección de importes facturados y bloqueo de reservas concurrentes.
- `servicios/operacion.php`: ficha operativa y proveedor; sincroniza `servicios.proveedor_id`.
- `facturas/registrar.php`, `actualizar_pago.php`, `abonar.php`, `cuentas.php`: comprobantes, estado de pago y abonos.
- `reportes/cierre.php` y `gastos_adicionales/guardar.php`: resultado del período y gastos adicionales.
- `usuarios/gestionar.php`: gestión de cuentas con validación de rol y CSRF.
- `frontend/js/modules/gestion.js` y `cuentas.js`: pantallas integradas al router existente.

## Instalación y comprobaciones

En WampServer, inicia Apache y MySQL y ejecuta `ABRIR_SISTEMA.bat` desde la carpeta del proyecto. El lanzador deriva la ruta web del nombre de esa carpeta y comprueba que el frontend responda antes de abrir el navegador.

Sobre una base existente del proyecto, ejecutar en este orden:

```sql
SOURCE facturas/esquema.sql;
SOURCE migrations/20260922_gestion.sql;
```

La migración agrega tablas sin eliminar registros y amplía la columna de contraseña. Puede ejecutarse nuevamente. En el entorno local de este trabajo ya fue aplicada a `transporte_db`. El esquema existente debe incluir `servicios.proveedor_id` y `servicios.monto_detraccion`, verificados en la base local.

```text
node --test tests/*.test.mjs
php tests/gestion.integration.php
```

La prueba de integración crea una base temporal `vadexsa_test_<aleatorio>`, copia solamente la estructura, inicia PHP en `127.0.0.1:18097` y prueba HTTP con cuentas y servicios propios. Al terminar elimina únicamente esa base temporal. No copia ni modifica los datos de negocio. Requiere mysqli, curl, proc_open y permisos para crear esa base de prueba. `VADEXSA_DB_NAME` permite seleccionar la base del servidor de pruebas.

## Interpretaciones de las notas

- “Temporadas” y “frecuencia” se implementan como información del servicio. No se generan reservas recurrentes automáticamente.
- “Boleto / boleta” se interpreta como boleta de venta vinculada al servicio, no como venta de pasajes.
- “Libro” se cubre con los reportes y exportaciones internos existentes.
- Las impresiones de guías y comprobantes son referencias internas. No hay conexión a SUNAT ni emisión electrónica en este cambio.
- El cierre es un informe recalculado con los datos actuales, no un cierre contable irreversible.

# Módulo de facturas

Acceso: `frontend/index.html#facturas`, menú **Finanzas & Gastos → Facturas**. También está enlazado desde el menú PHP anterior.

## Instalación

Con MySQL iniciado, seleccionar `transporte_db` e importar primero `facturas/esquema.sql` y después `migrations/20260922_gestion.sql`. No se ejecuta DDL desde las peticiones web. Ambas migraciones ya están aplicadas en el entorno local de este trabajo. Consulte [Gestión operativa](../docs/GESTION_OPERATIVA.md).

## Uso y alcance

- Consulta facturas y boletas vinculadas a servicios, con búsqueda por número, cliente, documento y servicio; filtros por tipo, emisión, pago y fechas del servicio.
- Una factura se considera **emitida** cuando tiene número registrado; no representa una validación de emisión electrónica. Sin número aparece **Por emitir**.
- Los pagos anteriores aparecen **Sin registrar**. La forma de pago (contado/crédito) y el estado del servicio no demuestran que se haya cobrado.
- **Registrar pago** confirma **Por pagar / cobrar** o **Pagada**, con fecha obligatoria para pagos realizados. Los adelantos y pagos parciales se registran en **Cuentas por cobrar** y se muestran también en Facturas. El cierre evita duplicarlos al confirmar el pago completo.
- El módulo corresponde a comprobantes a clientes; no incluye facturas de proveedores.
- Los totales y el CSV corresponden a todos los registros que coinciden con los filtros.
- Los servicios cancelados se excluyen del listado de facturación. No se permite cancelar servicios con comprobantes o abonos registrados.
- El comprobante se registra después del viaje. Se impide repetir o cambiar el número y alterar cliente, precio o tipo de un servicio facturado.
- La fecha mostrada es la del servicio; el sistema actual no almacena una fecha de emisión independiente.

Las consultas requieren sesión y rol administrativo. La actualización usa POST, token CSRF, consultas preparadas y validación de número y fecha. El último usuario y momento de actualización se guardan en la tabla.

## Verificación

`node --test tests/facturas.test.mjs`

Con la base disponible: iniciar sesión, abrir Facturas, combinar filtros, registrar un pago, recargar para verificar persistencia y descargar el CSV. Comprobar también una factura sin número y un comprobante sin estado de pago previo.

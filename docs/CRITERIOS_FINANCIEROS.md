# Criterios financieros del sistema

Responde a los hallazgos NEG-01, NEG-02, NEG-04, NEG-05, NEG-17 y NEG-22 de la auditoría. El cálculo está centralizado en `reportes/lib.php` (`finanzas_periodo`) y lo usan el dashboard, el cierre, los reportes, el asistente y el análisis integral, de modo que todos muestran la misma cifra.

## Por servicio

| Concepto | Fórmula | Dónde |
|---|---|---|
| Base imponible | `precio_cliente / 1.18` (redondeo a 2 decimales) | `calcular_igv()` en `config/db.php` |
| IGV | `precio_cliente − base imponible` | ídem |
| Margen del servicio | `base imponible − costo del proveedor` (ambos **sin IGV**) | `servicios/persistir.php` |
| Margen con gastos del viaje | `margen − gastos operativos vinculados al servicio` | `reportes/utilidad.php` |

El navegador muestra una vista previa, pero **el servidor siempre recalcula** los montos e ignora los que envíe el formulario (NEG-16).

**Ejemplo (prueba 7 de la auditoría):** precio S/ 1,180 con factura y costo de proveedor S/ 500 → base S/ 1,000.00, IGV S/ 180.00, margen **S/ 500.00** (antes el sistema mostraba S/ 680.00).

## Por período

```
Ingresos              = Σ base imponible de servicios FINALIZADOS (por fecha del servicio)
Costo de terceros     = Σ costo_proveedor de esos servicios
Gastos                = Σ gastos operativos + administrativos + adicionales (por fecha del gasto)
Resultado operativo   = Ingresos − Costo de terceros − Gastos
Margen operativo (%)  = Resultado operativo / Ingresos × 100
Facturado             = Σ comprobantes emitidos no anulados (por fecha de EMISIÓN)
```

- Se excluyen los servicios anulados y los no finalizados (NEG-05).
- El indicador se llama **resultado operativo**, no "utilidad neta": no descuenta el impuesto a la renta (NEG-02).
- Los reportes de facturación usan la fecha de emisión del comprobante, igual que los registros contables (NEG-22). Los de operación usan la fecha del servicio.

## Supuestos que debe confirmar el contador (NEG-04, NEG-17)

1. **Costos y gastos se registran sin IGV.** El formulario de gastos lo indica. Si la empresa necesita controlar el crédito fiscal, el siguiente paso es separar base e IGV de cada gasto.
2. **Servicios "sin comprobante".** Una operación gravada genera IGV aunque no se emita comprobante; por eso la base se calcula sin IGV también en ese caso. Se controla con `igv_sin_comprobante` en `config/env.php` (valor por defecto `true`). Si el contador indica lo contrario, cambiarlo a `false`.
3. **Tasa de IGV:** `igv_tasa` en `config/env.php` (0.18).

## Cuentas por cobrar (mejora 2)

| Indicador | Cálculo |
|---|---|
| Saldo de un comprobante | total − Σ pagos registrados (los pagos anulados no cuentan) |
| Estado de pago | pendiente (sin pagos) · pagada parcialmente · pagada (saldo 0) — **se calcula**, no se guarda |
| Situación | por vencer · próxima a vencer (≤ 7 días) · vencida — **se calcula** con la fecha de vencimiento |
| Fecha de vencimiento | fecha de emisión + días de crédito (de la forma de pago del servicio o del cliente) |
| Periodo promedio de cobro | promedio de días entre emisión y último pago de los comprobantes que quedaron pagados en el período |
| % vencido | saldo vencido / saldo por cobrar × 100 |
| Antigüedad | saldo vencido en tramos 1–30, 31–60, 61–90 y más de 90 días |

El estado del comprobante (lo único que se guarda) es **emitida** o **anulada**. Un comprobante se anula con una **nota de crédito** que conserva el número original.

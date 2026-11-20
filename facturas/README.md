# Facturación y cuentas por cobrar (mejora 2)

Pantallas: **Facturación** (`#facturas`) y **Cuentas por cobrar** (`#cuentas`).

- Un comprobante (factura o boleta) agrupa uno o varios servicios **finalizados** del mismo cliente.
- La numeración sale de `series_comprobante` con bloqueo de fila: dos registros simultáneos nunca reciben el mismo número. Si el comprobante ya se emitió en SUNAT, puede escribirse el mismo número.
- Un comprobante se anula con una **nota de crédito** (series FC01/BC01) que conserva el número original; antes deben anularse sus pagos.
- Los pagos pueden ser parciales. Estado de pago (pendiente, parcial, pagada) y situación (por vencer, próxima, vencida) se calculan; no se guardan.
- Es un **registro de control interno**: la emisión electrónica oficial se realiza en SUNAT o en el proveedor autorizado.

| Endpoint | Uso |
|---|---|
| `facturas/index.php` | Comprobantes y servicios por facturar (GET; `?id=` para el detalle) |
| `facturas/emitir.php` | Registrar comprobante (POST) |
| `facturas/anular.php` | Anular con nota de crédito (POST) |
| `facturas/cuentas.php` | Cartera, antigüedad, alertas e indicadores (GET) |
| `facturas/pago.php` · `facturas/anular_pago.php` | Registrar o anular un pago (POST) |

Criterios de cálculo: [docs/CRITERIOS_FINANCIEROS.md](../docs/CRITERIOS_FINANCIEROS.md).

# 🚚 PORTAL DEL CLIENTE - VADEXSA LOGISTIC

**Fecha de creación:** 7 de octubre de 2026  
**Versión:** 1.0  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 DESCRIPCIÓN

Se ha creado un **Portal del Cliente** donde los clientes de VADEXSA pueden ver sus servicios, programación y reportes en tiempo real.

El diseño está basado **exactamente** en las imágenes de referencia proporcionadas.

---

## 🌐 CÓMO ACCEDER

### **URL del Portal:**
```
http://localhost/TransporteVadexa/frontend/portal.html
```

### **Vistas Disponibles:**

1. **Mis servicios** - `portal.html#servicios`
   - Seguimiento del servicio activo
   - Historial de servicios completo
   - Modal de detalle de servicio

2. **Programación** - `portal.html#programacion`
   - Programación diaria
   - Selector de fechas
   - Servicios programados

3. **Mis reportes** - `portal.html#reportes`
   - Reporte de servicios
   - Reporte de facturación
   - Cards con acceso a cada reporte

---

## 🎨 CARACTERÍSTICAS DEL DISEÑO

### **Header del Portal (Consistente en todas las vistas)**

```
┌────────────────────────────────────────────────────────────────┐
│ VADEXSA                 Mis servicios  Programación  Reportes  │
│ Logistic · Portal       ════════════                           │
│                                                   Cliente Demo  │
│                                              usuario@cliente.com│
└────────────────────────────────────────────────────────────────┘
```

- **Logo y tagline** izquierda
- **Navegación centrada** con tabs activos
- **Info del cliente** derecha

---

## 📱 VISTA 1: MIS SERVICIOS

### **Sección: Seguimiento de servicio activo**

```
┌─ Seguimiento de mi servicio ───────────────── [SERVICIO ACTIVO] ─┐
│                                                                    │
│  ORIGEN                          DESTINO ESTIMADO                 │
│  Puerto del Callao, Muelle Sur   Planta Industrial Lurín, Km 40  │
│  ═══════════════════════════════════════════════►                │
│                                                                    │
│  Salida              En Tránsito        Llegada                   │
│  08:45 - 08 OCT     Extraterrestre    12:30 (EST)                │
│                                                                    │
│  Vehículo           Guía Remitente                                │
│  V4X-882           GRR-001-98442          [Ver detalle completo]  │
└────────────────────────────────────────────────────────────────────┘
```

**Características:**
- ✅ Card con borde suave
- ✅ Badge "SERVICIO ACTIVO" celeste
- ✅ Barra de progreso visual (origen → destino)
- ✅ Grid de información organizada
- ✅ Botón "Ver detalle completo" azul corporativo

---

### **Sección: Historial de servicios**

```
┌─ Historial de servicios ──────────────────────────────────────────┐
│                                                                    │
│  [Todos]  [Finalizados]  [En facturación]       [Filtrar por fecha]│
│                                                                    │
│  FECHA     CARGA             ORIGEN/DESTINO      GUÍA    ESTADO   │
│  ─────────────────────────────────────────────────────────────── │
│  07 oct.   Bobinas de acero  Callao → Lima     GRT-001  COMPLETO │
│  09:15     24,5 toneladas                                 S/ 1,298 │
│  ─────────────────────────────────────────────────────────────── │
│  08 oct.   Perfiles          Alto Viconte →     GRT-002  LIQUID.  │
│  14:50     18 toneladas      Huachipa                     S/ 850  │
└────────────────────────────────────────────────────────────────────┘
```

**Características:**
- ✅ Tabs de filtro (Todos, Finalizados, En facturación)
- ✅ Botón "Filtrar por fecha" con icono de calendario
- ✅ Tabla profesional con headers uppercase
- ✅ Badges de estado con colores apropiados:
  - **Verde** - COMPLETADO
  - **Amarillo** - LIQUIDACIÓN
  - **Celeste** - EN RUTA
- ✅ Montos alineados a la derecha
- ✅ Flechita de detalle en cada fila

---

### **Modal: Detalle del servicio**

```
┌─ Detalle del servicio ────────────────────────────── [×] ─┐
│                                                            │
│  SV-00442 - Datos de ejemplo                              │
│  [EN RUTA]                                                 │
│                                                            │
│  Fecha y hora                    Tipo de carga            │
│  08 oct. 2026 - 08:45           Bobinas de acero          │
│                                                            │
│  Origen                          Destino                   │
│  Puerto del Callao, Muelle Sur   Planta Industrial Lurín  │
│                                                            │
│  Guía remitente                  Guía transportista       │
│  GRR-001-98442                   GRT-001-98442            │
│                                                            │
│  Comprobante                     Monto del servicio       │
│  F002-000451                     S/ 1,250.00              │
│                                                            │
│  Forma de pago                   Placa                     │
│  Transferencia - Pagado          V4X-882                  │
└────────────────────────────────────────────────────────────┘
```

**Características:**
- ✅ Modal centrado, fondo con overlay
- ✅ Botón cerrar (×) superior derecha
- ✅ Badge de estado
- ✅ Grid 2 columnas con labels y valores
- ✅ Labels en gris (#64748b)
- ✅ Valores en negro bold (#0f172a)

---

## 📅 VISTA 2: PROGRAMACIÓN

### **Layout**

```
┌─ Mi programación diaria ────────────────────────────────────────┐
│                                                                  │
│                  [←]  📅 08/10/2026  [→]  [Hoy]                 │
│                                                                  │
│  FECHA     CARGA             ORIGEN/DESTINO      GUÍA    ESTADO │
│  ────────────────────────────────────────────────────────────  │
│  08 oct.   Bobinas de acero  Puerto del Callao  GRT-001 EN RUTA│
│  08:45     24,5 toneladas    → Planta Lurín               S/1,450│
│                                                   PENDIENTE PAGO │
└──────────────────────────────────────────────────────────────────┘
```

**Características:**
- ✅ Selector de fecha con botones de navegación
- ✅ Botón "Hoy" para volver a fecha actual
- ✅ Misma tabla que historial
- ✅ Muestra solo servicios del día seleccionado

---

## 📊 VISTA 3: MIS REPORTES

### **Layout con Cards**

```
┌─ Mis reportes ───────────────────────────────────────────────────┐
│                                                                   │
│          Accede a tus reportes de servicios y facturación         │
│                                                                   │
│   ┌────────────────────┐          ┌────────────────────┐        │
│   │       🚚           │          │       📄           │        │
│   │                    │          │                    │        │
│   │    Servicios       │          │   Facturación      │        │
│   │                    │          │                    │        │
│   │  Historial de tus  │          │ Comprobantes,      │        │
│   │  servicios, rutas, │          │ reportes y formas  │        │
│   │  guías y estados.  │          │ de pago de tus     │        │
│   │                    │          │ servicios.         │        │
│   │  [Ver reporte]     │          │  [Ver reporte]     │        │
│   └────────────────────┘          └────────────────────┘        │
│                                                                   │
│   ────────────────────────────────────────────────────────────   │
│           VADEXSA LOGISTIC S.A.C. · Portal del cliente           │
│      ¿Necesitas ayuda? Contacta con tu ejecutivo de cuenta       │
└───────────────────────────────────────────────────────────────────┘
```

**Características:**
- ✅ Título centrado
- ✅ Subtítulo descriptivo
- ✅ Grid de 2 columnas con cards
- ✅ Iconos grandes (64px) en círculo celeste
- ✅ Cada card tiene:
  - Icono
  - Título
  - Descripción
  - Botón "Ver reporte"
- ✅ Footer con info de la empresa

---

## 🎨 PALETA DE COLORES

```css
/* Azul Corporativo Principal */
--azul-principal: #0284c7;      /* Badges, iconos, links */
--azul-oscuro: #1e40af;         /* Botones primarios */
--azul-claro: #eff6ff;          /* Fondos de iconos */
--azul-muy-claro: #dbeafe;      /* Badges de servicio activo */

/* Grises */
--gris-oscuro: #0f172a;         /* Texto principal */
--gris-medio: #475569;          /* Headers de tabla */
--gris-suave: #64748b;          /* Labels, texto secundario */
--gris-claro: #f8fafc;          /* Fondos */
--borde: #e2e8f0;               /* Bordes y separadores */

/* Estados */
--verde: #dcfce7;               /* Badge COMPLETADO */
--verde-texto: #15803d;
--amarillo: #fef3c7;            /* Badge LIQUIDACIÓN */
--amarillo-texto: #92400e;
```

---

## 📐 ESPECIFICACIONES TÉCNICAS

### **Typography**

```css
/* Headers */
h2: font-size: 18px; font-weight: 700;
h3: font-size: 16px; font-weight: 700;

/* Labels */
labels: font-size: 11px; font-weight: 600; text-transform: uppercase;

/* Valores */
valores: font-size: 14px; font-weight: 600;

/* Tabla */
table-header: font-size: 11px; font-weight: 700; uppercase;
table-cell: font-size: 13px;
```

### **Spacing**

```css
/* Padding */
card: 24px;
table-cell: 14px 16px;
button: 10px 20px;

/* Margin */
section: 24px;
elements: 16px - 20px;

/* Gap */
grid: 16px - 20px;
```

### **Borders & Shadows**

```css
border: 2px solid #e2e8f0;
border-radius: 8px;         /* Cards */
border-radius: 6px;         /* Buttons, inputs */
box-shadow: 0 1px 3px rgba(0,0,0,0.05);
```

---

## 🔗 NAVEGACIÓN

### **Tabs del Portal**

```javascript
// Las tabs están en el header y cambian el hash de la URL

Mis servicios → portal.html#servicios
Programación  → portal.html#programacion
Mis reportes  → portal.html#reportes
```

### **Links Internos**

- **Ver detalle completo** → Abre modal con detalle del servicio
- **Fila de tabla** → Click en cualquier fila abre el modal
- **Botones de reporte** → Futura implementación para generar PDFs

---

## 🔌 INTEGRACIÓN CON BACKEND

### **Endpoints Necesarios**

```php
// Servicio activo del cliente
GET /clientes/servicios.php?activo=1

// Historial de servicios del cliente
GET /clientes/servicios.php?cliente_id={id}

// Servicios por fecha (programación)
GET /clientes/servicios.php?fecha={YYYY-MM-DD}

// Detalle de un servicio específico
GET /servicios/index.php?id={id}
```

### **Respuesta Esperada (Servicio)**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "fecha_servicio": "2026-10-08",
    "hora_salida": "08:45",
    "origen": "Puerto del Callao, Muelle Sur",
    "destino": "Planta Industrial Lurín, Km 40",
    "placa": "V4X-882",
    "guia_remitente": "GRR-001-98442",
    "guia_transportista": "GRT-001-98442",
    "estado_servicio": "en_transito",
    "precio_cliente": 1250.00,
    "tipo_carga": "Bobinas de acero",
    "peso": "24,5 toneladas",
    "comprobante": "F002-000451"
  }
}
```

---

## ✅ CHECKLIST DE VALIDACIÓN

Para verificar que el portal funciona correctamente:

- [ ] **URL accesible** en `http://localhost/TransporteVadexa/frontend/portal.html`
- [ ] **Header consistente** en todas las vistas
- [ ] **Navegación funcional** entre tabs
- [ ] **Servicio activo** se muestra correctamente
- [ ] **Barra de progreso** visual funciona
- [ ] **Historial** carga y muestra datos
- [ ] **Tabs de filtro** cambian la visualización
- [ ] **Modal de detalle** se abre y cierra
- [ ] **Programación** muestra servicios del día
- [ ] **Selector de fecha** funciona
- [ ] **Mis reportes** muestra las 2 cards
- [ ] **Diseño responsive** en móvil y tablet

---

## 🚀 PRÓXIMOS PASOS

1. **Conectar con backend real** (actualmente usa datos de ejemplo)
2. **Sistema de autenticación** para clientes
3. **Notificaciones en tiempo real** del estado de servicios
4. **Generación de reportes PDF**
5. **Descarga de comprobantes**
6. **Chat de soporte** integrado
7. **Versión móvil nativa**

---

## 📞 SOPORTE

Para cualquier problema o ajuste adicional en el portal del cliente, consultar este documento.

**Versión:** 1.0  
**Última actualización:** 7 de octubre de 2026  
**Desarrollador:** Kiro AI

---

*Fin del documento*

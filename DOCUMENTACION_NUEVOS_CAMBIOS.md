# 🚚 Documentación de Nuevos Cambios en el Sistema — VADEXSA LOGISTIC

**Sistema:** VADEXSA LOGISTIC (TMS & ERP Enterprise)  
**Versión Actual:** 2.0 (Arquitectura SPA + Backend Híbrido)  
**Fecha de Actualización:** Octubre 2026  
**Rama:** `noemy`

---

## 📌 1. Resumen Ejecutivo de la Evolución

El sistema **VADEXSA LOGISTIC** ha experimentado una transformación profunda: pasó de ser una aplicación tradicional en PHP con recarga completa de páginas a una **plataforma empresarial moderna de gestión de transporte (TMS/ERP)** con arquitectura desacoplada:

1. **Frontend Desacoplado (Single Page Application - SPA):** Interfaz construida en JavaScript nativo modular (ES Modules) y CSS Vanilla optimizado, eliminando las recargas de página y ofreciendo una experiencia fluida y reactiva.
2. **Backend Híbrido y API RESTful:** Los controladores PHP existentes fueron modernizados para responder tanto en JSON estructurado (para la SPA y llamadas asíncronas) como en HTML convencional (para retrocompatibilidad).
3. **Nuevo Portal del Cliente:** Entorno web independiente (`portal.html`) donde los clientes pueden dar seguimiento en tiempo real a sus envíos activos, consultar programación y descargar reportes.
4. **Formulario de Servicios Reestructurado:** Rediseño integral del registro de servicios en 6 secciones corporativas claras, con cálculo automático de IGV, base imponible, control de modalidad (propio vs. tercerizado) y generación automática de correlativos.
5. **Asistente Virtual / Chatbot Inteligente:** Integración de un chatbot flotante conectado a la base de datos MySQL para responder consultas en tiempo real sobre servicios del día, facturación, gastos y conductores disponibles.
6. **Ejecutor Rápido en Windows:** Inclusión de scripts directos (`ABRIR_SISTEMA.bat` y `LINK_DE_ACCESO.html`) para inicialización inmediata en el entorno WAMP/XAMPP.

---

## 🗂️ 2. Historial de Commits y Evolución del Código

A través del historial del repositorio se documentan las siguientes etapas clave:

| Commit | Mensaje | Alcance del Cambio |
|---|---|---|
| `91993e8` | *primer commit* | Versión monolítica original en PHP con Bootstrap 5 básico y tablas DataTables por página. |
| `9dd2252` | *separacion del front y backend con un rediseño y implementacion de un link al local host* | Creación de la carpeta `frontend/`, sistema de estilos corporativo TMS (`css/app.css`), enrutador SPA (`js/router.js`), cliente de peticiones (`js/api.js`) y modernización de endpoints PHP con soporte JSON. |
| `0470666` | *formulario* | Rediseño y reorganización visual del formulario modal de servicios en 6 bloques temáticos corporativos con validaciones dinámicas. |
| `2279b7f` | *portal cliente* | Implementación del Portal del Cliente (`frontend/portal.html` y módulo `portal-cliente.js`), permitiendo vistas de rastreo activo, programación y reportes para usuarios clientes. |
| `77bd925` | *compelto* | Ajustes finales de integración, scripts de apertura rápida (`ABRIR_SISTEMA.bat`), mejoras en chatbot y consolidación de reportes. |

---

## 🏛️ 3. Nueva Arquitectura del Sistema

```
                      ┌──────────────────────────────────────────────┐
                      │              NAVEGADOR CLIENTE               │
                      └──────┬────────────────────────────────┬──────┘
                             │                                │
            (Administración / Operaciones)          (Portal Clientes)
                             │                                │
                             ▼                                ▼
                frontend/index.html                  frontend/portal.html
                             │                                │
                             └───────────────┬────────────────┘
                                             ▼
                             ┌────────────────────────────────┐
                             │       SPA CORE (Vanilla JS)    │
                             │  • router.js (Hash Router)     │
                             │  • api.js (Fetch HTTP Client)  │
                             │  • app.css (Diseño TMS)        │
                             └───────────────┬────────────────┘
                                             │ JSON asíncrono
                                             ▼
                             ┌────────────────────────────────┐
                             │      API / CONTROLADORES PHP   │
                             │  • config/conexion.php         │
                             │  • login/validar.php           │
                             │  • servicios/index.php, etc.   │
                             │  • chatbot/responder.php       │
                             └───────────────┬────────────────┘
                                             │ mysqli
                                             ▼
                             ┌────────────────────────────────┐
                             │       BASE DE DATOS MYSQL      │
                             │         transporte_db          │
                             └────────────────────────────────┘
```

### 3.1 Capa de Frontend (`/frontend`)
- **Arquitectura SPA sin frameworks pesados:** Utiliza JavaScript nativo con sintaxis de módulos ES6 (`import`/`export`), garantizando carga instantánea sin requerir pasos de compilación (`node_modules` o Webpack).
- **Enrutamiento por Hash:** El enrutador (`router.js`) detecta cambios de `#hash` en la URL (`#dashboard`, `#servicios`, `#clientes`, etc.) y renderiza dinámicamente el contenedor `<div id="tms-content-container">`.
- **Cliente API Centralizado (`api.js`):** Gestiona todas las llamadas HTTP (`GET`, `POST`, `PUT`, `DELETE`), serialización automática de JSON, cabeceras de sesión PHP y manejo centralizado de errores.
- **Sistema de Alertas Toast:** Notificaciones flotantes animadas no bloqueantes (`showToast()`) para operaciones exitosas, advertencias y errores.
- **Exportación Universal:** Motor en JavaScript para exportación de tablas directamente a formato CSV / Excel compatible.

### 3.2 Capa de Backend (`/config`, `/servicios`, etc.)
- **Control Centralizado (`config/conexion.php`):**
  - Configuración automática de cabeceras CORS (`Access-Control-Allow-Origin`).
  - Codificación de caracteres `utf8mb4`.
  - Función `json_response($data, $status)` estandarizada para responder en formato JSON.
  - Función `get_request_data()` que soporta indistintamente `php://input` (cuerpo JSON en llamadas fetch) o formularios estándar `$_POST`/`$_GET`.
  - Middleware de sesión `require_auth()` con respuesta HTTP `401 Unauthorized` si no existe sesión válida.

---

## 🌟 4. Detalle de los Nuevos Módulos y Funcionalidades

### 4.1 Nuevo Diseño TMS & ERP Enterprise
Se sustituyó la apariencia estándar por una interfaz de software logístico de alta gama:
- **Sidebar Izquierdo Oscuro (`#121927`):**
  - Logotipo y membrete empresarial *VADEXSA LOGISTIC TMS & ERP Enterprise*.
  - Tarjeta de usuario activo con avatar y rol asignado.
  - **Widget en Vivo de Tipo de Cambio:** Muestra la fecha del día y los valores referenciales de compra y venta de divisas (Compra: 3.426 / Venta: 3.435).
  - Menú estructurado por áreas: *Principal, Operaciones, Catálogos & Flota, Finanzas & Gastos, y Cuenta*.
- **Topbar Superior Corporativo:**
  - Identificación formal de la empresa: `RUC: 20604629293 - VADEXSA LOGISTIC S.A.C.`.
  - Indicador rápido de tipo de cambio de venta.
  - Perfil del usuario activo y botón de cierre de sesión seguro.

---

### 4.2 Módulo de Servicios y Liquidaciones (`#servicios`)
El núcleo operativo del sistema fue completamente repotenciado:
1. **Navegación por Pestañas:**
   - **Viajes sin liquidar:** Visualiza servicios pendientes o en curso.
   - **Liquidaciones y Finalizados:** Visualiza servicios concluidos con liquidación financiera.
2. **Barra de Acciones Rápidas:**
   - Botón *Nuevo Servicio* con apertura de modal corporativo.
   - Botón *Actualizar* para recargar datos en segundo plano.
   - Botón *Imprimir* y botón *Excel* para descarga inmediata en formato de hoja de cálculo.
   - Barra de búsqueda en tiempo real que filtra por cliente, placa de vehículo, conductor o guía de remisión.
3. **Formulario Modal Reorganizado en 6 Secciones:**
   El formulario original fue desglosado en un diseño con encabezados en degradado azul marino y badges:
   - **Sección 1 — Asignación de Recursos:** Selección interrelacionada de Vehículo (Placa), Cliente y Conductor.
   - **Sección 2 — Detalles del Servicio:** Tipo de Servicio (Local, Provincia, Mudanza, Distribución, Especial), Tipo de Carga (General, Frágil, Refrigerada, Maquinaria, Enseres), Modalidad (*Propio* o *Tercerizado*) y Forma de Pago (Contado, Crédito 15 días, Crédito 30 días, Contra entrega).
   - **Sección 3 — Ruta del Servicio:** Origen y Destino con validación obligatoria.
   - **Sección 4 — Información Financiera:**
     - Campo *Precio Cliente* con resaltado en verde.
     - Campo *Costo Proveedor* con habilitación dinámica: si la modalidad es *Propio*, el costo se bloquea y se fija en 0; si es *Tercerizado*, se habilita para registrar el flete pagado al tercero.
     - *Tipo de Comprobante* (FACTURA, BOLETA, SIN COMPROBANTE).
     - Cálculo automático en tiempo real de **Base Imponible** y **18% de IGV**.
     - Generación y asignación correlativa del comprobante.
   - **Sección 5 — Guías y Documentación:**
     - Registro de *Guía Remitente* del cliente.
     - Generación automática de la *Guía Transportista* con formato correlativo `GRT-XXXXXX`.
   - **Sección 6 — Información del Servicio:** Fecha del servicio, hora y selector de estado con colores distintivos (*Programado*, *En Ruta*, *Finalizado / Liquidado*, *Cancelado*).

---

### 4.3 Portal del Cliente (`frontend/portal.html`)
Diseñado para que los clientes consulten el estado de sus operaciones de forma autónoma sin acceder a la administración interna:
1. **Header Especializado:** Logotipo corporativo, navegación limpia por pestañas y datos de la empresa cliente en la esquina superior.
2. **Vista "Mis Servicios":**
   - **Tarjeta de Seguimiento Activo:** Indicador visual de la ruta en curso con barra de progreso gráfico (Origen $\rightarrow$ Destino), tiempos estimados de salida/llegada, placa del vehículo asignado y guía remitente.
   - **Historial Completo:** Tabla de servicios con filtros por estado (*Todos*, *Finalizados*, *En facturación*) y filtro por calendario.
   - **Modal de Detalle Completo:** Ficha detallada con datos completos de origen, destino, guías, tipo de carga, comprobante y monto.
3. **Vista "Programación":** Selector dinámico de fecha con botones de navegación (Día anterior, Día siguiente, Hoy) para revisar los viajes programados para cada jornada.
4. **Vista "Mis Reportes":** Tarjetas interactivas con acceso a Reporte de Servicios y Reporte de Facturación.

---

### 4.4 Asistente Virtual Inteligente / Chatbot TMS
Incorporado en la esquina inferior derecha mediante un botón flotante (FAB):
- **Consultas Rápidas (Chips):**
  - `📅 Hoy`: Lista en segundos los servicios programados para la fecha actual con hora, origen, destino y placa.
  - `💰 Facturación`: Calcula y muestra el total facturado en el mes calendario en curso y el número de servicios emitidos.
  - `🧑‍✈️ Conductores`: Informa sobre la disponibilidad de conductores para la jornada.
  - `⛽ Gastos`: Resume los gastos operativos y administrativos del mes.
- **Consultas por Lenguaje Natural:**
  - Consulta del estado de cualquier servicio escribiendo su número (ej. *"estado del servicio #5"*).
  - Consultas sobre utilidad del mes, lista de flota y clientes.
  - Conectado directamente a la base de datos a través de `chatbot/responder.php`.

---

### 4.5 Módulos de Catálogos, Gastos y Finanzas
- **Programación Diaria (`#programacion`):** Vista de itinerario diario con control de estados en un solo clic (*Programado* $\rightarrow$ *En Ruta* $\rightarrow$ *Finalizado*).
- **Clientes (`#clientes`):** Directorio de clientes con clasificación por tipo (Empresa / Persona), RUC/DNI, contacto e historial acumulado de servicios contratados.
- **Vehículos / Flota (`#vehiculos`):** Registro de placas, marca, modelo, tipo de unidad, capacidad en toneladas/m3, vigencia de SOAT y revisión técnica.
- **Conductores (`#conductores`):** Gestión de choferes, número de licencia, categoría de brevete, teléfono y estado operativo.
- **Proveedores (`#proveedores`):** Registro de transportistas tercerizados, RUC y teléfonos de contacto.
- **Gastos Operativos y Administrativos (`#gastos-operativos` y `#gastos-admin`):**
  - Módulo dual para control de salidas de dinero.
  - Filtro por mes y año.
  - Agrupación por categorías (Combustible, Peajes, Mantenimiento, Viáticos, Sueldos, Alquiler, etc.).
  - Totalización automática de egresos.

---

### 4.6 Centro de Reportes Analíticos (`#reportes`)
Panel de inteligencia de negocio con 4 vistas de reporte:
1. **Reporte de Servicios:** Filtro por rango de fechas (Desde / Hasta) con exportación a Excel e impresión.
2. **Reporte de Facturación:** Resumen consolidado mensual de facturas y boletas emitidas con desglose de base imponible e IGV.
3. **Reporte de Utilidad Neta:** Comparativo de Ingresos Facturados vs. Gastos Totales (Operativos + Administrativos) con cálculo automático del margen de ganancia.
4. **Reporte por Cliente:** Ranking de clientes con mayor volumen de carga y facturación acumulada.

---

## 📁 5. Estructura de Archivos del Proyecto

```
c:\wamp64\www\TransporteVadexa\
│
├── ABRIR_SISTEMA.bat              # Script Windows para inicio con 1 clic en el navegador
├── DOCUMENTACION.md               # Documentación histórica inicial
├── DOCUMENTACION_NUEVOS_CAMBIOS.md# Este documento
├── PORTAL_DEL_CLIENTE.md          # Especificaciones técnicas del Portal del Cliente
│
├── frontend/                      # NUEVO: Capa SPA independiente
│   ├── index.html                 # Punto de entrada de la aplicación administrativa
│   ├── portal.html                # Punto de entrada del Portal del Cliente
│   ├── test_form.html             # Entorno de pruebas para validación de formulario
│   ├── LINK_DE_ACCESO.html        # Enlace HTML con redirección automática
│   ├── ACCESO_DIRECTO.url         # Acceso directo de escritorio
│   │
│   ├── css/
│   │   └── app.css                # Sistema de diseño TMS completo (1000+ líneas CSS)
│   │
│   └── js/
│       ├── router.js              # Enrutador SPA basado en rutas hash
│       ├── api.js                 # Cliente HTTP fetch y utilidades (formato, toasts, excel)
│       └── modules/               # Módulos funcionales de la aplicación
│           ├── auth.js            # Control de inicio de sesión y verificación de sesión
│           ├── dashboard.js       # Métricas y KPIs del mes
│           ├── servicios.js       # Gestión de servicios, liquidaciones y modal en 6 pasos
│           ├── portal-cliente.js  # Módulo del Portal del Cliente (seguimiento, rutas, reportes)
│           ├── programacion.js    # Programación diaria e itinerarios
│           ├── clientes.js        # CRUD y directorio de clientes
│           ├── vehiculos.js       # CRUD de flota de transporte
│           ├── conductores.js     # CRUD de choferes
│           ├── proveedores.js     # CRUD de empresas de transporte terceras
│           ├── gastos.js          # Control de gastos operativos y administrativos
│           ├── reportes.js        # Centro de reportes con filtros y exportaciones
│           └── chatbot.js         # Asistente virtual flotante
│
├── config/
│   └── conexion.php               # Conexión MySQL + Funciones JSON, CORS y sesión
│
├── chatbot/
│   └── responder.php              # Procesador de lenguaje natural y consultas a BD
│
├── login/
│   ├── validar.php                # Endpoint de autenticación (soporta action=check / JSON)
│   └── logout.php                 # Cierre de sesión PHP
│
├── dashboard/index.php            # Endpoint y vista de métricas (KPIs)
├── servicios/                     # Endpoints de servicios (index, guardar, actualizar, etc.)
├── clientes/                      # Endpoints de clientes
├── conductores/                   # Endpoints de conductores
├── vehiculos/                     # Endpoints de flota
├── proveedores/                   # Endpoints de proveedores
├── gastos_operativos/             # Endpoints de gastos operativos
├── gastos_administrativos/        # Endpoints de gastos administrativos
└── reportes/                      # Endpoints de reportes
```

---

## 🔌 6. Mapeo de Endpoints y Comunicación de la API

| Módulo | Endpoint PHP | Método | Parámetros Clave | Respuesta JSON |
|---|---|---|---|---|
| **Autenticación** | `login/validar.php?action=check` | `GET` | - | Verifica si la sesión está activa y retorna datos del usuario. |
| **Login** | `login/validar.php` | `POST` | `usuario`, `password` | Autentica y genera sesión PHP. |
| **Dashboard** | `dashboard/index.php` | `GET` | `mes`, `anio` | KPIs del mes, sumatoria de gastos, utilidad y servicios recientes. |
| **Servicios (Listar)**| `servicios/index.php` | `GET` | `fecha`, `estado`, `cliente_id` | Lista de servicios con joins a clientes, vehículos y conductores. |
| **Servicio (Por ID)** | `servicios/index.php` | `GET` | `id` | Detalle completo de un servicio específico. |
| **Servicio (Crear)** | `servicios/guardar.php` | `POST` | Datos del formulario | Inserta servicio, calcula IGV, valida duplicidad y genera guías. |
| **Servicio (Editar)**| `servicios/actualizar.php`| `POST` | `id` + datos editados | Actualiza servicio existente. |
| **Servicio (Estado)**| `servicios/cambiar_estado.php`| `GET/POST`| `id`, `estado` | Cambia estado (`en_ruta`, `finalizado`, etc.). |
| **Chatbot** | `chatbot/responder.php` | `POST` | `pregunta` | Procesa texto y devuelve respuesta informativa de la base de datos. |
| **Gastos Operativos**| `gastos_operativos/index.php`| `GET` | `mes`, `anio` | Listado y sumatoria de gastos operativos. |
| **Gastos Admin** | `gastos_administrativos/index.php`| `GET` | `mes`, `anio` | Listado y sumatoria de gastos administrativos. |
| **Reportes** | `reportes/servicios.php` | `GET` | `desde`, `hasta` | Reporte consolidado por rango de fechas. |

---

## 🚀 7. Instrucciones para Ejecutar y Probar el Sistema

### Requisitos Previos:
- Tener en ejecución **WampServer** o **XAMPP** (con los servicios de Apache y MySQL activos).
- Base de datos `transporte_db` importada en MySQL.

### Modo 1: Ejecución Directa (Recomendada)
Hacer doble clic sobre el archivo ejecutable en la raíz del proyecto:
```bat
c:\wamp64\www\TransporteVadexa\ABRIR_SISTEMA.bat
```
El script abrirá automáticamente el navegador en:
```
http://localhost/TransporteVadexa/frontend/
```

### Modo 2: Acceso Directo por URL en el Navegador
- **Módulo Administrativo / Operaciones:**  
  `http://localhost/TransporteVadexa/frontend/`
- **Portal del Cliente:**  
  `http://localhost/TransporteVadexa/frontend/portal.html`
- **Página de Prueba del Formulario:**  
  `http://localhost/TransporteVadexa/frontend/test_form.html`

### Credenciales de Acceso Predeterminadas:
- **Usuario:** `admin` (o usuario registrado en la tabla `usuarios`)
- **Contraseña:** contraseña configurada en base de datos (con encriptación MD5)

---

## 📊 8. Matriz Comparativa: Sistema Anterior vs. Sistema Nuevo

| Aspecto | Versión Anterior (Monolito PHP) | Versión Nueva (VADEXSA 2.0 SPA + API) |
|---|---|---|
| **Experiencia de Usuario** | Recarga completa y parpadeo de pantalla en cada clic. | Navegación fluida e instantánea (SPA) con transiciones suaves. |
| **Diseño Visual** | Plantilla Bootstrap estándar sin identidad de marca. | Diseño TMS / ERP profesional con paleta corporativa y tema oscuro. |
| **Formulario de Servicios** | Formulario lineal largo sin separación visual. | Modal en 6 secciones ordenadas por proceso logístico con iconos. |
| **Cálculo Financiero** | Cálculo manual de IGV y montos. | Cálculo automático instantáneo de Base Imponible y 18% IGV al escribir. |
| **Modalidad de Transporte**| Manejo estático del costo de transporte. | Bloqueo automático a costo S/ 0 si es Propio; editable si es Tercerizado. |
| **Atención al Cliente** | No existía vista para clientes finales. | **Portal del Cliente** con seguimiento visual de rutas y reportes. |
| **Asistencia Operativa** | Búsqueda manual en tablas. | **Chatbot Inteligente** con botones rápidos para consultas en tiempo real. |
| **Exportación** | Limitada a las opciones de DataTables. | Motor directo a Excel CSV con codificación UTF-8 en cada tabla. |
| **Arquitectura de Código** | Código PHP y HTML fuertemente acoplados. | Separación Frontend / Backend con API reutilizable. |

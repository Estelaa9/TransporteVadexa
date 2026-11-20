# Instalación y despliegue

## Entorno local (WampServer)

1. Iniciar WampServer (Apache y MySQL).
2. Opcional: copiar `config/env.example.php` como `config/env.php` y ajustar credenciales. Sin ese archivo se usa `root` sin contraseña en `localhost`, solo apto para desarrollo.
3. Abrir `http://localhost/TransporteVadexa/frontend/`.
4. **La primera petición migra la base automáticamente** (tabla `schema_version`). También se puede ejecutar a mano: `php migrations/migrar.php`. El comando muestra las observaciones de la migración (por ejemplo, índices únicos que no se crearon por datos repetidos).
5. Iniciar sesión con el administrador existente (`admin` / `admin123`). Se conserva esa contraseña; **cámbiela en *Mi cuenta* antes de publicar el sistema en producción**. Las cuentas nuevas sí deben cambiar su contraseña inicial en el primer ingreso.

> Antes del primer arranque en una base con datos reales, haga un respaldo (`scripts/respaldo.bat`).

## Producción (pendiente de infraestructura: SEG-18, SEG-29, INF-01, INF-02)

Estos puntos dependen del servidor, no del código. El código ya está preparado para ellos.

| Requisito | Cómo |
|---|---|
| HTTPS (SEG-18) | Certificado TLS (Let's Encrypt). `.htaccess` ya redirige a HTTPS cualquier dominio distinto de `localhost`, y el sistema envía HSTS y marca la cookie como `Secure` cuando la conexión es HTTPS. |
| Versiones con soporte (SEG-29) | PHP 8.3 o superior y MySQL 8.4 LTS. Probado con PHP 8.3.28 y MySQL 8.4.7. |
| Usuario de base de datos propio (SEG-04) | Ver `config/env.example.php`. La aplicación necesita SELECT, INSERT, UPDATE y DELETE; las migraciones necesitan además CREATE, ALTER, INDEX y REFERENCES (ejecutarlas una vez con un usuario administrador). |
| Credenciales fuera del código (SEG-05) | `config/env.php`, excluido del repositorio. La carpeta `config/` no es accesible por web. |
| Errores (SEG-21, ARQ-06) | `debug => false`. El detalle queda en `logs/php-error-AAAA-MM.log` (no accesible por web, un archivo por mes). |
| Entornos separados (INF-02) | Una base y un `config/env.php` por entorno (`transporte_db` en producción, una copia para pruebas). |
| Respaldos (SEG-25) | `scripts/respaldo.bat` diario con el Programador de tareas, retención de 30 días y copia externa. Probar la restauración una vez al mes en una base de prueba: `mysql -u root transporte_db_prueba < respaldo.sql`. |
| Archivos de desarrollo (SEG-20, INF-03) | `.htaccess` bloquea `.bat`, `.md`, `.url` y `LINK_DE_ACCESO.html`. No copiarlos al servidor de producción. |
| Control de versiones (INF-04) | Ramas `main` (producción) y `develop`; etiquetar cada versión (`git tag v2.2`). |

## Pruebas

```bash
# Pruebas unitarias del frontend
node --test tests/*.mjs

# Pruebas de integración de la API (usar SIEMPRE una copia de la base)
mysqldump -u root transporte_db | mysql -u root transporte_db_prueba
VADEXSA_DB_NAME=transporte_db_prueba php -S 127.0.0.1:8099 -t .
php tests/api.integration.php http://127.0.0.1:8099 admin <clave>
```

`tests/api.integration.php` cubre las 13 pruebas de la sección 5 de la auditoría que no dependen de infraestructura (todas menos HTTPS y restauración de respaldo) y los flujos de las tres mejoras.

Pendiente recomendado (QA-02): escaneo con OWASP ZAP antes de publicar el portal.

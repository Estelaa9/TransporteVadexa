@echo off
setlocal
chcp 65001 >nul

title VADEXSA LOGISTIC - Iniciando Sistema

echo ========================================================
echo   Iniciando VADEXSA LOGISTIC - Modulo Web Frontend
echo ========================================================
echo.
for %%I in ("%~dp0.") do set "PROJECT_NAME=%%~nxI"
set "APP_URL=http://localhost/%PROJECT_NAME%/frontend/#login"
set "HEALTH_URL=http://localhost/%PROJECT_NAME%/frontend/"

ping -n 2 127.0.0.1 >nul

echo Verificando que el sistema este disponible...
powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; try { $r = Invoke-WebRequest -Uri '%HEALTH_URL%' -TimeoutSec 5 -UseBasicParsing; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { exit 0 } } catch {}; exit 1" >nul 2>&1
if errorlevel 1 (
    echo.
    echo No se pudo acceder a la URL web del sistema.
    echo Verifica que WampServer y Apache esten activos.
    echo Ruta esperada: %HEALTH_URL%
    echo.
    pause
    exit /b 1
)

echo.
echo URL del sistema:
echo %APP_URL%
echo.
echo Abriendo el navegador en la pantalla de acceso...
start "" "%APP_URL%"
if errorlevel 1 (
    echo No se pudo abrir el navegador automaticamente.
    echo Copia esta URL manualmente en tu navegador:
    echo %APP_URL%
    pause
    exit /b 1
)

echo Sistema ejecutado con exito.
exit /b 0

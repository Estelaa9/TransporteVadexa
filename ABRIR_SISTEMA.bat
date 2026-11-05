@echo off
setlocal
title VADEXSA LOGISTIC - Iniciando Sistema
echo ========================================================
echo   Iniciando VADEXSA LOGISTIC - Modulo Web Frontend
echo ========================================================
echo.
for %%I in ("%~dp0.") do set "PROJECT_NAME=%%~nxI"
set "SYSTEM_URL=http://localhost/%PROJECT_NAME%/frontend/"

echo Comprobando que el servidor web este disponible...
powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; try { $response = Invoke-WebRequest -Uri '%SYSTEM_URL%' -TimeoutSec 5 -UseBasicParsing; if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) { exit 1 } } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo No se pudo acceder a %SYSTEM_URL%
    echo Inicie Apache en WampServer y vuelva a ejecutar este archivo.
    pause
    exit /b 1
)

echo Abriendo el navegador en la ruta del frontend...
echo Ruta: %SYSTEM_URL%
echo.
start "" "%SYSTEM_URL%"
if errorlevel 1 (
    echo No se pudo abrir el navegador.
    pause
    exit /b 1
)

echo Sistema ejecutado con exito.
exit /b 0

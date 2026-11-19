@echo off
REM SEG-25: respaldo diario de la base de datos con retención de 30 días.
REM Programarlo una vez (como administrador) con el Programador de tareas:
REM   schtasks /create /tn "VADEXSA respaldo" /tr "C:\wamp64\www\TransporteVadexa\scripts\respaldo.bat" /sc daily /st 23:30
REM Ajuste las variables siguientes. COPIA_EXTERNA debe estar en otro disco o en una carpeta sincronizada con la nube.
setlocal
set MYSQL_BIN=C:\wamp64\bin\mysql\mysql8.4.7\bin
set DB=transporte_db
set DB_USER=root
set DB_PASS=
set DESTINO=C:\respaldos\vadexsa
set COPIA_EXTERNA=

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmm"') do set FECHA=%%i
if not exist "%DESTINO%" mkdir "%DESTINO%"
set ARCHIVO=%DESTINO%\%DB%_%FECHA%.sql

if "%DB_PASS%"=="" (
  "%MYSQL_BIN%\mysqldump.exe" -u%DB_USER% --single-transaction --routines --triggers --default-character-set=utf8mb4 %DB% > "%ARCHIVO%"
) else (
  "%MYSQL_BIN%\mysqldump.exe" -u%DB_USER% -p%DB_PASS% --single-transaction --routines --triggers --default-character-set=utf8mb4 %DB% > "%ARCHIVO%"
)
if errorlevel 1 (
  echo [%date% %time%] ERROR al respaldar %DB% >> "%DESTINO%\respaldo.log"
  exit /b 1
)
powershell -NoProfile -Command "Compress-Archive -Path '%ARCHIVO%' -DestinationPath '%ARCHIVO%.zip' -Force; Remove-Item '%ARCHIVO%'"
if not "%COPIA_EXTERNA%"=="" copy /y "%ARCHIVO%.zip" "%COPIA_EXTERNA%\" >nul
powershell -NoProfile -Command "Get-ChildItem '%DESTINO%\*.zip' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item"
echo [%date% %time%] OK %ARCHIVO%.zip >> "%DESTINO%\respaldo.log"
endlocal

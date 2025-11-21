@echo off
setlocal
cd /d "%~dp0"

rem Choose Python launcher if available, else fall back to python
where py >nul 2>nul
if %errorlevel%==0 (
  set "PYCMD=py -3"
) else (
  set "PYCMD=python"
)

set "HOST=0.0.0.0"
set "PORT=5000"
set "THREADS=8"

echo Starting Doctor Schedule app bound to all interfaces (network accessible)...

for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp -ErrorAction SilentlyContinue | Where-Object {$_.IPAddress -notlike '169.*'} | Select-Object -First 1 -ExpandProperty IPAddress) -or (Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Manual -ErrorAction SilentlyContinue | Where-Object {$_.IPAddress -notlike '169.*'} | Select-Object -First 1 -ExpandProperty IPAddress)"`) do set LANIP=%%i

echo.
echo Access from this PC:          http://127.0.0.1:%PORT%/display
if not "%LANIP%"=="" echo Access from hospital PCs:  http://%LANIP%:%PORT%/display
echo.

%PYCMD% run_waitress.py

if %errorlevel% neq 0 (
  echo.
  echo The app failed to start. Make sure dependencies are installed:
  echo    %PYCMD% -m pip install -r requirements.txt
  echo.
  pause
  exit /b %errorlevel%
)

endlocal

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

echo Starting Doctor Schedule app (no Telegram)...
echo If you see a warning about SECRET_KEY, a temporary one will be generated for this session.
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

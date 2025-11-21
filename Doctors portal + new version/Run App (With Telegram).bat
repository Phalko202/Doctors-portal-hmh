@echo off
setlocal
cd /d "%~dp0"

rem Prompt for Telegram settings if not already set in environment
set "ENABLE_TELEGRAM=true"
if "%TELEGRAM_BOT_TOKEN%"=="" (
  set /p TELEGRAM_BOT_TOKEN=Enter TELEGRAM_BOT_TOKEN (paste): 
)
if "%TELEGRAM_GROUP_ID%"=="" (
  set /p TELEGRAM_GROUP_ID=Enter TELEGRAM_GROUP_ID (chat id): 
)

rem Choose Python launcher if available, else fall back to python
where py >nul 2>nul
if %errorlevel%==0 (
  set "PYCMD=py -3"
) else (
  set "PYCMD=python"
)

echo Starting Doctor Schedule app WITH Telegram...
echo.
set "ENABLE_TELEGRAM=true"
set "TELEGRAM_BOT_TOKEN=%TELEGRAM_BOT_TOKEN%"
set "TELEGRAM_GROUP_ID=%TELEGRAM_GROUP_ID%"
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

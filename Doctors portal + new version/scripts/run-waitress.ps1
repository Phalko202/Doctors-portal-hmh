# Run the app with Waitress in the foreground (Ctrl+C to stop)
# Reads HOST/PORT from environment or .env if present
param(
  [string]$ListenHost = "0.0.0.0",
  [int]$Port = 5000,
  [int]$Threads = 8,
  [switch]$EnableTelegram,
  [string]$BotToken = "",
  [string]$GroupId = "",
  [string]$AdminToken = ""
)
$ErrorActionPreference = "Stop"

if(-not $env:SECRET_KEY){
  Write-Host "SECRET_KEY not set. Generating a temporary one for this session..." -ForegroundColor Yellow
  $env:SECRET_KEY = -join ((1..32) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 256) })
}

$env:FLASK_APP = 'app.py'
$env:HOST = $ListenHost
$env:PORT = $Port
$env:THREADS = "$Threads"

if($AdminToken){ $env:ADMIN_TOKEN = $AdminToken }
if($EnableTelegram){
  $env:ENABLE_TELEGRAM = 'true'
  if($BotToken){ $env:TELEGRAM_BOT_TOKEN = $BotToken }
  if($GroupId){ $env:TELEGRAM_GROUP_ID = $GroupId }
}

python run_waitress.py

# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/setup-env.ps1 -SecretKey "<random>" -EnableTelegram $true -BotToken "<token>" -GroupId "-123456789" -AcceptAny $false -ExtraChats "-111111111,-22222222"
# If you omit telegram flags, telemetry is disabled.
param(
  [string]$SecretKey = "",
  [bool]$EnableTelegram = $false,
  [string]$BotToken = "",
  [string]$GroupId = "",
  [bool]$AcceptAny = $false,
  [string]$ExtraChats = "",
  [string]$AdminToken = ""
)

function Set-EnvVar($name, $value){
  if([string]::IsNullOrWhiteSpace($value)){ return }
  # Set for current process and persist for the machine
  $env:$name = $value
  setx $name $value /M | Out-Null
  Write-Host "Set $name"
}

if([string]::IsNullOrWhiteSpace($SecretKey)){
  # Generate a 32-byte random hex if not provided
  $SecretKey = -join ((1..32) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 256) })
}

Set-EnvVar -name "SECRET_KEY" -value $SecretKey
Set-EnvVar -name "FLASK_APP" -value "app.py"

if($AdminToken){ Set-EnvVar -name "ADMIN_TOKEN" -value $AdminToken }

if($EnableTelegram){
  Set-EnvVar -name "ENABLE_TELEGRAM" -value "true"
  if($BotToken){ Set-EnvVar -name "TELEGRAM_BOT_TOKEN" -value $BotToken }
  if($GroupId){ Set-EnvVar -name "TELEGRAM_GROUP_ID" -value $GroupId }
  if($AcceptAny){ Set-EnvVar -name "TELEGRAM_ACCEPT_FROM_ANY" -value "true" }
  if($ExtraChats){ Set-EnvVar -name "TELEGRAM_CHAT_IDS" -value $ExtraChats }
} else {
  Set-EnvVar -name "ENABLE_TELEGRAM" -value "false"
}

Write-Host "\nEnvironment variables configured. Open a NEW PowerShell window before starting Flask." -ForegroundColor Green

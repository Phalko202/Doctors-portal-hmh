# Interactive helper to enable Telegram in .env
# Prompts for bot token and group id, writes/updates .env with ENABLE_TELEGRAM=true
# Usage: powershell -ExecutionPolicy Bypass -File scripts/setup-telegram.ps1

$ErrorActionPreference = 'Stop'

$envPath = Join-Path (Get-Location) '.env'

if(-not (Test-Path $envPath)){
  New-Item -ItemType File -Path $envPath -Force | Out-Null
}

$token = Read-Host 'Enter TELEGRAM_BOT_TOKEN'
$group = Read-Host 'Enter TELEGRAM_GROUP_ID (e.g., -4971636946)'

# Load existing lines
$lines = Get-Content -LiteralPath $envPath -ErrorAction SilentlyContinue
if(-not $lines){ $lines = @() }

# Helper to upsert key=value
function Set-Line($arr, $key, $value){
  $pattern = "^$key\s*="
  $idx = ($arr | ForEach-Object {$_}) | Select-String -Pattern $pattern -SimpleMatch -CaseSensitive | ForEach-Object { $_.LineNumber - 1 }
  if($idx -ne $null -and $idx.Count -gt 0){
    foreach($i in $idx){ $arr[$i] = "$key=$value" }
  } else {
    $arr += "$key=$value"
  }
  return ,$arr
}

$lines = Set-Line $lines 'ENABLE_TELEGRAM' 'true'
$lines = Set-Line $lines 'TELEGRAM_BOT_TOKEN' $token
$lines = Set-Line $lines 'TELEGRAM_GROUP_ID' $group

Set-Content -LiteralPath $envPath -Value $lines -Encoding UTF8

Write-Host ".env updated with Telegram settings. Restart the app to apply." -ForegroundColor Green

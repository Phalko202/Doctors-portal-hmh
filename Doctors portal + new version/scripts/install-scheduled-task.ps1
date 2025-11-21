# Registers a Windows Scheduled Task to run the app with Waitress at startup.
# Requires Administrator.
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/install-scheduled-task.ps1 -TaskName "DoctorSchedule" -WorkingDir "C:\path\to\project" -Port 5000 -Host "0.0.0.0"
param(
  [string]$TaskName = "DoctorSchedule",
  [string]$WorkingDir = (Get-Location).Path,
  [string]$ListenHost = "0.0.0.0",
  [int]$Port = 5000,
  [int]$Threads = 8,
  [switch]$EnableTelegram
)

$ErrorActionPreference = "Stop"

# Ensure python is available in PATH for the service account.
$python = (Get-Command python -ErrorAction SilentlyContinue)
if(-not $python){ throw "Python not found in PATH. Install Python and re-run." }

# The action will run PowerShell to invoke run-waitress.ps1 with parameters.
$ps = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$scriptPath = Join-Path $WorkingDir "scripts\run-waitress.ps1"
$arguments = "-ExecutionPolicy Bypass -File `"$scriptPath`" -ListenHost `"$ListenHost`" -Port $Port -Threads $Threads"
if($EnableTelegram){ $arguments += " -EnableTelegram" }

$action = New-ScheduledTaskAction -Execute $ps -Argument $arguments -WorkingDirectory $WorkingDir
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

# Register for the local machine (requires admin). Run as the current user by default; adjust as needed.
try{
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -Force | Out-Null
  Write-Host "Scheduled Task '$TaskName' installed." -ForegroundColor Green
  Write-Host "Make sure environment variables (SECRET_KEY, ENABLE_TELEGRAM, TELEGRAM_*, etc.) are set for the machine and then reboot or start the task manually." -ForegroundColor Yellow
}catch{
  Write-Error $_
  throw
}

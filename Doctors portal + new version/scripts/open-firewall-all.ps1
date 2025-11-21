# OPTIONAL: Open Windows Firewall for inbound TCP port on all profiles (Domain, Private, Public).
# Requires Administrator. Use only if your IT policy allows exposing this port broadly.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/open-firewall-all.ps1 -Port 5000 -RuleName "DoctorSchedule Open All"
param(
  [int]$Port = 5000,
  [string]$RuleName = "DoctorSchedule Open All"
)

$ErrorActionPreference = 'Stop'

# Remove old rule if exists
Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue | Out-Null

# Create inbound allow rule for all profiles and any remote address
New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -Profile Any -RemoteAddress Any | Out-Null

Write-Host "Firewall rule '$RuleName' created: TCP $Port on All profiles (Domain/Private/Public)." -ForegroundColor Yellow

# Configure Windows Firewall for LAN-only access to the app port.
# Requires Administrator.
#
# Usage examples:
#   powershell -ExecutionPolicy Bypass -File scripts/setup-firewall.ps1 -Port 5000 -RuleName "DoctorSchedule Inbound" -Profile Private
#   powershell -ExecutionPolicy Bypass -File scripts/setup-firewall.ps1 -Port 5000 -RemoteAddress LocalSubnet
#   powershell -ExecutionPolicy Bypass -File scripts/setup-firewall.ps1 -Port 5000 -RemoteAddress 192.168.0.0/16
param(
  [int]$Port = 5000,
  [string]$RuleName = "DoctorSchedule Inbound",
  [ValidateSet('Any','Domain','Private','Public')]
  [string]$Profile = 'Private',
  # Use 'LocalSubnet' to allow any host on the same LAN; or provide CIDR like 192.168.0.0/16
  [string]$RemoteAddress = 'LocalSubnet'
)

$ErrorActionPreference = 'Stop'

# Remove old rule if exists
Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue | Out-Null

# Create inbound allow rule for the specified port, limited by profile and remote address
New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -Profile $Profile -RemoteAddress $RemoteAddress | Out-Null

Write-Host "Firewall rule '$RuleName' created: TCP $Port, Profile=$Profile, RemoteAddress=$RemoteAddress" -ForegroundColor Green

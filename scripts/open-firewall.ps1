# Allow colleagues on the same network to reach local dev servers.
# Run PowerShell as Administrator:
#   Set-ExecutionPolicy -Scope Process Bypass -Force
#   .\scripts\open-firewall.ps1

$rules = @(
  @{
    Name = "FlexSim Station Console Frontend (5173)"
    Port = 5173
  },
  @{
    Name = "FlexSim Station Console API (3000)"
    Port = 3000
  }
)

foreach ($rule in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "Rule already exists: $($rule.Name)"
    continue
  }

  try {
    New-NetFirewallRule `
      -DisplayName $rule.Name `
      -Direction Inbound `
      -Action Allow `
      -Protocol TCP `
      -LocalPort $rule.Port `
      -Profile Domain,Private,Public -ErrorAction Stop | Out-Null
    Write-Host "Added firewall rule: $($rule.Name) (TCP $($rule.Port))"
  } catch {
    Write-Host "Failed to add rule (run as Administrator): $($rule.Name)" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "LAN URLs (share the frontend URL with colleagues):"
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
  ForEach-Object {
    Write-Host "  Frontend: http://$($_.IPAddress):5173"
    Write-Host "  API:      http://$($_.IPAddress):3000"
  }

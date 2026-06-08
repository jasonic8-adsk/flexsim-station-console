# Run on the HOST machine (the one running npm run frontend:share)
Write-Host "=== FlexSim Station Console - network diagnose ==="
Write-Host ""

Write-Host "Listeners (5173 / 3000):"
netstat -ano | findstr "LISTENING" | findstr ":5173 :3000"

Write-Host "`nShareable LAN addresses (ignore vEthernet / Hyper-V):"
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.InterfaceAlias -notlike "vEthernet*"
  } |
  Format-Table InterfaceAlias, IPAddress, PrefixLength -AutoSize

Write-Host "Network profile (Public blocks inbound unless firewall rule exists):"
Get-NetConnectionProfile | Format-Table InterfaceAlias, NetworkCategory -AutoSize

Write-Host "FlexSim firewall rules:"
Get-NetFirewallRule -DisplayName "*FlexSim*" -ErrorAction SilentlyContinue |
  Format-Table DisplayName, Enabled, Action -AutoSize

if (-not (Get-NetFirewallRule -DisplayName "*FlexSim*" -ErrorAction SilentlyContinue)) {
  Write-Host "  (none - run .\scripts\open-firewall.ps1 as Administrator)" -ForegroundColor Yellow
  Write-Host ""
}

Write-Host "Local port tests (from this PC to itself via LAN IP):"
$lan = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.InterfaceAlias -eq "Ethernet" -and $_.IPAddress -notlike "169.254.*" } |
  Select-Object -First 1).IPAddress

if ($lan) {
  foreach ($p in 5173, 3000) {
    $r = Test-NetConnection -ComputerName $lan -Port $p -WarningAction SilentlyContinue
    Write-Host "  ${lan}:${p} -> TcpTestSucceeded: $($r.TcpTestSucceeded)"
  }
} else {
  Write-Host "  No 'Ethernet' LAN IP found - adjust interface name if needed."
}

Write-Host "`nOn the OTHER PC, run:"
Write-Host "  Test-NetConnection -ComputerName $lan -Port 5173"

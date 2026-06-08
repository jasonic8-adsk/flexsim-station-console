# Run this on the OTHER PC (not the one running npm run frontend:share)
param(
  [string]$HostIp = "192.168.10.117"
)

Write-Host "=== FlexSim client connectivity test ==="
Write-Host "Target host: $HostIp`n"

Write-Host "This PC addresses:"
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.InterfaceAlias -notlike "vEthernet*" } |
  Format-Table InterfaceAlias, IPAddress -AutoSize

Write-Host "Ping (ICMP):"
ping.exe -n 2 $HostIp

Write-Host "`nTCP port 5173 (frontend):"
$r5173 = Test-NetConnection -ComputerName $HostIp -Port 5173 -WarningAction SilentlyContinue
Write-Host "  TcpTestSucceeded: $($r5173.TcpTestSucceeded)"

Write-Host "`nTCP port 3000 (API):"
$r3000 = Test-NetConnection -ComputerName $HostIp -Port 3000 -WarningAction SilentlyContinue
Write-Host "  TcpTestSucceeded: $($r3000.TcpTestSucceeded)"

if ($r5173.TcpTestSucceeded) {
  Write-Host "`nHTTP fetch:"
  try {
    $resp = Invoke-WebRequest -UseBasicParsing -Uri "http://${HostIp}:5173/" -TimeoutSec 5
    Write-Host "  Status: $($resp.StatusCode) - frontend reachable"
    Write-Host "  Open: http://${HostIp}:5173"
  } catch {
    Write-Host "  Port open but HTTP failed: $($_.Exception.Message)"
  }
} else {
  Write-Host "`nIf ping works but TCP fails, likely causes:"
  Write-Host "  - Different subnet (this PC not on 192.168.10.x)"
  Write-Host "  - Router AP/client isolation (common on guest Wi-Fi)"
  Write-Host "  - VPN on either PC routing traffic away from LAN"
  Write-Host "  - Third-party firewall on the host PC"
}

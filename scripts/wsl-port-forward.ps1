# WSL2 Port Forwarding Script for Windows
# Run this in PowerShell as Administrator

# Get WSL2 IP address
$wslIp = (wsl hostname -I).Trim().Split()[0]
$port = 3000

Write-Host "WSL2 IP: $wslIp" -ForegroundColor Green
Write-Host "Port: $port" -ForegroundColor Green
Write-Host ""

# Remove existing port proxy if exists
netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 2>&1 | Out-Null

# Add port proxy
netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wslIp

# Show Windows IP addresses
Write-Host "Windows IP addresses:" -ForegroundColor Yellow
ipconfig | Select-String -Pattern "IPv4" | ForEach-Object { Write-Host $_.Line }

Write-Host ""
Write-Host "✅ Port forwarding configured!" -ForegroundColor Green
Write-Host "Access from network: http://192.168.4.200:$port" -ForegroundColor Cyan

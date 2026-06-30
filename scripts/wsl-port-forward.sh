#!/bin/bash
# WSL2 Port Forwarding Helper
# This script helps configure port forwarding from Windows to WSL2

echo "🔍 Checking WSL2 network configuration..."
echo ""

# Get WSL2 IP
WSL_IP=$(hostname -I | awk '{print $1}')
echo "WSL2 IP: $WSL_IP"
echo ""

# Get Windows host IP (from resolv.conf)
WIN_HOST=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}' | head -1)
echo "Windows Host IP: $WIN_HOST"
echo ""

echo "📋 To enable port forwarding from Windows, run this in PowerShell (as Administrator):"
echo ""
echo "netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$WSL_IP"
echo ""
echo "Or use the PowerShell script:"
echo "  .\scripts\wsl-port-forward.ps1"
echo ""
echo "Then access from your network using:"
echo "  http://192.168.4.200:3000"
echo "  (Replace 192.168.4.200 with your Windows machine's actual IP)"
echo ""

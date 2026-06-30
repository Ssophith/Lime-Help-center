#!/bin/bash

# Fix Permissions Script for Production
# This script fixes file permissions for Nginx to serve static files correctly
# Usage: ./fix-permissions.sh

set -e

SSH_HOST="aws-docs-bw"
APP_PATH="/home/admin/limekb"

echo "Fixing file permissions on production server..."

ssh $SSH_HOST << 'ENDSSH'
set -e
cd /home/admin/limekb

echo "Setting parent directory permissions..."
sudo chmod 755 /home/admin /home/admin/limekb /home/admin/limekb/.next 2>/dev/null || true

echo "Fixing .next/static permissions..."
if [ -d ".next/static" ]; then
    sudo find .next/static -type d -exec chmod 755 {} \; 2>/dev/null || true
    sudo find .next/static -type f -exec chmod 644 {} \; 2>/dev/null || true
    sudo chown -R admin:www-data .next/static 2>/dev/null || true
    echo "✓ .next/static permissions fixed"
else
    echo "⚠ .next/static directory not found"
fi

echo "Fixing public directory permissions..."
if [ -d "public" ]; then
    sudo find public -type d -exec chmod 755 {} \; 2>/dev/null || true
    sudo find public -type f -exec chmod 644 {} \; 2>/dev/null || true
    sudo chown -R admin:www-data public 2>/dev/null || true
    echo "✓ public directory permissions fixed"
fi

echo "Reloading Nginx..."
sudo systemctl reload nginx 2>/dev/null || true

echo "✓ All permissions fixed"
ENDSSH

echo "Done!"

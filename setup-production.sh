#!/bin/bash

# Initial Production Server Setup Script
# Run this ONCE on the production server to set up the environment
# Usage: ssh aws-docs-bw 'bash -s' < setup-production.sh

set -e

APP_PATH="/home/admin/limekb"
APP_PORT=3010

echo "=== LIME KB Production Server Setup ==="

# Create application directory
mkdir -p $APP_PATH/{logs,backups}
cd $APP_PATH

# Check Node.js version
echo "Checking Node.js version..."
node --version
npm --version

# Check if PostgreSQL is available
echo "Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "PostgreSQL client found"
    # Check available PostgreSQL ports
    echo "Checking PostgreSQL ports..."
    netstat -tuln | grep -E ':(5432|5433|5434)' || echo "No PostgreSQL found on common ports"
else
    echo "PostgreSQL client not found - you may need to install it"
fi

# Check PM2
echo "Checking PM2..."
pm2 --version || echo "PM2 not found - installing..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Check Nginx
echo "Checking Nginx..."
/usr/sbin/nginx -v || echo "Nginx not found"

# Create logs directory
mkdir -p $APP_PATH/logs

# Set proper permissions
chmod 755 $APP_PATH
chmod 755 $APP_PATH/logs
chmod 755 $APP_PATH/backups

echo ""
echo "=== Setup Complete ==="
echo "Next steps:"
echo "1. Create .env.production file in $APP_PATH"
echo "2. Configure database connection"
echo "3. Run deployment script from local machine"

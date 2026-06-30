#!/bin/bash

# Production Deployment Script for LIME KB
# Usage: ./deploy.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SSH_HOST="aws-docs-bw"
APP_PATH="/home/admin/limekb"
APP_PORT=3010
DOMAIN="help.lime.mn"

echo -e "${GREEN}=== LIME KB Production Deployment ===${NC}\n"

# Check if we're in the project directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Step 1: Build the application locally
echo -e "${YELLOW}[1/8] Building Next.js application...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completed${NC}\n"

# Step 2: Create deployment archive (excluding unnecessary files)
echo -e "${YELLOW}[2/8] Creating deployment archive...${NC}"
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='.env*' \
    --exclude='data' \
    --exclude='logs' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='postgres_data' \
    -czf /tmp/limekb-deploy.tar.gz .
echo -e "${GREEN}✓ Archive created${NC}\n"

# Step 3: Transfer files to server
echo -e "${YELLOW}[3/8] Transferring files to server...${NC}"
ssh $SSH_HOST "mkdir -p $APP_PATH/{logs,backups}"
scp /tmp/limekb-deploy.tar.gz $SSH_HOST:/tmp/
rm /tmp/limekb-deploy.tar.gz
echo -e "${GREEN}✓ Files transferred${NC}\n"

# Step 4: Extract and setup on server
echo -e "${YELLOW}[4/8] Extracting files on server...${NC}"
ssh $SSH_HOST << 'ENDSSH'
set -e
cd /home/admin/limekb

# Backup current version if it exists
if [ -d ".next" ]; then
    echo "Creating backup..."
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r .next "$BACKUP_DIR/" 2>/dev/null || true
    cp package.json "$BACKUP_DIR/" 2>/dev/null || true
fi

# Extract new files
echo "Extracting new files..."
tar -xzf /tmp/limekb-deploy.tar.gz -C /home/admin/limekb
rm /tmp/limekb-deploy.tar.gz

# Install dependencies (including dev dependencies needed for build)
echo "Installing dependencies..."
npm ci

# Build on server (to ensure correct environment)
echo "Building application..."
npm run build

# Fix permissions for static files (Nginx needs to read them)
echo "Fixing file permissions..."
# Ensure parent directories are accessible
sudo chmod 755 /home/admin 2>/dev/null || true
sudo chmod 755 /home/admin/limekb 2>/dev/null || true
sudo chmod 755 /home/admin/limekb/.next 2>/dev/null || true

# Fix .next/static permissions recursively
if [ -d "/home/admin/limekb/.next/static" ]; then
    sudo find /home/admin/limekb/.next/static -type d -exec chmod 755 {} \; 2>/dev/null || true
    sudo find /home/admin/limekb/.next/static -type f -exec chmod 644 {} \; 2>/dev/null || true
    sudo chown -R admin:www-data /home/admin/limekb/.next/static 2>/dev/null || true
fi

# Also fix permissions for public assets
if [ -d "/home/admin/limekb/public" ]; then
    sudo find /home/admin/limekb/public -type d -exec chmod 755 {} \; 2>/dev/null || true
    sudo find /home/admin/limekb/public -type f -exec chmod 644 {} \; 2>/dev/null || true
    sudo chown -R admin:www-data /home/admin/limekb/public 2>/dev/null || true
fi

echo "✓ Files extracted and built"
echo "✓ Permissions fixed"
ENDSSH
echo -e "${GREEN}✓ Server setup completed${NC}\n"

# Step 5: Database migration (if needed)
echo -e "${YELLOW}[5/8] Checking database migration...${NC}"
echo -e "Note: If database setup is needed, run: ssh $SSH_HOST 'bash -s' < setup-database-production.sh"
read -p "Do you want to run database migration? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh $SSH_HOST << 'ENDSSH'
cd /home/admin/limekb
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    if [ -f "data/kb.json" ]; then
        npm run migrate
    else
        echo "⚠ No data/kb.json found - skipping migration (starting fresh)"
        echo "To create admin user, run: npm run create-admin admin your_password"
    fi
else
    echo "⚠ .env.production not found - skipping migration"
fi
ENDSSH
    echo -e "${GREEN}✓ Database migration check completed${NC}\n"
else
    echo -e "${YELLOW}⚠ Skipping database migration${NC}\n"
fi

# Step 6: Setup PM2
echo -e "${YELLOW}[6/8] Setting up PM2...${NC}"
ssh $SSH_HOST << ENDSSH
cd $APP_PATH

# Ensure permissions are correct before starting PM2
sudo chmod 755 /home/admin /home/admin/limekb /home/admin/limekb/.next 2>/dev/null || true
sudo find /home/admin/limekb/.next/static -type d -exec chmod 755 {} \; 2>/dev/null || true
sudo find /home/admin/limekb/.next/static -type f -exec chmod 644 {} \; 2>/dev/null || true
sudo chown -R admin:www-data /home/admin/limekb/.next/static 2>/dev/null || true

# Stop existing PM2 process if running
pm2 delete limekb 2>/dev/null || true

# Start with PM2 ecosystem config
pm2 start ecosystem.config.js --update-env

# Save PM2 configuration
pm2 save

echo "✓ PM2 configured"
ENDSSH
echo -e "${GREEN}✓ PM2 setup completed${NC}\n"

# Step 7: Setup Nginx
echo -e "${YELLOW}[7/8] Setting up Nginx...${NC}"
scp nginx-limekb.conf $SSH_HOST:/tmp/nginx-limekb.conf
ssh $SSH_HOST << 'ENDSSH'
set -e

# Copy nginx config
sudo cp /tmp/nginx-limekb.conf /etc/nginx/sites-available/help.lime.mn

# Create symlink if it doesn't exist
if [ ! -L /etc/nginx/sites-enabled/help.lime.mn ]; then
    sudo ln -s /etc/nginx/sites-available/help.lime.mn /etc/nginx/sites-enabled/
fi

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

echo "✓ Nginx configured"
ENDSSH
echo -e "${GREEN}✓ Nginx setup completed${NC}\n"

# Step 8: SSL Certificate (if not already set up)
echo -e "${YELLOW}[8/8] Checking SSL certificate...${NC}"
ssh $SSH_HOST << 'ENDSSH'
if [ ! -f /etc/letsencrypt/live/help.lime.mn/fullchain.pem ]; then
    echo "SSL certificate not found. Setting up Let's Encrypt..."
    sudo certbot --nginx -d help.lime.mn --non-interactive --agree-tos --email admin@lime.mn || echo "Certbot setup failed - please run manually"
else
    echo "SSL certificate already exists"
fi
ENDSSH
echo -e "${GREEN}✓ SSL check completed${NC}\n"

# Final status check
echo -e "${YELLOW}Checking application status...${NC}"
ssh $SSH_HOST "pm2 status limekb"

echo -e "\n${GREEN}=== Deployment Complete! ===${NC}"
echo -e "Application URL: https://$DOMAIN"
echo -e "PM2 Status: ssh $SSH_HOST 'pm2 status limekb'"
echo -e "PM2 Logs: ssh $SSH_HOST 'pm2 logs limekb'"
echo -e "Nginx Logs: ssh $SSH_HOST 'sudo tail -f /var/log/nginx/limekb-*.log'"

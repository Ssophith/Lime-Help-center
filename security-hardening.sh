#!/bin/bash

# Security Hardening Script for Production
# Run this on the production server
# Usage: ssh aws-docs-bw 'bash -s' < security-hardening.sh

set -e

APP_PATH="/home/admin/limekb"

echo "=== Security Hardening for LIME KB ==="

# 1. Set proper file permissions
echo "[1/6] Setting file permissions..."
chmod 750 $APP_PATH
chmod 640 $APP_PATH/.env.production 2>/dev/null || echo "  .env.production not found (will be created)"
chmod 755 $APP_PATH/logs
chmod 755 $APP_PATH/backups

# 2. Ensure .env.production is not readable by others
if [ -f "$APP_PATH/.env.production" ]; then
    chmod 600 $APP_PATH/.env.production
    echo "✓ Secured .env.production"
fi

# 3. Create .env.production from example if it doesn't exist
if [ ! -f "$APP_PATH/.env.production" ]; then
    echo "[2/6] Creating .env.production template..."
    cat > $APP_PATH/.env.production << 'ENVEOF'
# Production Environment Variables
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://help.lime.mn
NEXT_PUBLIC_SITE_NAME=LIME тусламж
PORT=3010

# Database - UPDATE THIS!
DATABASE_URL=postgresql://limekb:CHANGE_ME_STRONG_PASSWORD@localhost:5433/limekb

# Admin Session Secret - GENERATE THIS!
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ADMIN_SESSION_SECRET=CHANGE_ME_GENERATE_RANDOM_SECRET_32_BYTES

# Cloudflare R2 - UPDATE THESE!
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=lime-kb
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-your-account-id.r2.dev

# TinyMCE
NEXT_PUBLIC_TINYMCE_API_KEY=your_tinymce_api_key
ENVEOF
    chmod 600 $APP_PATH/.env.production
    echo "✓ Created .env.production template - PLEASE UPDATE IT!"
fi

# 4. Setup firewall rules (if ufw is available)
echo "[3/6] Checking firewall..."
if command -v ufw &> /dev/null; then
    echo "  UFW found - ensuring ports are properly configured"
    # Don't modify firewall automatically - just check
    echo "  Please ensure ports 80, 443, and 22 are open"
else
    echo "  UFW not found - using system firewall"
fi

# 5. Setup fail2ban (if available)
echo "[4/6] Checking fail2ban..."
if command -v fail2ban-client &> /dev/null; then
    echo "  Fail2ban is installed"
else
    echo "  Fail2ban not found - consider installing for additional security"
fi

# 6. Check SSL certificate
echo "[5/6] Checking SSL certificate..."
if [ -f "/etc/letsencrypt/live/help.lime.mn/fullchain.pem" ]; then
    echo "✓ SSL certificate found"
    # Check expiration
    EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/help.lime.mn/fullchain.pem | cut -d= -f2)
    echo "  Certificate expires: $EXPIRY"
else
    echo "⚠ SSL certificate not found - run: sudo certbot --nginx -d help.lime.mn"
fi

# 7. Generate secure ADMIN_SESSION_SECRET if not set
echo "[6/6] Checking ADMIN_SESSION_SECRET..."
if grep -q "CHANGE_ME" $APP_PATH/.env.production 2>/dev/null; then
    echo "⚠ ADMIN_SESSION_SECRET needs to be set!"
    echo "  Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
fi

echo ""
echo "=== Security Hardening Complete ==="
echo ""
echo "Important next steps:"
echo "1. Update .env.production with actual values"
echo "2. Generate ADMIN_SESSION_SECRET"
echo "3. Ensure database password is strong"
echo "4. Review firewall rules"
echo "5. Setup SSL certificate if not done"
echo "6. Consider setting up automated backups"

#!/bin/bash

# Database Migration Script for Production
# This script helps migrate data from local development to production
# Usage: ./migrate-database-production.sh

set -e

SSH_HOST="aws-docs-bw"
APP_PATH="/home/admin/limekb"

echo "=== Database Migration to Production ==="
echo ""
echo "This script will help you migrate your database to production."
echo ""

# Check if local data file exists
if [ -f "data/kb.json" ]; then
    echo "Found local data/kb.json"
    read -p "Do you want to transfer this file to production? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Transferring data/kb.json to server..."
        ssh $SSH_HOST "mkdir -p $APP_PATH/data"
        scp data/kb.json $SSH_HOST:$APP_PATH/data/kb.json
        echo "✓ Data file transferred"
    fi
fi

echo ""
echo "Now you need to:"
echo "1. SSH to the server: ssh $SSH_HOST"
echo "2. Navigate to: cd $APP_PATH"
echo "3. Ensure .env.production has correct DATABASE_URL"
echo "4. Run migration: npm run migrate"
echo ""
echo "Or run migration directly via SSH:"
echo "ssh $SSH_HOST 'cd $APP_PATH && npm run migrate'"

read -p "Do you want to run migration now via SSH? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running migration on production server..."
    ssh $SSH_HOST << 'ENDSSH'
cd /home/admin/limekb
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    npm run migrate
else
    echo "Error: .env.production not found!"
    exit 1
fi
ENDSSH
    echo "✓ Migration completed"
fi

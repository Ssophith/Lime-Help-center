#!/bin/bash

# Database Setup Script for Production
# This script helps set up PostgreSQL database for the production server
# Usage: ssh aws-docs-bw 'bash -s' < setup-database-production.sh

set -e

echo "=== PostgreSQL Database Setup for LIME KB ==="
echo ""

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL client (psql) not found!"
    echo "Please install PostgreSQL client first."
    exit 1
fi

# Check available PostgreSQL ports
echo "Checking PostgreSQL ports..."
PG_PORTS=$(netstat -tuln | grep -E ':(5432|5433|5434)' | awk '{print $4}' | cut -d: -f2 | sort -u)
if [ -z "$PG_PORTS" ]; then
    echo "Error: No PostgreSQL instance found on ports 5432, 5433, or 5434"
    exit 1
fi

echo "Found PostgreSQL on port(s): $PG_PORTS"
echo ""

# Ask which port to use
read -p "Which PostgreSQL port should we use? (default: 5433): " PG_PORT
PG_PORT=${PG_PORT:-5433}

# Ask for database credentials
read -p "PostgreSQL superuser (default: postgres): " PG_USER
PG_USER=${PG_USER:-postgres}

read -sp "PostgreSQL superuser password: " PG_PASSWORD
echo ""

read -p "Database name (default: limekb): " DB_NAME
DB_NAME=${DB_NAME:-limekb}

read -p "Database user (default: limekb): " DB_USER
DB_USER=${DB_USER:-limekb}

read -sp "Database user password: " DB_PASSWORD
echo ""

# Set PGPASSWORD for non-interactive connection
export PGPASSWORD="$PG_PASSWORD"

echo ""
echo "Creating database and user..."

# Create database and user
psql -h localhost -p $PG_PORT -U "$PG_USER" -d postgres << EOF
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo "✓ Database and user created"
echo ""

# Connect to the new database and create schema
echo "Creating database schema..."
export PGPASSWORD="$DB_PASSWORD"
psql -h localhost -p $PG_PORT -U "$DB_USER" -d "$DB_NAME" << EOF
-- Run init-db.sql if it exists
\i /home/admin/limekb/scripts/init-db.sql
EOF

echo "✓ Schema created"
echo ""

# Generate DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${PG_PORT}/${DB_NAME}"
echo "=== Database Setup Complete ==="
echo ""
echo "Add this to your .env.production file:"
echo "DATABASE_URL=$DATABASE_URL"
echo ""
echo "You can update .env.production with:"
echo "echo 'DATABASE_URL=$DATABASE_URL' >> /home/admin/limekb/.env.production"
echo ""
echo "Or edit manually:"
echo "nano /home/admin/limekb/.env.production"

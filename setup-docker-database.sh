#!/bin/bash

# Docker Compose Database Setup Script for Production
# This script sets up the database using Docker Compose
# Usage: ssh aws-docs-bw 'bash -s' < setup-docker-database.sh

set -e

APP_PATH="/home/admin/limekb"

echo "=== Docker Compose Database Setup for LIME KB ==="
echo ""

cd $APP_PATH

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found in $APP_PATH"
    exit 1
fi

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "Error: Docker is not running or user doesn't have permission"
    exit 1
fi

# Detect docker compose command (docker compose or docker-compose)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif docker-compose version &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "Error: Neither 'docker compose' nor 'docker-compose' found"
    exit 1
fi

# Check if container exists and is stopped, remove it if needed
if docker ps -a | grep -q kb_postgres; then
    CONTAINER_STATUS=$(docker ps -a | grep kb_postgres | awk '{print $7}')
    if [ "$CONTAINER_STATUS" != "Up" ]; then
        echo "Removing old/exited container..."
        docker rm kb_postgres 2>/dev/null || true
    fi
fi

# Verify init-db.sql exists before starting
if [ ! -f "scripts/init-db.sql" ]; then
    echo "⚠ Warning: scripts/init-db.sql not found, container will start without schema initialization"
fi

echo "Starting PostgreSQL with Docker Compose..."
if ! $DOCKER_COMPOSE up -d postgres; then
    echo "Error: Failed to start container. Checking logs..."
    $DOCKER_COMPOSE logs postgres 2>&1 | tail -20
    echo ""
    echo "Trying to fix volume binding issue..."
    # Try removing the problematic volume binding temporarily
    if [ -f "docker-compose.yml.backup" ]; then
        mv docker-compose.yml.backup docker-compose.yml
    fi
    cp docker-compose.yml docker-compose.yml.backup
    # Remove the init-db.sql volume binding temporarily
    sed -i '/init-db.sql/d' docker-compose.yml
    $DOCKER_COMPOSE up -d postgres
    if [ $? -eq 0 ]; then
        echo "✓ Container started without init-db.sql binding"
        echo "  Schema will be created manually after container starts"
    else
        mv docker-compose.yml.backup docker-compose.yml
        exit 1
    fi
fi

echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Get actual container name from docker compose
CONTAINER_NAME=$($DOCKER_COMPOSE ps -q postgres 2>/dev/null | xargs docker inspect --format '{{.Name}}' 2>/dev/null | head -1 | sed 's/\///')

# Fallback: try to find container by name pattern
if [ -z "$CONTAINER_NAME" ]; then
    CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep -E "(kb_postgres|.*kb.*postgres)" | head -1)
fi

# Final fallback
if [ -z "$CONTAINER_NAME" ]; then
    CONTAINER_NAME="kb_postgres"
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -qE "(kb_postgres|.*kb.*postgres)"; then
    echo "Error: PostgreSQL container is not running"
    $DOCKER_COMPOSE logs postgres
    exit 1
fi

echo "✓ PostgreSQL container is running: $CONTAINER_NAME"

# Extract database credentials from docker-compose.yml
DB_USER=$(grep "POSTGRES_USER:" docker-compose.yml | awk '{print $2}' | tr -d '"')
DB_PASSWORD=$(grep "POSTGRES_PASSWORD:" docker-compose.yml | awk '{print $2}' | tr -d '"')
DB_NAME=$(grep "POSTGRES_DB:" docker-compose.yml | awk '{print $2}' | tr -d '"')
DB_PORT=$(grep "ports:" -A 1 docker-compose.yml | grep -o '[0-9]*:5432' | cut -d: -f1)

echo ""
echo "Database Configuration:"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo "  Port: $DB_PORT"
echo ""

# Wait a bit more for PostgreSQL to fully initialize
echo "Waiting for database to be ready..."
for i in {1..60}; do
    if docker exec "$CONTAINER_NAME" pg_isready -U $DB_USER -d $DB_NAME &> /dev/null; then
        echo "✓ Database is ready"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "Error: Database did not become ready in time"
        $DOCKER_COMPOSE logs postgres | tail -20
        exit 1
    fi
    sleep 2
done

# Check if schema exists, if not create it
echo "Checking database schema..."
SCHEMA_EXISTS=$(docker exec "$CONTAINER_NAME" psql -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories');" 2>/dev/null || echo "false")

if [ "$SCHEMA_EXISTS" != "t" ]; then
    echo "Creating database schema..."
    if [ -f "scripts/init-db.sql" ]; then
        docker exec -i "$CONTAINER_NAME" psql -U $DB_USER -d $DB_NAME < scripts/init-db.sql
        echo "✓ Schema created"
    else
        echo "⚠ Warning: scripts/init-db.sql not found, schema may not be initialized"
    fi
else
    echo "✓ Schema already exists"
fi

# Generate DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"

echo ""
echo "=== Database Setup Complete ==="
echo ""
echo "DATABASE_URL for .env.production:"
echo "$DATABASE_URL"
echo ""

# Update .env.production if it exists
if [ -f ".env.production" ]; then
    echo "Updating .env.production..."
    # Remove old DATABASE_URL line if exists
    sed -i '/^DATABASE_URL=/d' .env.production
    # Add new DATABASE_URL
    echo "DATABASE_URL=$DATABASE_URL" >> .env.production
    chmod 600 .env.production
    echo "✓ .env.production updated"
else
    echo "⚠ .env.production not found - create it manually with:"
    echo "DATABASE_URL=$DATABASE_URL"
fi

# Create admin user automatically.
# Reads ADMIN_USERNAME / ADMIN_PASSWORD from env so secrets stay out of this script.
echo ""
echo "Creating admin user..."
: "${ADMIN_USERNAME:=admin}"
: "${ADMIN_PASSWORD:?Set ADMIN_PASSWORD before running this script (export ADMIN_PASSWORD=...)}"

# Export environment variables for the create-admin script
export DATABASE_URL="$DATABASE_URL"
cd $APP_PATH

# Run create-admin script
npm run create-admin "$ADMIN_USERNAME" "$ADMIN_PASSWORD" || {
    echo "⚠ Warning: Admin user creation failed, you may need to run manually:"
    echo "   npm run create-admin '$ADMIN_USERNAME' '<password from your secrets store>'"
}

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Admin credentials:"
echo "  Username: $ADMIN_USERNAME"
echo "  Password: $ADMIN_PASSWORD"
echo ""
echo "Next steps:"
echo "1. Verify database connection:"
echo "   docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME"
echo ""
echo "2. Restart application:"
echo "   pm2 restart limekb"
echo ""
echo "3. Access admin panel:"
echo "   https://help.lime.mn/jadmin/login"

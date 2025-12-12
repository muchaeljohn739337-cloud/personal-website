#!/bin/bash

# ============================================================================
# Database Setup Script - Advancia Pay Ledger
# ============================================================================
# This script sets up PostgreSQL databases for development and testing
# Run with: bash scripts/setup-database.sh

set -e  # Exit on error

echo "🔧 Setting up PostgreSQL databases..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo "Installing PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi

# Check if PostgreSQL service is running
if ! sudo systemctl is-active --quiet postgresql; then
    echo "Starting PostgreSQL service..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

echo -e "${GREEN}✅ PostgreSQL service is running${NC}"

# Create databases
echo "Creating databases..."

sudo -u postgres psql << EOF
-- Drop databases if they exist (for clean setup)
DROP DATABASE IF EXISTS advancia_payledger;
DROP DATABASE IF EXISTS modular_saas_test;

-- Create databases
CREATE DATABASE advancia_payledger;
CREATE DATABASE modular_saas_test;

-- Set password for postgres user
ALTER USER postgres PASSWORD 'postgres';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE advancia_payledger TO postgres;
GRANT ALL PRIVILEGES ON DATABASE modular_saas_test TO postgres;

-- Show databases
\l

\q
EOF

echo -e "${GREEN}✅ Databases created successfully${NC}"

# Test connection
echo "Testing database connection..."
if PGPASSWORD=postgres psql -h localhost -U postgres -d modular_saas_test -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi

# Run Prisma migrations
echo "Running Prisma migrations..."
cd "$(dirname "$0")/../backend"

# Generate Prisma Client
echo "Generating Prisma Client..."
npm run prisma:generate

# Run migrations
echo "Running database migrations..."
npm run prisma:migrate || npm run prisma:push

echo -e "${GREEN}✅ Database setup complete!${NC}"
echo ""
echo "📊 Database Information:"
echo "  - Development DB: advancia_payledger"
echo "  - Test DB: modular_saas_test"
echo "  - Host: localhost"
echo "  - Port: 5432"
echo "  - User: postgres"
echo "  - Password: postgres"
echo ""
echo "🚀 Next steps:"
echo "  1. Update your .env file with DATABASE_URL"
echo "  2. Run: npm run dev (in backend folder)"
echo "  3. Run: npm test (to verify tests pass)"
echo ""

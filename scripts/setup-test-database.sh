#!/bin/bash

# Setup Test Database using Docker
# This script sets up a PostgreSQL test database in Docker

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Setting up test database with Docker...${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^test-postgres$"; then
    echo -e "${YELLOW}⚠️  Test database container already exists${NC}"
    read -p "Do you want to remove and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🗑️  Removing existing container...${NC}"
        docker stop test-postgres > /dev/null 2>&1 || true
        docker rm test-postgres > /dev/null 2>&1 || true
    else
        echo -e "${BLUE}🔄 Starting existing container...${NC}"
        docker start test-postgres > /dev/null 2>&1 || true
        echo -e "${GREEN}✅ Test database is ready!${NC}"
        echo ""
        echo "Connection string:"
        echo "  DATABASE_URL_TEST=postgresql://test:test@localhost:5433/test"
        exit 0
    fi
fi

# Start database using docker-compose
echo -e "${BLUE}🚀 Starting test database...${NC}"
if [ -f "docker-compose.test.yml" ]; then
    docker-compose -f docker-compose.test.yml up -d
else
    # Fallback to direct docker run
    docker run --name test-postgres \
        -e POSTGRES_USER=test \
        -e POSTGRES_PASSWORD=test \
        -e POSTGRES_DB=test \
        -p 5433:5432 \
        -d postgres:15-alpine
fi

# Wait for database to be ready
echo -e "${BLUE}⏳ Waiting for database to be ready...${NC}"
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker exec test-postgres pg_isready -U test -d test > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is ready!${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ Database failed to start within 30 seconds${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Test database setup complete!${NC}"
echo ""
echo "📊 Connection Details:"
echo "   Host: localhost"
echo "   Port: 5433"
echo "   Database: test"
echo "   User: test"
echo "   Password: test"
echo ""
echo "🔗 Connection String:"
echo "   DATABASE_URL_TEST=postgresql://test:test@localhost:5433/test"
echo ""
echo "💡 Next Steps:"
echo "   1. Run migrations: npm run prisma:migrate"
echo "   2. Test connection: npm run test:db"
echo "   3. Run tests: npm test"
echo ""


#!/bin/bash

# ============================================================================
# Render Deployment Verification Script
# ============================================================================
# This script verifies that your Render deployment is successful
# Run with: bash scripts/verify-deployment.sh

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="https://api.advanciapayledger.com"
FRONTEND_URL="https://www.advanciapayledger.com"

echo -e "${BLUE}🔍 Verifying Render Deployment...${NC}"
echo ""

# Function to check endpoint
check_endpoint() {
    local url=$1
    local name=$2
    
    echo -n "Checking $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ OK (HTTP $response)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED (HTTP $response)${NC}"
        return 1
    fi
}

# Check backend health endpoint
echo -e "${YELLOW}Backend API:${NC}"
check_endpoint "$BACKEND_URL/api/health" "Health Endpoint"

# Check if backend is responding
echo ""
echo -e "${YELLOW}Testing Backend Response:${NC}"
response=$(curl -s "$BACKEND_URL/api/health" 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Response:${NC} $response"
else
    echo -e "${RED}Failed to connect to backend${NC}"
fi

# Check frontend
echo ""
echo -e "${YELLOW}Frontend:${NC}"
check_endpoint "$FRONTEND_URL" "Homepage"

# Check database connection (via backend)
echo ""
echo -e "${YELLOW}Database:${NC}"
check_endpoint "$BACKEND_URL/api/health/db" "Database Connection"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Summary
echo -e "${GREEN}✅ Deployment Verification Complete${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Check Render dashboard for build logs"
echo "2. Verify environment variables are set"
echo "3. Test API endpoints manually"
echo "4. Monitor application logs"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  View logs: Check Render dashboard"
echo "  Test API:  curl $BACKEND_URL/api/health"
echo "  Test DB:   curl $BACKEND_URL/api/health/db"
echo ""

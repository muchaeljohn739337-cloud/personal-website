#!/bin/bash

# Production Deployment Script
# Usage: ./scripts/deploy-production.sh [vercel|cloudflare|docker]

set -e  # Exit on error

DEPLOY_METHOD=${1:-vercel}
ENVIRONMENT="production"

echo "🚀 Starting production deployment via $DEPLOY_METHOD..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Pre-deployment checks
echo -e "${YELLOW}📋 Running pre-deployment checks...${NC}"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}❌ Node.js 20+ required. Current: $(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js version OK: $(node -v)${NC}"

# Check if .env.production exists (for reference, not used in Vercel/Cloudflare)
if [ -f ".env.production" ]; then
  echo -e "${GREEN}✅ Production env file found${NC}"
else
  echo -e "${YELLOW}⚠️  .env.production not found (OK if using platform env vars)${NC}"
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --legacy-peer-deps

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm test -- --passWithNoTests || {
  echo -e "${YELLOW}⚠️  Some tests failed, but continuing...${NC}"
}

# Lint check
echo -e "${YELLOW}🔍 Running linter...${NC}"
npm run lint || {
  echo -e "${YELLOW}⚠️  Linter warnings found, but continuing...${NC}"
}

# Generate Prisma client
echo -e "${YELLOW}🗄️  Generating Prisma client...${NC}"
npm run prisma:generate

# Deploy based on method
case $DEPLOY_METHOD in
  vercel)
    echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
      echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
      npm i -g vercel
    fi
    
    # Build and deploy
    npm run build
    vercel --prod --yes
    
    echo -e "${GREEN}✅ Deployed to Vercel!${NC}"
    ;;
    
  cloudflare)
    echo -e "${YELLOW}🚀 Deploying to Cloudflare Workers...${NC}"
    
    # Check if Wrangler is available
    if ! command -v wrangler &> /dev/null; then
      echo -e "${YELLOW}📦 Installing Wrangler...${NC}"
      npm install -g wrangler
    fi
    
    # Build for Cloudflare
    npm run build:worker
    
    # Deploy
    npx wrangler pages deploy .vercel/output/static --env production
    
    echo -e "${GREEN}✅ Deployed to Cloudflare!${NC}"
    ;;
    
  docker)
    echo -e "${YELLOW}🚀 Building Docker image...${NC}"
    
    # Build image
    docker build -t saas-platform:latest .
    
    # Deploy with docker-compose
    if [ -f "docker-compose.prod.yml" ]; then
      docker-compose -f docker-compose.prod.yml up -d
    else
      echo -e "${YELLOW}⚠️  docker-compose.prod.yml not found, using docker-compose.yml${NC}"
      docker-compose up -d
    fi
    
    echo -e "${GREEN}✅ Deployed with Docker!${NC}"
    ;;
    
  *)
    echo -e "${RED}❌ Unknown deployment method: $DEPLOY_METHOD${NC}"
    echo "Usage: ./scripts/deploy-production.sh [vercel|cloudflare|docker]"
    exit 1
    ;;
esac

# Post-deployment verification
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"

# Wait a bit for deployment to stabilize
sleep 5

# Health check (update URL as needed)
HEALTH_URL="https://advanciapayledger.com/api/health"
if curl -f -s "$HEALTH_URL" > /dev/null; then
  echo -e "${GREEN}✅ Health check passed!${NC}"
else
  echo -e "${YELLOW}⚠️  Health check failed (deployment might still be in progress)${NC}"
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Verify environment variables are set"
echo "  2. Run database migrations: npm run migrate:prod"
echo "  3. Test payment providers"
echo "  4. Verify webhooks"
echo "  5. Check monitoring dashboards"


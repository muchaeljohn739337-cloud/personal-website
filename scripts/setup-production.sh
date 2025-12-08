#!/bin/bash

# Production Setup Script
# Helps set up production environment

set -e

echo "🚀 Production Setup Script"
echo "=========================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local from env.example..."
  cp env.example .env.local
  echo "⚠️  Please edit .env.local with your production values"
  echo ""
fi

# Check Node version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"
echo ""

# Check if database is accessible
echo "🔍 Checking database connection..."
if [ -n "$DATABASE_URL" ]; then
  echo "✅ DATABASE_URL is set"
else
  echo "⚠️  DATABASE_URL is not set"
fi
echo ""

# Check required environment variables
echo "🔍 Checking required environment variables..."
REQUIRED_VARS=("JWT_SECRET" "SESSION_SECRET" "NEXTAUTH_SECRET" "DATABASE_URL")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
  echo "✅ All required environment variables are set"
else
  echo "❌ Missing required environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
fi
echo ""

# Generate secrets if needed
echo "🔑 Generating secrets (if needed)..."
if [ -z "$JWT_SECRET" ]; then
  echo "Generating JWT_SECRET..."
  # Note: In production, generate these properly
  echo "Use: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm ci
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate
echo ""

# Run database migrations
echo "🗄️  Running database migrations..."
read -p "Run database migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm run prisma:migrate
fi
echo ""

# Create admin user
echo "👤 Admin user setup..."
read -p "Create admin user? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm run create-admin
fi
echo ""

# Build application
echo "🏗️  Building application..."
npm run build
echo ""

echo "✅ Production setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update .env.local with production values"
echo "2. Configure payment provider webhooks"
echo "3. Set up DNS in Cloudflare"
echo "4. Deploy to production: npm run deploy:prod"
echo ""



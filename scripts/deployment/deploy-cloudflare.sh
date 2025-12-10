#!/bin/bash
# Cloudflare Deployment Script

echo "☁️  Deploying to Cloudflare..."

# Check if Wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler not found. Installing..."
    npm install -g wrangler
fi

# Build for Cloudflare
echo "🔨 Building for Cloudflare..."
npm run build:worker

# Deploy to Cloudflare Pages/Workers
echo "🚀 Deploying to Cloudflare..."
npx wrangler pages deploy .vercel/output/static --project-name=advanciapayledger

echo "✅ Deployment complete!"
echo "💡 Set secrets via: wrangler secret put <NAME>"

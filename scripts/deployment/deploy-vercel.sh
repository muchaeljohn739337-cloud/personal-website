#!/bin/bash
# Vercel Deployment Script

echo "🚀 Deploying to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel
echo "📝 Logging in to Vercel..."
vercel login

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
echo "💡 Set environment variables in Vercel Dashboard"

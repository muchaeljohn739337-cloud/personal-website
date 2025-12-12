#!/bin/bash

# Extract environment variables for Render deployment
# DO NOT commit this file - it will contain secrets!

echo "🔐 Extracting environment variables for Render..."
echo ""
echo "Copy these to Render dashboard → Environment Variables:"
echo "========================================================"
echo ""

# Core
echo "# Core"
echo "NODE_ENV=production"
echo "PORT=4000"
echo ""

# Database (already provided)
echo "# Database"
echo "DATABASE_URL=postgresql://advancia_payledger_user:PCaOlQFKxRa1xhdDH1vBRXX6KGixLiDQ@dpg-d4p2ae24d50c73bds97g-a/advancia_payledger"
echo ""

# URLs (update after service creation)
echo "# URLs"
echo "FRONTEND_URL=https://advanciapayledger.com"
echo "BACKEND_URL=https://advancia-pay-ledger-backend.onrender.com"
echo "ALLOWED_ORIGINS=https://advanciapayledger.com,https://www.advanciapayledger.com,https://admin.advanciapayledger.com"
echo ""

# Extract from .env
if [ -f .env ]; then
    echo "# JWT/Auth"
    grep -E '^(JWT_|SESSION_)' .env | grep -v '^#'
    echo ""
    
    echo "# Google OAuth"
    grep -E '^GOOGLE_' .env | grep -v '^#'
    echo "# Update GOOGLE_REDIRECT_URI to: https://advancia-pay-ledger-backend.onrender.com/api/auth/google/callback"
    echo ""
    
    echo "# Stripe"
    grep -E '^STRIPE_' .env | grep -v '^#'
    echo ""
    
    echo "# Email"
    grep -E '^(EMAIL_|SMTP_)' .env | grep -v '^#' | grep -v 'EMAIL_HOST=' | sort -u
    echo ""
    
    echo "# Web Push"
    grep -E '^VAPID_' .env | grep -v '^#'
    echo ""
    
    echo "# Admin"
    grep -E '^ADMIN_' .env | grep -v '^#'
    echo ""
    
    echo "# Cloudflare (optional)"
    grep -E '^CLOUDFLARE_' .env | grep -v '^#'
    echo ""
    
    echo "# Security"
    grep -E '^API_KEY=' .env | grep -v '^#'
    echo ""
else
    echo "⚠️  Warning: .env file not found"
    echo "You'll need to manually add JWT_SECRET, GOOGLE_CLIENT_ID, etc."
fi

# MongoDB
echo "# MongoDB Atlas"
echo "MONGODB_URI=mongodb+srv://advanciapayledger_db_user:WeHuomTwPh0Ek43e@cluster0.hyqqook.mongodb.net/advancia_ledger?retryWrites=true&w=majority&appName=Cluster0"
echo "MONGODB_DB_NAME=advancia_ledger"
echo "MONGODB_CACHE_ENABLED=true"
echo "MONGODB_LOGS_ENABLED=true"
echo ""

echo "========================================================"
echo "✅ Extraction complete!"
echo ""
echo "⚠️  IMPORTANT: Update these after deployment:"
echo "   - BACKEND_URL (use your Render URL)"
echo "   - GOOGLE_REDIRECT_URI (use your Render URL)"
echo "   - STRIPE_WEBHOOK_SECRET (configure in Stripe dashboard)"

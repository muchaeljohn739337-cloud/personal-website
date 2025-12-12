#!/bin/bash
echo "🍃 MongoDB Atlas Connection Setup"
echo "=================================="
echo ""
echo "Your MongoDB Atlas Cluster ID: 6931e1156adfc717bb737e5e"
echo "Dashboard: https://cloud.mongodb.com/v2/6931e1156adfc717bb737e5e#/overview"
echo ""
echo "📋 Steps to get your connection string:"
echo ""
echo "1. Click 'Connect' button on your cluster"
echo "2. Choose 'Connect your application'"
echo "3. Select 'Node.js' as driver"
echo "4. Copy the connection string (looks like):"
echo "   mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority"
echo ""
echo "5. Paste it below (or press Ctrl+C to skip):"
read -p "MongoDB URI: " MONGO_URI

if [ -z "$MONGO_URI" ]; then
    echo "⚠️  Skipped. Run this script again when ready."
    exit 0
fi

echo ""
echo "✅ Adding to backend/.env..."

# Backup .env
cp .env .env.backup-$(date +%Y%m%d-%H%M%S)

# Remove old MongoDB config lines
sed -i '/^# MongoDB Configuration/,/^# MONGODB_DB_NAME/d' .env

# Add new MongoDB config
cat >> .env << ENVEOF

# MongoDB Configuration (Analytics & Logging)
MONGODB_URI="$MONGO_URI"
MONGODB_DB_NAME="advancia_ledger"
MONGODB_CACHE_ENABLED=true
MONGODB_LOGS_ENABLED=true
ENVEOF

echo "✅ Configuration saved!"
echo ""
echo "🧪 Testing connection..."
node test-mongodb.js

echo ""
echo "✅ Setup complete! Start backend with: npm run dev"

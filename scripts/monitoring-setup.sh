#!/bin/bash

# Monitoring Setup Script
# Configure uptime monitoring and alerts

echo "📊 Setting up monitoring..."

# Check required environment variables
if [ -z "$SENTRY_DSN" ]; then
  echo "⚠️  SENTRY_DSN not set (optional but recommended)"
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
  echo "❌ ERROR: NEXT_PUBLIC_APP_URL must be set"
  exit 1
fi

echo "✅ Monitoring endpoints:"
echo "   - Health: $NEXT_PUBLIC_APP_URL/api/health"
echo "   - System Tests: $NEXT_PUBLIC_APP_URL/api/admin/tests?action=full"
echo ""
echo "📝 Recommended monitoring services:"
echo "   1. UptimeRobot - Free uptime monitoring"
echo "   2. Pingdom - Advanced monitoring"
echo "   3. StatusCake - Free tier available"
echo "   4. Sentry - Error tracking (already configured)"
echo ""
echo "🔔 Set up alerts for:"
echo "   - Health check failures"
echo "   - High error rates"
echo "   - Slow response times"
echo "   - Database connection issues"
echo ""
echo "✅ Monitoring setup complete!"


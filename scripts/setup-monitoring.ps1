#!/usr/bin/env pwsh
# Monitoring Setup Script
# Sets up monitoring, analytics, and alerting for the application

Write-Host "📊 Monitoring Setup" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

# Function to check if package is installed
function Test-PackageInstalled {
    param([string]$PackageName)
    $packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
    return $packageJson.dependencies.$PackageName -or $packageJson.devDependencies.$PackageName
}

# 1. Vercel Analytics
Write-Host "1️⃣  Vercel Analytics" -ForegroundColor Cyan
$setupAnalytics = Read-Host "Install Vercel Analytics? (y/n)"
if ($setupAnalytics -eq 'y') {
    Write-Host "   Installing @vercel/analytics..." -ForegroundColor Gray
    npm install @vercel/analytics
    
    Write-Host "   ✅ Installed" -ForegroundColor Green
    Write-Host "   📝 Add to app/layout.tsx:" -ForegroundColor Yellow
    Write-Host "      import { Analytics } from '@vercel/analytics/react';" -ForegroundColor Gray
    Write-Host "      // Add <Analytics /> to your layout" -ForegroundColor Gray
    Write-Host ""
}

# 2. Vercel Speed Insights
Write-Host "2️⃣  Vercel Speed Insights" -ForegroundColor Cyan
$setupSpeedInsights = Read-Host "Install Vercel Speed Insights? (y/n)"
if ($setupSpeedInsights -eq 'y') {
    Write-Host "   Installing @vercel/speed-insights..." -ForegroundColor Gray
    npm install @vercel/speed-insights
    
    Write-Host "   ✅ Installed" -ForegroundColor Green
    Write-Host "   📝 Add to app/layout.tsx:" -ForegroundColor Yellow
    Write-Host "      import { SpeedInsights } from '@vercel/speed-insights/next';" -ForegroundColor Gray
    Write-Host "      // Add <SpeedInsights /> to your layout" -ForegroundColor Gray
    Write-Host ""
}

# 3. Sentry Error Monitoring
Write-Host "3️⃣  Sentry Error Monitoring" -ForegroundColor Cyan
$setupSentry = Read-Host "Install Sentry? (y/n)"
if ($setupSentry -eq 'y') {
    Write-Host "   Installing @sentry/nextjs..." -ForegroundColor Gray
    npm install @sentry/nextjs
    
    Write-Host "   Running Sentry wizard..." -ForegroundColor Gray
    npx @sentry/wizard@latest -i nextjs
    
    Write-Host "   ✅ Installed" -ForegroundColor Green
    Write-Host "   📝 Add SENTRY_DSN to Vercel environment variables" -ForegroundColor Yellow
    Write-Host ""
}

# 4. Uptime Monitoring
Write-Host "4️⃣  Uptime Monitoring" -ForegroundColor Cyan
Write-Host "   Recommended services:" -ForegroundColor Gray
Write-Host "   • Better Uptime: https://betteruptime.com (Free tier)" -ForegroundColor Gray
Write-Host "   • UptimeRobot: https://uptimerobot.com (Free tier)" -ForegroundColor Gray
Write-Host "   • Pingdom: https://pingdom.com" -ForegroundColor Gray
Write-Host ""

# 5. Log Aggregation
Write-Host "5️⃣  Log Aggregation" -ForegroundColor Cyan
$setupLogFlare = Read-Host "Set up LogFlare integration? (y/n)"
if ($setupLogFlare -eq 'y') {
    Write-Host "   📝 Setup instructions:" -ForegroundColor Yellow
    Write-Host "   1. Sign up at https://logflare.app" -ForegroundColor Gray
    Write-Host "   2. Create a new source" -ForegroundColor Gray
    Write-Host "   3. Install Vercel integration: https://vercel.com/integrations/logflare" -ForegroundColor Gray
    Write-Host ""
}

# 6. Performance Monitoring
Write-Host "6️⃣  Performance Monitoring" -ForegroundColor Cyan
$setupWebVitals = Read-Host "Set up Web Vitals monitoring? (y/n)"
if ($setupWebVitals -eq 'y') {
    Write-Host "   Creating web-vitals.ts..." -ForegroundColor Gray
    
    $webVitalsContent = @'
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics endpoint
  const body = JSON.stringify(metric);
  const url = '/api/analytics';

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
}

export function reportWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
'@
    
    $webVitalsContent | Out-File -FilePath "lib/web-vitals.ts" -Encoding UTF8
    Write-Host "   ✅ Created lib/web-vitals.ts" -ForegroundColor Green
    Write-Host ""
}

# 7. Supabase Monitoring
Write-Host "7️⃣  Supabase Monitoring" -ForegroundColor Cyan
Write-Host "   Dashboard: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/reports" -ForegroundColor Gray
Write-Host "   Enable:" -ForegroundColor Yellow
Write-Host "   • Database Performance Monitoring" -ForegroundColor Gray
Write-Host "   • Query Performance Insights" -ForegroundColor Gray
Write-Host "   • Real-time Metrics" -ForegroundColor Gray
Write-Host "   • Alert Rules" -ForegroundColor Gray
Write-Host ""

# 8. Create monitoring dashboard config
Write-Host "8️⃣  Creating monitoring configuration..." -ForegroundColor Cyan

$monitoringConfig = @'
{
  "monitoring": {
    "vercel": {
      "analytics": true,
      "speedInsights": true,
      "deploymentNotifications": true
    },
    "sentry": {
      "enabled": true,
      "environment": "production",
      "tracesSampleRate": 1.0,
      "replaysSessionSampleRate": 0.1,
      "replaysOnErrorSampleRate": 1.0
    },
    "uptime": {
      "provider": "betteruptime",
      "checkInterval": "1m",
      "locations": ["us-east", "eu-west", "ap-southeast"]
    },
    "alerts": {
      "channels": ["email", "slack"],
      "rules": [
        {
          "name": "High Error Rate",
          "condition": "error_rate > 5%",
          "threshold": "5 minutes",
          "severity": "critical"
        },
        {
          "name": "Slow Response Time",
          "condition": "p95_response_time > 2000ms",
          "threshold": "10 minutes",
          "severity": "warning"
        },
        {
          "name": "Deployment Failed",
          "condition": "deployment_status == failed",
          "threshold": "immediate",
          "severity": "critical"
        }
      ]
    },
    "metrics": {
      "retention": "90 days",
      "aggregation": "1 minute",
      "dashboards": [
        "overview",
        "performance",
        "errors",
        "database"
      ]
    }
  }
}
'@

$monitoringConfig | Out-File -FilePath "monitoring.config.json" -Encoding UTF8
Write-Host "   ✅ Created monitoring.config.json" -ForegroundColor Green
Write-Host ""

# 9. Create health check endpoint
Write-Host "9️⃣  Creating health check endpoint..." -ForegroundColor Cyan

$healthCheckContent = @'
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: 'unknown',
      redis: 'unknown',
      storage: 'unknown'
    }
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = 'healthy';
  } catch (error) {
    checks.checks.database = 'unhealthy';
    checks.status = 'degraded';
  }

  // Add more checks as needed
  checks.checks.redis = 'not_configured';
  checks.checks.storage = 'not_configured';

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(checks, { status: statusCode });
}
'@

New-Item -Path "app/api/health" -ItemType Directory -Force | Out-Null
$healthCheckContent | Out-File -FilePath "app/api/health/route.ts" -Encoding UTF8
Write-Host "   ✅ Created app/api/health/route.ts" -ForegroundColor Green
Write-Host ""

# 10. Summary
Write-Host "✅ Monitoring Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Enable Vercel Analytics in dashboard:" -ForegroundColor Gray
Write-Host "      https://vercel.com/your-project/analytics" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Configure Sentry DSN in Vercel environment variables" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Set up uptime monitoring:" -ForegroundColor Gray
Write-Host "      • Sign up at https://betteruptime.com" -ForegroundColor Gray
Write-Host "      • Monitor: https://your-domain.vercel.app/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Configure Vercel notifications:" -ForegroundColor Gray
Write-Host "      Settings > Notifications" -ForegroundColor Gray
Write-Host ""
Write-Host "   5. Set up Slack/Discord webhooks for alerts" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Monitoring Endpoints:" -ForegroundColor Cyan
Write-Host "   • Health Check: /api/health" -ForegroundColor Gray
Write-Host "   • Analytics: Vercel Dashboard" -ForegroundColor Gray
Write-Host "   • Errors: Sentry Dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 All done!" -ForegroundColor Green

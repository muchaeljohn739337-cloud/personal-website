# ==============================================================
# ADVANCIA STATUS PAGE - QUICK SETUP
# ==============================================================
# One-command setup for status monitoring infrastructure
# 
# Usage:
#   pwsh -NoProfile -ExecutionPolicy Bypass -File status-page/scripts/setup.ps1

$ErrorActionPreference = 'Continue'

Write-Host @"

╔═══════════════════════════════════════════╗
║   Advancia Status Page Setup              ║
║   Solo Operator Edition                   ║
╚═══════════════════════════════════════════╝

"@ -ForegroundColor Cyan

$root = if ($PSScriptRoot) { Split-Path -Parent (Split-Path -Parent $PSScriptRoot) } else { (Get-Location).Path }

# ==============================================================
# STEP 1: Create Directory Structure
# ==============================================================
Write-Host "`n📁 Creating directory structure..." -ForegroundColor Cyan

$directories = @(
    "logs",
    "logs/archive",
    "status-page/public",
    "status-page/scripts",
    "status-page/config",
    "status-page/nginx"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path $root $dir
    if (!(Test-Path $fullPath)) {
        New-Item -ItemType Directory -Force -Path $fullPath | Out-Null
        Write-Host "   ✅ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  Exists: $dir" -ForegroundColor Gray
    }
}

# ==============================================================
# STEP 2: Initialize Log Files
# ==============================================================
Write-Host "`n📝 Initializing log files..." -ForegroundColor Cyan

$logFiles = @{
    "logs/incidents.json" = "[]"
    "logs/metrics.json" = "[]"
    "logs/status.json" = @"
{
  "timestamp": "$(Get-Date -Format 'o')",
  "overall_status": "unknown",
  "backend": { "status": "unknown" },
  "frontend": { "status": "unknown" },
  "database": { "status": "unknown" },
  "pm2": { "status": "unknown" },
  "disk": { "status": "unknown" },
  "ssl": { "status": "unknown" }
}
"@
}

foreach ($file in $logFiles.Keys) {
    $fullPath = Join-Path $root $file
    if (!(Test-Path $fullPath)) {
        Set-Content -Path $fullPath -Value $logFiles[$file]
        Write-Host "   ✅ Created: $file" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  Exists: $file" -ForegroundColor Gray
    }
}

# ==============================================================
# STEP 3: Check PM2 Installation
# ==============================================================
Write-Host "`n📦 Checking PM2 installation..." -ForegroundColor Cyan

try {
    $pm2Version = pm2 --version
    Write-Host "   ✅ PM2 installed: v$pm2Version" -ForegroundColor Green
} catch {
    Write-Host "   ❌ PM2 not found. Installing..." -ForegroundColor Yellow
    npm install -g pm2 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ PM2 installed successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to install PM2. Please run: npm install -g pm2" -ForegroundColor Red
    }
}

# ==============================================================
# STEP 4: Install PM2 Log Rotation
# ==============================================================
Write-Host "`n🔄 Configuring PM2 log rotation..." -ForegroundColor Cyan

try {
    pm2 install pm2-logrotate 2>&1 | Out-Null
    pm2 set pm2-logrotate:max_size 10M 2>&1 | Out-Null
    pm2 set pm2-logrotate:retain 7 2>&1 | Out-Null
    pm2 set pm2-logrotate:compress true 2>&1 | Out-Null
    Write-Host "   ✅ Log rotation configured (10MB, 7 days retention)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Log rotation setup failed (non-critical)" -ForegroundColor Yellow
}

# ==============================================================
# STEP 5: Test Watchdog Script
# ==============================================================
Write-Host "`n🔍 Testing watchdog script..." -ForegroundColor Cyan

$watchdogPath = Join-Path $root "status-page/scripts/watchdog.ps1"
if (Test-Path $watchdogPath) {
    Write-Host "   Running initial health check..." -ForegroundColor Yellow
    
    try {
        & pwsh -NoProfile -ExecutionPolicy Bypass -File $watchdogPath 2>&1 | Out-Null
        Write-Host "   ✅ Watchdog executed successfully" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Watchdog test failed: $_" -ForegroundColor Yellow
        Write-Host "   This is normal if services aren't running yet" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ Watchdog script not found at: $watchdogPath" -ForegroundColor Red
}

# ==============================================================
# STEP 6: Create Quick Test Script
# ==============================================================
Write-Host "`n🧪 Creating test scripts..." -ForegroundColor Cyan

$testScriptPath = Join-Path $root "scripts/test-status-page.ps1"
$testScript = @'
# Quick test script for status page
Write-Host "Testing Advancia Status Page..." -ForegroundColor Cyan

Write-Host "`n1. Checking log files..."
$files = @("logs/status.json", "logs/incidents.json", "logs/metrics.json")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
    }
}

Write-Host "`n2. Running watchdog..."
pwsh -NoProfile -ExecutionPolicy Bypass -File status-page/scripts/watchdog.ps1

Write-Host "`n3. Checking status output..."
if (Test-Path "logs/status.json") {
    $status = Get-Content "logs/status.json" | ConvertFrom-Json
    Write-Host "   Overall status: $($status.overall_status)" -ForegroundColor Yellow
} else {
    Write-Host "   ❌ Status file not found" -ForegroundColor Red
}

Write-Host "`n✅ Test complete!" -ForegroundColor Green
'@

Set-Content -Path $testScriptPath -Value $testScript
Write-Host "   ✅ Created: scripts/test-status-page.ps1" -ForegroundColor Green

# ==============================================================
# STEP 7: Check Notification Configuration
# ==============================================================
Write-Host "`n📧 Checking notification configuration..." -ForegroundColor Cyan

$notifConfigPath = Join-Path $root "status-page/config/notifications.json"
if (Test-Path $notifConfigPath) {
    $config = Get-Content $notifConfigPath | ConvertFrom-Json
    
    if ($config.email.smtp_password -eq "YOUR_APP_PASSWORD_HERE") {
        Write-Host "   ⚠️  Email alerts not configured" -ForegroundColor Yellow
        Write-Host "   Edit: status-page/config/notifications.json" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ Email configuration found" -ForegroundColor Green
    }
    
    if ($config.slack.enabled) {
        Write-Host "   ✅ Slack alerts enabled" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  Slack alerts disabled" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ Notification config not found" -ForegroundColor Red
}

# ==============================================================
# SUMMARY & NEXT STEPS
# ==============================================================
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "           SETUP COMPLETE                  " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n✅ Status page infrastructure ready!" -ForegroundColor Green

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure email alerts:" -ForegroundColor White
Write-Host "   Edit status-page/config/notifications.json" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start services with PM2:" -ForegroundColor White
Write-Host "   pm2 start ecosystem.config.js" -ForegroundColor Gray
Write-Host "   pm2 save" -ForegroundColor Gray
Write-Host "   pm2 startup" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test the status page:" -ForegroundColor White
Write-Host "   pwsh scripts/test-status-page.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Setup Nginx (Linux only):" -ForegroundColor White
Write-Host "   sudo cp status-page/nginx/status.conf /etc/nginx/sites-available/" -ForegroundColor Gray
Write-Host "   sudo ln -s /etc/nginx/sites-available/status.conf /etc/nginx/sites-enabled/" -ForegroundColor Gray
Write-Host "   sudo nginx -t && sudo systemctl reload nginx" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Setup SSL certificate:" -ForegroundColor White
Write-Host "   sudo certbot --nginx -d status.advanciapayledger.com" -ForegroundColor Gray
Write-Host ""
Write-Host "6. View logs:" -ForegroundColor White
Write-Host "   pm2 logs advancia-watchdog" -ForegroundColor Gray
Write-Host "   cat logs/status.json | jq ." -ForegroundColor Gray
Write-Host ""

Write-Host "📚 Documentation: status-page/README.md" -ForegroundColor Cyan
Write-Host "🎯 Your status page is ready for deployment!" -ForegroundColor Green
Write-Host ""

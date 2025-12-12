# Cloudflare Pages Deployment and Testing Script
# Run this script to deploy and test your KV storage functionality

Write-Host "🚀 Starting Cloudflare Pages Deployment and Testing" -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "📦 Checking Node.js and npm..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Wrangler authentication
Write-Host ""
Write-Host "🔐 Checking Wrangler authentication..." -ForegroundColor Yellow
try {
    $authResult = npx wrangler whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Wrangler authenticated" -ForegroundColor Green
    } else {
        throw "Authentication failed"
    }
} catch {
    Write-Host "❌ Wrangler not authenticated. Please run: npx wrangler auth login" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

    # Deploy to Cloudflare Pages
    Write-Host ""
    Write-Host "📦 Deploying to Cloudflare Pages..." -ForegroundColor Yellow
    try {
        Set-Location frontend
        $deployResult = npx wrangler pages deploy . --project-name advancia-platform 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deployment completed successfully" -ForegroundColor Green
        } else {
            throw "Deployment failed: $deployResult"
        }
    } catch {
        Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        Set-Location ..
        Read-Host "Press Enter to exit"
        exit 1
    }Set-Location ..

# Wait for deployment to propagate
Write-Host ""
Write-Host "⏳ Waiting for deployment to propagate (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Test KV functionality
Write-Host ""
Write-Host "🧪 Testing KV functionality..." -ForegroundColor Yellow
try {
    $testResult = node deploy-and-test.js 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ KV testing completed" -ForegroundColor Green
    } else {
        throw "Testing failed"
    }
} catch {
    Write-Host "❌ Testing failed: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Success message
Write-Host ""
Write-Host "🎉 Deployment and testing completed successfully!" -ForegroundColor Green
Write-Host "🌐 Your site is live at: https://advancia-platform.workers.dev" -ForegroundColor Cyan
Write-Host "🔗 Test KV functions at: https://advancia-platform.workers.dev/functions/test-kv" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
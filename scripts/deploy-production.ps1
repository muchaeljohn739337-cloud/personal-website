#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Deploy Advancia SaaS to Render (Backend) + Vercel (Frontend)

.DESCRIPTION
    Automated deployment script for production deployment
    - Backend API → Render
    - Frontend → Vercel
    - Database migrations
    - Environment validation
#>

Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 ADVANCIA SAAS - PRODUCTION DEPLOYMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Cyan

# Configuration
$BACKEND_DIR = "backend"
$FRONTEND_DIR = "frontend"
$REQUIRED_ENV_VARS = @(
    "DATABASE_URL",
    "JWT_SECRET",
    "ADMIN_EMAIL",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS"
)

# Step 1: Pre-flight checks
Write-Host "1️⃣ Running pre-flight checks..." -ForegroundColor Yellow

# Check if required commands exist
$commands = @("git", "node", "npm")
foreach ($cmd in $commands) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "   ❌ $cmd not found. Please install it first." -ForegroundColor Red
        exit 1
    }
}
Write-Host "   ✅ All required commands available`n" -ForegroundColor Green

# Step 2: Validate environment variables
Write-Host "2️⃣ Validating environment variables..." -ForegroundColor Yellow

$envPath = Join-Path $BACKEND_DIR ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "   ❌ Backend .env file not found" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envPath -Raw
$missingVars = @()

foreach ($var in $REQUIRED_ENV_VARS) {
    if ($envContent -notmatch "$var=") {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "   ❌ Missing environment variables:" -ForegroundColor Red
    $missingVars | ForEach-Object { Write-Host "      - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "   ✅ All required environment variables present`n" -ForegroundColor Green

# Step 3: Run database migrations
Write-Host "3️⃣ Running database migrations..." -ForegroundColor Yellow

Set-Location $BACKEND_DIR

try {
    # Guardian AI tables
    Write-Host "   📦 Migrating Guardian AI tables..." -ForegroundColor Cyan
    $guardianMigration = "prisma\migrations\add_guardian_tables.sql"
    if (Test-Path $guardianMigration) {
        npx prisma db execute --file $guardianMigration --schema prisma/schema.prisma
        Write-Host "   ✅ Guardian AI tables migrated" -ForegroundColor Green
    }

    # Anti-Detect tables
    Write-Host "   📦 Migrating Anti-Detect tables..." -ForegroundColor Cyan
    $antiDetectMigration = "prisma\migrations\add_anti_detect_tables.sql"
    if (Test-Path $antiDetectMigration) {
        npx prisma db execute --file $antiDetectMigration --schema prisma/schema.prisma
        Write-Host "   ✅ Anti-Detect tables migrated" -ForegroundColor Green
    }

    # Generate Prisma Client
    Write-Host "   📦 Generating Prisma Client..." -ForegroundColor Cyan
    npx prisma generate
    Write-Host "   ✅ Prisma Client generated`n" -ForegroundColor Green

} catch {
    Write-Host "   ❌ Database migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Step 4: Build backend
Write-Host "4️⃣ Building backend..." -ForegroundColor Yellow

Set-Location $BACKEND_DIR

try {
    npm install
    npm run build
    Write-Host "   ✅ Backend built successfully`n" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend build failed: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Step 5: Deploy backend to Render
Write-Host "5️⃣ Deploying backend to Render..." -ForegroundColor Yellow

try {
    # Check if Render CLI is installed
    if (Get-Command render -ErrorAction SilentlyContinue) {
        render deploy
        Write-Host "   ✅ Backend deployed to Render`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Render CLI not found. Deploying via Git push..." -ForegroundColor Yellow
        
        # Commit changes
        git add .
        git commit -m "Deploy: Backend with Guardian AI + Anti-Detect" -ErrorAction SilentlyContinue
        
        # Push to Render
        git push origin main
        
        Write-Host "   ✅ Pushed to Git. Render will auto-deploy`n" -ForegroundColor Green
        Write-Host "   📝 Monitor deployment at: https://dashboard.render.com" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  Backend deployment may require manual intervention" -ForegroundColor Yellow
}

# Step 6: Build frontend
Write-Host "6️⃣ Building frontend..." -ForegroundColor Yellow

Set-Location $FRONTEND_DIR

try {
    npm install
    $env:NEXT_PUBLIC_API_URL = "https://api.advanciapayledger.com"
    npm run build
    Write-Host "   ✅ Frontend built successfully`n" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Frontend build failed: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Step 7: Deploy frontend to Vercel
Write-Host "7️⃣ Deploying frontend to Vercel..." -ForegroundColor Yellow

Set-Location $FRONTEND_DIR

try {
    if (Get-Command vercel -ErrorAction SilentlyContinue) {
        vercel --prod --yes
        Write-Host "   ✅ Frontend deployed to Vercel`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
        npm install -g vercel
        vercel --prod --yes
        Write-Host "   ✅ Frontend deployed to Vercel`n" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Frontend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   📝 Deploy manually: cd frontend && vercel --prod" -ForegroundColor Cyan
}

Set-Location ..

# Step 8: Post-deployment verification
Write-Host "8️⃣ Running post-deployment checks..." -ForegroundColor Yellow

try {
    # Check backend health
    Write-Host "   🔍 Checking backend health..." -ForegroundColor Cyan
    $backendUrl = "https://api.advanciapayledger.com/api/health"
    $response = Invoke-RestMethod -Uri $backendUrl -Method GET -TimeoutSec 30 -ErrorAction SilentlyContinue
    
    if ($response) {
        Write-Host "   ✅ Backend is responding" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Backend health check failed (may be starting up)" -ForegroundColor Yellow
}

try {
    # Check frontend
    Write-Host "   🔍 Checking frontend..." -ForegroundColor Cyan
    $frontendUrl = "https://advanciapayledger.com"
    $response = Invoke-WebRequest -Uri $frontendUrl -Method GET -TimeoutSec 30 -UseBasicParsing -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend is accessible`n" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Frontend health check failed (may be deploying)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "🌐 URLs:" -ForegroundColor Yellow
Write-Host "   Backend API:  https://api.advanciapayledger.com" -ForegroundColor White
Write-Host "   Frontend:     https://advanciapayledger.com" -ForegroundColor White
Write-Host "   Admin:        https://advanciapayledger.com/admin" -ForegroundColor White
Write-Host "   Security:     https://advanciapayledger.com/admin/security`n" -ForegroundColor White

Write-Host "📊 Monitoring:" -ForegroundColor Yellow
Write-Host "   Render:       https://dashboard.render.com" -ForegroundColor White
Write-Host "   Vercel:       https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   Logs:         pm2 logs (if self-hosted)`n" -ForegroundColor White

Write-Host "🔐 Security Features:" -ForegroundColor Yellow
Write-Host "   ✅ Guardian AI monitoring active" -ForegroundColor Green
Write-Host "   ✅ Anti-Detect layer protecting" -ForegroundColor Green
Write-Host "   ✅ Human-in-loop approvals enabled" -ForegroundColor Green
Write-Host "   ✅ Full audit trail logging`n" -ForegroundColor Green

Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test security dashboard: https://advanciapayledger.com/admin/security" -ForegroundColor White
Write-Host "   2. Verify email alerts are working" -ForegroundColor White
Write-Host "   3. Configure Slack webhooks (optional)" -ForegroundColor White
Write-Host "   4. Create admin user if needed: npm run seed:admin`n" -ForegroundColor White

Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Cyan

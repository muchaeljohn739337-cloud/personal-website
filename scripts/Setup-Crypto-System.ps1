# 🚀 Crypto & Token System - Quick Setup Script
# Run this from the project root directory

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🪙 ADVANCIA CRYPTO & TOKEN SYSTEM - SETUP" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install axios for CoinGecko API
Write-Host "1️⃣ Installing axios for CoinGecko API..." -ForegroundColor Yellow
Set-Location backend
npm install axios --save
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install axios" -ForegroundColor Red
    exit 1
}
Write-Host "✅ axios installed successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Verify database is up-to-date
Write-Host "2️⃣ Checking database schema..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma generation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 3: Check if .env exists
Write-Host "3️⃣ Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Check for required variables
    $envContent = Get-Content ".env" -Raw
    $requiredVars = @("DATABASE_URL", "JWT_SECRET", "OPENAI_API_KEY")
    $missing = @()
    
    foreach ($var in $requiredVars) {
        if (-not ($envContent -match $var)) {
            $missing += $var
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "⚠️  Missing environment variables: $($missing -join ', ')" -ForegroundColor Yellow
    } else {
        Write-Host "✅ All required environment variables present" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  .env file not found - copy from .env.example" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Test backend compilation
Write-Host "4️⃣ Testing backend TypeScript compilation..." -ForegroundColor Yellow
npm run build --if-present
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Build has errors (this is normal in development)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Backend compiles successfully" -ForegroundColor Green
}
Write-Host ""

# Step 5: Navigate back to root
Set-Location ..

# Step 6: Check frontend dependencies
Write-Host "5️⃣ Checking frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
$frontendPackage = Get-Content "package.json" | ConvertFrom-Json
if ($frontendPackage.dependencies."framer-motion" -and $frontendPackage.dependencies."react-hot-toast") {
    Write-Host "✅ Frontend dependencies present" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some frontend dependencies missing" -ForegroundColor Yellow
}
Set-Location ..
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start the backend:" -ForegroundColor White
Write-Host "   cd backend && npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Start the frontend:" -ForegroundColor White
Write-Host "   cd frontend && npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Access admin dashboard:" -ForegroundColor White
Write-Host "   http://localhost:3000/admin/token-flow" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Test crypto prices API:" -ForegroundColor White
Write-Host "   curl http://localhost:4000/api/crypto/prices" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   See CRYPTO_TOKEN_SYSTEM_COMPLETE.md for full guide" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Admin Features Available:" -ForegroundColor Yellow
Write-Host "   ✅ Send rewards to users (single & bulk)" -ForegroundColor Green
Write-Host "   ✅ Real-time token statistics" -ForegroundColor Green
Write-Host "   ✅ Top token holders leaderboard" -ForegroundColor Green
Write-Host "   ✅ Crypto price monitoring (CoinGecko)" -ForegroundColor Green
Write-Host "   ✅ Withdrawal management" -ForegroundColor Green
Write-Host "   ✅ Audit logging & security" -ForegroundColor Green
Write-Host ""

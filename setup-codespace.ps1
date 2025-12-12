# Advancia Pay Ledger - Codespace Setup Script
# This script sets up the development environment as recommended

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 Setting Up Advancia Pay Ledger Codespace" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "📦 Checking Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version
Write-Host "   Node.js: $nodeVersion" -ForegroundColor Green
if (-not $nodeVersion) {
    Write-Host "   ❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "📦 Checking npm..." -ForegroundColor Cyan
$npmVersion = npm --version
Write-Host "   npm: $npmVersion" -ForegroundColor Green
Write-Host ""

# Step 1: Install root dependencies (if package.json exists)
if (Test-Path "package.json") {
    Write-Host "📦 Installing root dependencies..." -ForegroundColor Cyan
    npm install
    Write-Host "   ✅ Root dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Step 2: Setup Backend
Write-Host "⚙️  Setting up Backend..." -ForegroundColor Cyan
Set-Location backend

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "   ⚠️  .env file not found. Creating template..." -ForegroundColor Yellow
    
    $envTemplate = @"
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/advancia_ledger

# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Security
JWT_SECRET=dev-jwt-secret-change-in-production-min-32-chars
SESSION_SECRET=dev-session-secret-change-in-production
API_KEY=dev-api-key-change-in-production
ADMIN_KEY=dev-admin-key-change-in-production

# Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@advanciapayledger.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Stripe (optional for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# VAPID (Web Push - optional)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:support@advanciapayledger.com

# Redis (optional)
REDIS_URL=redis://localhost:6379
"@
    
    $envTemplate | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "   ✅ Created .env template. Please update with your values." -ForegroundColor Green
} else {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
}

# Install backend dependencies
Write-Host "   Installing backend dependencies..." -ForegroundColor Cyan
npm install
Write-Host "   ✅ Backend dependencies installed" -ForegroundColor Green

# Generate Prisma client
Write-Host "   Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate
Write-Host "   ✅ Prisma client generated" -ForegroundColor Green

# Check if database is accessible (optional)
Write-Host "   Checking database connection..." -ForegroundColor Cyan
try {
    $dbUrl = (Get-Content .env | Select-String "DATABASE_URL").ToString().Split("=")[1]
    if ($dbUrl -and $dbUrl -ne "postgresql://user:password@localhost:5432/advancia_ledger") {
        Write-Host "   ⚠️  Database URL configured. Run migration when ready:" -ForegroundColor Yellow
        Write-Host "      npx prisma migrate dev --name add_ai_bot_detection_system" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Using default DATABASE_URL. Update .env with your database URL." -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Could not check DATABASE_URL" -ForegroundColor Yellow
}

Set-Location ..
Write-Host ""

# Step 3: Setup Frontend
Write-Host "🎨 Setting up Frontend..." -ForegroundColor Cyan
Set-Location frontend

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "   ⚠️  .env.local not found. Creating template..." -ForegroundColor Yellow
    
    $frontendEnv = @"
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

# App Configuration
NEXT_PUBLIC_APP_NAME=Advancia PayLedger
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-nextauth-secret-change-in-production

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAGS=notifications,bonus_tokens,debit_card,crypto_recovery

# Stripe (optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# VAPID (optional)
NEXT_PUBLIC_VAPID_KEY=
"@
    
    $frontendEnv | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "   ✅ Created .env.local template" -ForegroundColor Green
} else {
    Write-Host "   ✅ .env.local exists" -ForegroundColor Green
}

# Install frontend dependencies
Write-Host "   Installing frontend dependencies..." -ForegroundColor Cyan
npm install
Write-Host "   ✅ Frontend dependencies installed" -ForegroundColor Green

Set-Location ..
Write-Host ""

# Step 4: Verify workspace configuration
Write-Host "📁 Verifying workspace configuration..." -ForegroundColor Cyan
if (Test-Path "modular-saas-platform.code-workspace") {
    Write-Host "   ✅ VS Code workspace file found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Workspace file not found" -ForegroundColor Yellow
}

# Step 5: Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure Environment Variables:" -ForegroundColor White
Write-Host "   • Update backend/.env with your DATABASE_URL" -ForegroundColor Gray
Write-Host "   • Update frontend/.env.local with your API URLs" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Run Database Migration:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npx prisma migrate dev --name add_ai_bot_detection_system" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start Development Servers:" -ForegroundColor White
Write-Host "   # Terminal 1 - Backend" -ForegroundColor Gray
Write-Host "   cd backend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Terminal 2 - Frontend" -ForegroundColor Gray
Write-Host "   cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Access Applications:" -ForegroundColor White
Write-Host "   • Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "   • Backend API: http://localhost:4000" -ForegroundColor Gray
Write-Host "   • Admin AI Training: http://localhost:3000/admin/ai-training" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan


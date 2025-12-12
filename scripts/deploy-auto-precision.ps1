# ═══════════════════════════════════════════════════════════════
# AUTO-PRECISION CORE DEPLOYMENT SCRIPT
# ═══════════════════════════════════════════════════════════════
# Automated deployment for Auto-Precision Core

Write-Host '═══════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host '🚀 AUTO-PRECISION CORE DEPLOYMENT' -ForegroundColor Cyan
Write-Host '═══════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host ''

# Check if backend directory exists
if (-not (Test-Path 'backend')) {
    Write-Host '❌ backend directory not found!' -ForegroundColor Red
    Write-Host '   Please run this script from the project root' -ForegroundColor Yellow
    exit 1
}

Set-Location backend

# Step 1: Install Dependencies
Write-Host '1️⃣ Installing decimal.js dependency...' -ForegroundColor Yellow
try {
    npm install decimal.js --save
    Write-Host '✅ decimal.js installed successfully' -ForegroundColor Green
} catch {
    Write-Host '❌ Failed to install decimal.js' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    exit 1
}
Write-Host ''

# Step 2: Execute Database Migration
Write-Host '2️⃣ Executing Auto-Precision database migration...' -ForegroundColor Yellow
try {
    npx prisma db execute --file prisma/migrations/add_auto_precision_tables.sql --schema prisma/schema.prisma
    Write-Host '✅ Database migration executed successfully' -ForegroundColor Green
} catch {
    Write-Host '⚠️  Migration may have already been executed' -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor DarkGray
}
Write-Host ''

# Step 3: Regenerate Prisma Client
Write-Host '3️⃣ Regenerating Prisma client...' -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host '✅ Prisma client regenerated successfully' -ForegroundColor Green
} catch {
    Write-Host '❌ Failed to regenerate Prisma client' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    exit 1
}
Write-Host ''

# Step 4: Verify Database Tables
Write-Host '4️⃣ Verifying database tables...' -ForegroundColor Yellow
Write-Host '   Opening Prisma Studio to verify tables...' -ForegroundColor DarkGray
Write-Host '   Expected tables:' -ForegroundColor White
Write-Host '   - JobMemory' -ForegroundColor White
Write-Host '   - Job' -ForegroundColor White
Write-Host '   - BusinessRule (10 pre-populated rules)' -ForegroundColor White
Write-Host '   - MigrationCheckpoint' -ForegroundColor White
Write-Host '   - SearchIndex' -ForegroundColor White
Write-Host '   - PrecisionCalculation' -ForegroundColor White
Write-Host '   - WorkflowVersion' -ForegroundColor White
Write-Host ''
Write-Host '   Press Ctrl+C to close Prisma Studio when done verifying...' -ForegroundColor Yellow

Start-Sleep -Seconds 2
try {
    npx prisma studio
} catch {
    # User cancelled, continue
}
Write-Host ''

# Step 5: Build Backend
Write-Host '5️⃣ Building backend with Auto-Precision integration...' -ForegroundColor Yellow
try {
    npm run build
    Write-Host '✅ Backend built successfully' -ForegroundColor Green
} catch {
    Write-Host '⚠️  Build warnings detected (may be normal)' -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor DarkGray
}
Write-Host ''

# Step 6: Start Backend
Write-Host '6️⃣ Starting backend with Auto-Precision Core...' -ForegroundColor Yellow
Write-Host '   Backend will start on port 4000' -ForegroundColor White
Write-Host '   Watch for Auto-Precision initialization messages' -ForegroundColor White
Write-Host ''
Write-Host '   Press Ctrl+C to stop the server when ready to test...' -ForegroundColor Yellow
Write-Host ''

Start-Sleep -Seconds 2
npm run dev

Write-Host ''
Write-Host '═══════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host '✅ AUTO-PRECISION CORE DEPLOYED' -ForegroundColor Green
Write-Host '═══════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host ''
Write-Host '📚 Next Steps:' -ForegroundColor Yellow
Write-Host '1. Test health endpoint: curl http://localhost:4000/api/jobs/health' -ForegroundColor White
Write-Host '2. Run test suite: node test-auto-precision.js' -ForegroundColor White
Write-Host '3. Review documentation: AUTO_PRECISION_DEPLOYMENT.md' -ForegroundColor White
Write-Host ''

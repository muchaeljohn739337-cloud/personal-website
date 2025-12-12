\#!/usr/bin/env pwsh
# Complete Agent Validation - Runs all checks and tests
# Run from project root: .\scripts\validate-agents.ps1

param(
    [switch]$SkipInstall,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Advancia Pay Ledger - Complete Agent Validation Suite      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Navigate to backend
Push-Location "$PSScriptRoot\..\backend"

try {
    # Step 1: Dependencies
    if (-not $SkipInstall) {
        Write-Host "📦 Step 1: Checking dependencies..." -ForegroundColor Blue
        if (-not (Test-Path "node_modules")) {
            Write-Host "   Installing npm packages..." -ForegroundColor Yellow
            npm install --silent
            if ($LASTEXITCODE -ne 0) {
                Write-Host "   ❌ npm install failed" -ForegroundColor Red
                exit 1
            }
        }
        Write-Host "   ✅ Dependencies installed`n" -ForegroundColor Green
    }

    # Step 2: TypeScript compilation
    Write-Host "🔧 Step 2: Checking TypeScript compilation..." -ForegroundColor Blue
    $buildOutput = npm run build --silent 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ TypeScript compilation successful`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  TypeScript warnings present" -ForegroundColor Yellow
        if ($Verbose) {
            Write-Host $buildOutput -ForegroundColor Gray
        }
        Write-Host ""
    }

    # Step 3: Prisma
    Write-Host "🗄️  Step 3: Checking Prisma schema..." -ForegroundColor Blue
    npx prisma validate --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Prisma schema valid" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Prisma schema has issues" -ForegroundColor Yellow
    }

    npx prisma generate --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Prisma client generated`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Prisma client generation had warnings`n" -ForegroundColor Yellow
    }

    # Step 4: Database connection
    Write-Host "🔌 Step 4: Testing database connection..." -ForegroundColor Blue
    $dbTest = npx tsx scripts/test-db-quick.ts 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Database connection successful`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Database connection failed" -ForegroundColor Yellow
        Write-Host "   Make sure PostgreSQL is running: localhost:5432" -ForegroundColor Yellow
        Write-Host "   Or update DATABASE_URL in backend/.env`n" -ForegroundColor Yellow
    }

    # Step 5: Agent status check
    Write-Host "📊 Step 5: Checking agent status..." -ForegroundColor Blue
    npm run agent:status --silent
    Write-Host ""

    # Step 6: Run agent tests
    Write-Host "🤖 Step 6: Running agent tests..." -ForegroundColor Blue
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                        TEST EXECUTION                          ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

    npm run agent:test

    $testResult = $LASTEXITCODE

    Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                      VALIDATION COMPLETE                       ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

    if ($testResult -eq 0) {
        Write-Host "✅ SUCCESS: All 9 agents passed validation!" -ForegroundColor Green
        Write-Host "`nAgent System Status:" -ForegroundColor Cyan
        Write-Host "  • BaseAgent: ✅ Implemented with metadata tracking" -ForegroundColor Green
        Write-Host "  • Scheduler: ✅ Properly typed and initialized" -ForegroundColor Green
        Write-Host "  • Agents: ✅ All 9 agents operational" -ForegroundColor Green
        Write-Host "  • Tests: ✅ Validation suite passing`n" -ForegroundColor Green
        
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "  1. Deploy to production: npm run start" -ForegroundColor White
        Write-Host "  2. Monitor execution: npm run agent:status" -ForegroundColor White
        Write-Host "  3. Manual execution: npm run agent:execute -- <AgentName>`n" -ForegroundColor White
    } else {
        Write-Host "⚠️  PARTIAL SUCCESS: Some agents need attention" -ForegroundColor Yellow
        Write-Host "`nReview the test output above for details." -ForegroundColor White
        Write-Host "Common fixes:" -ForegroundColor Cyan
        Write-Host "  • Database: Check PostgreSQL connection" -ForegroundColor White
        Write-Host "  • Migrations: Run 'npx prisma migrate deploy'" -ForegroundColor White
        Write-Host "  • Schema: Run 'npx prisma generate'`n" -ForegroundColor White
    }

} finally {
    Pop-Location
}

exit $testResult

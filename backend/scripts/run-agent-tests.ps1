#!/usr/bin/env pwsh
# Agent Test Runner - Validates all RPA agents
# Run from backend directory: .\scripts\run-agent-tests.ps1

Write-Host "`n🧪 Advancia Pay Ledger - Agent Test Suite`n" -ForegroundColor Cyan

# Step 1: Check if we're in backend directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Must run from backend directory" -ForegroundColor Red
    Write-Host "   Run: cd backend && .\scripts\run-agent-tests.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Step 1: Checking dependencies..." -ForegroundColor Blue
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "   ✅ Dependencies OK`n" -ForegroundColor Green

Write-Host "🗄️  Step 2: Testing database connection..." -ForegroundColor Blue
$dbTest = npm run --silent agent:status 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Database connection OK`n" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Warning: Database connection may have issues" -ForegroundColor Yellow
    Write-Host "   Make sure PostgreSQL is running on localhost:5432" -ForegroundColor Yellow
    Write-Host "   Or update DATABASE_URL in .env file`n" -ForegroundColor Yellow
}

Write-Host "🤖 Step 3: Running agent tests..." -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

npm run agent:test

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ All agent tests passed!" -ForegroundColor Green
    Write-Host "   All 9 RPA agents executed successfully`n" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed - see output above" -ForegroundColor Yellow
    Write-Host "   Check agent implementation or database connection`n" -ForegroundColor Yellow
    exit 1
}

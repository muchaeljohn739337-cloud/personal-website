#!/usr/bin/env pwsh
# Project Setup and Startup Script
# This script configures the environment and starts the development server

Write-Host "🚀 Project Setup and Startup" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# Step 1: Check Node version
Write-Host "1️⃣  Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "   Node.js: $nodeVersion" -ForegroundColor Green

# Step 2: Check if .env exists
Write-Host ""
Write-Host "2️⃣  Checking environment configuration..." -ForegroundColor Yellow
$envFile = ".env"
$envLocalFile = ".env.local"

if (Test-Path $envLocalFile) {
    Write-Host "   ✓ .env.local found" -ForegroundColor Green
    $envFile = $envLocalFile
} elseif (Test-Path $envFile) {
    Write-Host "   ✓ .env found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No .env file found" -ForegroundColor Yellow
    Write-Host "   Generating secrets..." -ForegroundColor Gray
    
    # Generate secrets
    node scripts/generate-secrets.js | Out-File -FilePath ".env.temp" -Encoding utf8
    
    Write-Host ""
    Write-Host "   📋 Generated secrets. Please:" -ForegroundColor Yellow
    Write-Host "   1. Copy the secrets from above" -ForegroundColor Gray
    Write-Host "   2. Create a .env.local file with:" -ForegroundColor Gray
    Write-Host "      - JWT_SECRET" -ForegroundColor Gray
    Write-Host "      - SESSION_SECRET" -ForegroundColor Gray
    Write-Host "      - NEXTAUTH_SECRET" -ForegroundColor Gray
    Write-Host "      - DATABASE_URL (from Supabase)" -ForegroundColor Gray
    Write-Host "      - NEXTAUTH_URL=http://localhost:3000" -ForegroundColor Gray
    Write-Host ""
    
    $continue = Read-Host "   Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Host "   Setup cancelled." -ForegroundColor Red
        exit 1
    }
}

# Step 3: Install dependencies (if needed)
Write-Host ""
Write-Host "3️⃣  Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    npm install
} else {
    Write-Host "   ✓ Dependencies installed" -ForegroundColor Green
}

# Step 4: Generate Prisma Client
Write-Host ""
Write-Host "4️⃣  Generating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "   ✓ Prisma Client generated" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Prisma generation failed, but continuing..." -ForegroundColor Yellow
}

# Step 5: Check database connection (optional)
Write-Host ""
Write-Host "5️⃣  Verifying setup..." -ForegroundColor Yellow

# Check required env vars
$requiredVars = @("JWT_SECRET", "SESSION_SECRET", "NEXTAUTH_SECRET", "DATABASE_URL")
$missingVars = @()

foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if (-not $value) {
        # Try reading from .env file
        if (Test-Path $envFile) {
            $content = Get-Content $envFile -Raw
            if ($content -notmatch "$var=") {
                $missingVars += $var
            }
        } else {
            $missingVars += $var
        }
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "   ⚠️  Missing environment variables: $($missingVars -join ', ')" -ForegroundColor Yellow
    Write-Host "   Some features may not work properly." -ForegroundColor Yellow
} else {
    Write-Host "   ✓ Environment variables configured" -ForegroundColor Green
}

# Step 6: Start development server
Write-Host ""
Write-Host "6️⃣  Starting development server..." -ForegroundColor Yellow
Write-Host "   Server will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start the dev server
npm run dev

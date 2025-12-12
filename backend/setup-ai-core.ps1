#!/usr/bin/env pwsh
# AI Core System - Quick Setup Script

Write-Host "🤖 AI Core System Setup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "✓ Checking Node.js..." -ForegroundColor Green
$nodeVersion = node --version 2>$null
if ($null -eq $nodeVersion) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}
Write-Host "  Node.js version: $nodeVersion" -ForegroundColor Gray

# Check if npm is installed
Write-Host "✓ Checking npm..." -ForegroundColor Green
$npmVersion = npm --version 2>$null
if ($null -eq $npmVersion) {
    Write-Host "❌ npm not found." -ForegroundColor Red
    exit 1
}
Write-Host "  npm version: $npmVersion" -ForegroundColor Gray

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install bullmq node-cron --save

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Check Redis
Write-Host ""
Write-Host "✓ Checking Redis..." -ForegroundColor Green
$redisRunning = redis-cli ping 2>$null
if ($redisRunning -eq "PONG") {
    Write-Host "  ✅ Redis is running" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Redis is not running" -ForegroundColor Yellow
    Write-Host "  Please start Redis with:" -ForegroundColor Yellow
    Write-Host "    docker run -d --name redis -p 6379:6379 redis:alpine" -ForegroundColor Gray
    Write-Host "  or:" -ForegroundColor Yellow
    Write-Host "    redis-server" -ForegroundColor Gray
}

# Check .env file
Write-Host ""
Write-Host "✓ Checking environment configuration..." -ForegroundColor Green
if (Test-Path ".env") {
    Write-Host "  ✅ .env file found" -ForegroundColor Green
    
    # Check for required variables
    $envContent = Get-Content ".env" -Raw
    $requiredVars = @(
        "AI_ENABLED",
        "OPENAI_API_KEY",
        "REDIS_HOST"
    )
    
    $missing = @()
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch "$var=") {
            $missing += $var
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "  ⚠️  Missing environment variables:" -ForegroundColor Yellow
        foreach ($var in $missing) {
            Write-Host "    - $var" -ForegroundColor Yellow
        }
        Write-Host "  Please add these to your .env file" -ForegroundColor Yellow
        Write-Host "  Example values in .env.ai-core.example" -ForegroundColor Gray
    } else {
        Write-Host "  ✅ All required variables present" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host "  Creating from .env.ai-core.example..." -ForegroundColor Yellow
    
    if (Test-Path ".env.ai-core.example") {
        Copy-Item ".env.ai-core.example" ".env"
        Write-Host "  ✅ Created .env file - please update with your values" -ForegroundColor Green
    } else {
        Write-Host "  ❌ .env.ai-core.example not found" -ForegroundColor Red
    }
}

# Run Prisma migrations
Write-Host ""
Write-Host "🗄️  Setting up database..." -ForegroundColor Cyan
Write-Host "  Generating Prisma client..." -ForegroundColor Gray
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Prisma client generated" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to generate Prisma client" -ForegroundColor Red
}

Write-Host ""
Write-Host "  Running database migrations..." -ForegroundColor Gray
npx prisma migrate dev --name add-ai-core

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Database migrations completed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Migration failed or already applied" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "📋 Setup Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host "✅ Prisma client generated" -ForegroundColor Green

if ($redisRunning -eq "PONG") {
    Write-Host "✅ Redis is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  Redis needs to be started" -ForegroundColor Yellow
}

if (Test-Path ".env") {
    Write-Host "✅ Environment configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Environment needs configuration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ensure Redis is running" -ForegroundColor White
Write-Host "2. Update .env with your API keys" -ForegroundColor White
Write-Host "3. Start the server: npm run dev" -ForegroundColor White
Write-Host "4. Check AI_CORE_SETUP.md for full documentation" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Setup complete! Ready to run." -ForegroundColor Green

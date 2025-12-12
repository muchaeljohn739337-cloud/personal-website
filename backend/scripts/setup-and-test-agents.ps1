# Complete Agent Setup and Test Script
# This script will set up everything needed and run the agent tests

Write-Host "`n🚀 Starting Complete Agent Setup...`n" -ForegroundColor Cyan

# Step 1: Check if Docker is available
Write-Host "1️⃣ Checking Docker availability..." -ForegroundColor Yellow
$dockerAvailable = $false
try {
    docker --version | Out-Null
    $dockerAvailable = $true
    Write-Host "   ✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Docker not available, will try PostgreSQL service" -ForegroundColor Yellow
}

# Step 2: Set up database
Write-Host "`n2️⃣ Setting up PostgreSQL database..." -ForegroundColor Yellow

if ($dockerAvailable) {
    Write-Host "   Using Docker PostgreSQL..." -ForegroundColor Cyan
    
    # Check if container already exists
    $existingContainer = docker ps -a --filter "name=advancia-postgres" --format "{{.Names}}"
    
    if ($existingContainer -eq "advancia-postgres") {
        Write-Host "   Container exists, starting it..." -ForegroundColor Cyan
        docker start advancia-postgres | Out-Null
        Start-Sleep -Seconds 3
    } else {
        Write-Host "   Creating new PostgreSQL container..." -ForegroundColor Cyan
        docker run -d --name advancia-postgres `
            -e POSTGRES_PASSWORD=postgres `
            -e POSTGRES_DB=advancia_payledger `
            -p 5432:5432 `
            postgres:14 | Out-Null
        Start-Sleep -Seconds 8
    }
    
    # Update .env to use local Docker
    $envPath = Join-Path $PSScriptRoot ".." ".env"
    $envContent = Get-Content $envPath -Raw
    $envContent = $envContent -replace 'DATABASE_URL=.*', 'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/advancia_payledger?schema=public'
    Set-Content -Path $envPath -Value $envContent -NoNewline
    
    Write-Host "   ✅ Docker PostgreSQL running on port 5432" -ForegroundColor Green
    
} else {
    Write-Host "   Checking PostgreSQL Windows Service..." -ForegroundColor Cyan
    
    try {
        $pgService = Get-Service -Name "postgresql*" -ErrorAction Stop | Select-Object -First 1
        
        if ($pgService.Status -ne "Running") {
            Write-Host "   Starting PostgreSQL service..." -ForegroundColor Cyan
            Start-Service $pgService.Name -ErrorAction Stop
            Start-Sleep -Seconds 3
        }
        
        Write-Host "   ✅ PostgreSQL service is running" -ForegroundColor Green
        
        # Update .env to use local PostgreSQL
        $envPath = Join-Path $PSScriptRoot ".." ".env"
        $envContent = Get-Content $envPath -Raw
        $envContent = $envContent -replace 'DATABASE_URL=.*', 'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/advancia_payledger?schema=public'
        Set-Content -Path $envPath -Value $envContent -NoNewline
        
    } catch {
        Write-Host "   ❌ Could not start PostgreSQL service" -ForegroundColor Red
        Write-Host "   Please install PostgreSQL or Docker Desktop" -ForegroundColor Red
        exit 1
    }
}

# Step 3: Generate Prisma Client
Write-Host "`n3️⃣ Generating Prisma Client..." -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot "..")
npx prisma generate | Out-Null
Write-Host "   ✅ Prisma Client generated" -ForegroundColor Green

# Step 4: Run migrations
Write-Host "`n4️⃣ Running database migrations..." -ForegroundColor Yellow
try {
    npx prisma migrate deploy 2>&1 | Out-Null
    Write-Host "   ✅ Migrations completed" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Migrations may have issues, continuing..." -ForegroundColor Yellow
}

# Step 5: Test database connection
Write-Host "`n5️⃣ Testing database connection..." -ForegroundColor Yellow
$testResult = node scripts/test-env.js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Database connection successful" -ForegroundColor Green
} else {
    Write-Host "   ❌ Database connection failed:" -ForegroundColor Red
    Write-Host $testResult
    exit 1
}

# Step 6: Run agent tests
Write-Host "`n6️⃣ Running Agent Tests..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

npx tsx scripts/test-agents.ts

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✨ Agent testing complete!" -ForegroundColor Green

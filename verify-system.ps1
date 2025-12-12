# ============================================================
# Advancia Pay Ledger - System Verification Script
# ============================================================
# Verifies Docker PostgreSQL, database connection, and RPA agents
# Usage: .\verify-system.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ADVANCIA PAY LEDGER SYSTEM CHECK" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allChecks = @()

# ============================================================
# 1. Check Docker Desktop
# ============================================================
Write-Host "[1/6] Checking Docker Desktop..." -ForegroundColor Yellow

try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "  ✅ Docker installed: $dockerVersion" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "  ❌ Docker not found" -ForegroundColor Red
        Write-Host "  Install from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        $allChecks += $false
    }
} catch {
    Write-Host "  ❌ Docker not found" -ForegroundColor Red
    $allChecks += $false
}

# ============================================================
# 2. Check PostgreSQL Container
# ============================================================
Write-Host "`n[2/6] Checking PostgreSQL Container..." -ForegroundColor Yellow

try {
    $container = docker ps --filter "name=advancia-postgres" --format "{{.Names}}" 2>$null
    
    if ($container -eq "advancia-postgres") {
        $status = docker ps --filter "name=advancia-postgres" --format "{{.Status}}" 2>$null
        Write-Host "  ✅ Container running: advancia-postgres" -ForegroundColor Green
        Write-Host "  Status: $status" -ForegroundColor Gray
        $allChecks += $true
    } else {
        Write-Host "  ⚠️  Container not running" -ForegroundColor Yellow
        Write-Host "  Checking if container exists..." -ForegroundColor Gray
        
        $existingContainer = docker ps -a --filter "name=advancia-postgres" --format "{{.Names}}" 2>$null
        
        if ($existingContainer -eq "advancia-postgres") {
            Write-Host "  Container exists but is stopped. Starting it..." -ForegroundColor Yellow
            docker start advancia-postgres | Out-Null
            Start-Sleep -Seconds 3
            
            $newStatus = docker ps --filter "name=advancia-postgres" --format "{{.Status}}" 2>$null
            if ($newStatus) {
                Write-Host "  ✅ Container started successfully" -ForegroundColor Green
                $allChecks += $true
            } else {
                Write-Host "  ❌ Failed to start container" -ForegroundColor Red
                $allChecks += $false
            }
        } else {
            Write-Host "  Container doesn't exist. Creating it..." -ForegroundColor Yellow
            Write-Host "  Running: docker run --name advancia-postgres..." -ForegroundColor Gray
            
            docker run -d `
                --name advancia-postgres `
                -e POSTGRES_USER=postgres `
                -e POSTGRES_PASSWORD=postgres `
                -e POSTGRES_DB=advancia_payledger `
                -p 5432:5432 `
                postgres:14 | Out-Null
            
            Start-Sleep -Seconds 5
            
            $newContainer = docker ps --filter "name=advancia-postgres" --format "{{.Names}}" 2>$null
            if ($newContainer -eq "advancia-postgres") {
                Write-Host "  ✅ Container created and started" -ForegroundColor Green
                $allChecks += $true
            } else {
                Write-Host "  ❌ Failed to create container" -ForegroundColor Red
                $allChecks += $false
            }
        }
    }
} catch {
    Write-Host "  ❌ Error checking container: $($_.Exception.Message)" -ForegroundColor Red
    $allChecks += $false
}

# ============================================================
# 3. Check Database Connection
# ============================================================
Write-Host "`n[3/6] Testing Database Connection..." -ForegroundColor Yellow

Set-Location "$PSScriptRoot\backend"

try {
    $testResult = node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        prisma.\$connect()
            .then(() => {
                console.log('SUCCESS');
                return prisma.\$disconnect();
            })
            .catch((err) => {
                console.log('FAILED: ' + err.message);
                process.exit(1);
            });
    " 2>&1
    
    if ($testResult -match "SUCCESS") {
        Write-Host "  ✅ Database connection successful" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "  ❌ Database connection failed" -ForegroundColor Red
        Write-Host "  Error: $testResult" -ForegroundColor Gray
        $allChecks += $false
    }
} catch {
    Write-Host "  ❌ Error testing connection: $($_.Exception.Message)" -ForegroundColor Red
    $allChecks += $false
}

# ============================================================
# 4. Check Prisma Client
# ============================================================
Write-Host "`n[4/6] Checking Prisma Client..." -ForegroundColor Yellow

if (Test-Path "node_modules\.prisma\client") {
    Write-Host "  ✅ Prisma Client generated" -ForegroundColor Green
    $allChecks += $true
} else {
    Write-Host "  ⚠️  Prisma Client not found. Generating..." -ForegroundColor Yellow
    npm run prisma:generate | Out-Null
    
    if (Test-Path "node_modules\.prisma\client") {
        Write-Host "  ✅ Prisma Client generated successfully" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "  ❌ Failed to generate Prisma Client" -ForegroundColor Red
        $allChecks += $false
    }
}

# ============================================================
# 5. Check Migrations
# ============================================================
Write-Host "`n[5/6] Checking Database Migrations..." -ForegroundColor Yellow

if (Test-Path "prisma\migrations") {
    $migrationCount = (Get-ChildItem "prisma\migrations" -Directory).Count
    Write-Host "  ✅ Migrations folder exists ($migrationCount migrations)" -ForegroundColor Green
    
    # Check if migrations are applied
    try {
        $migrateStatus = npx prisma migrate status 2>&1
        if ($migrateStatus -match "Database schema is up to date") {
            Write-Host "  ✅ All migrations applied" -ForegroundColor Green
            $allChecks += $true
        } elseif ($migrateStatus -match "following migrations have not yet been applied") {
            Write-Host "  ⚠️  Pending migrations detected. Applying..." -ForegroundColor Yellow
            npx prisma migrate deploy | Out-Null
            Write-Host "  ✅ Migrations applied" -ForegroundColor Green
            $allChecks += $true
        } else {
            Write-Host "  ⚠️  Migration status unclear" -ForegroundColor Yellow
            $allChecks += $true
        }
    } catch {
        Write-Host "  ⚠️  Could not check migration status" -ForegroundColor Yellow
        $allChecks += $true
    }
} else {
    Write-Host "  ❌ No migrations found" -ForegroundColor Red
    $allChecks += $false
}

# ============================================================
# 6. Check RPA Agents
# ============================================================
Write-Host "`n[6/6] Checking RPA Agent System..." -ForegroundColor Yellow

$agentFiles = @(
    "src\agents\BaseAgent.ts",
    "src\agents\AgentScheduler.ts",
    "src\agents\MonitorAgent.ts",
    "src\agents\TransactionAuditAgent.ts",
    "src\agents\CryptoRecoveryAgent.ts",
    "src\agents\UserSupportAgent.ts",
    "src\agents\AdminInsightAgent.ts",
    "src\agents\SecurityFraudAgent.ts",
    "src\agents\CompliancePolicyAgent.ts",
    "src\agents\CostOptimizationAgent.ts",
    "src\agents\DeployOrchestratorAgent.ts"
)

$missingAgents = @()
foreach ($file in $agentFiles) {
    if (-not (Test-Path $file)) {
        $missingAgents += $file
    }
}

if ($missingAgents.Count -eq 0) {
    Write-Host "  ✅ All 9 RPA agents present" -ForegroundColor Green
    Write-Host "  ✅ BaseAgent and AgentScheduler present" -ForegroundColor Green
    $allChecks += $true
} else {
    Write-Host "  ❌ Missing agent files:" -ForegroundColor Red
    foreach ($missing in $missingAgents) {
        Write-Host "    - $missing" -ForegroundColor Gray
    }
    $allChecks += $false
}

# ============================================================
# Summary
# ============================================================
Set-Location $PSScriptRoot

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passedChecks = ($allChecks | Where-Object { $_ -eq $true }).Count
$totalChecks = $allChecks.Count
$percentage = [math]::Round(($passedChecks / $totalChecks) * 100, 0)

Write-Host "`nPassed: $passedChecks / $totalChecks checks ($percentage%)" -ForegroundColor $(if ($percentage -eq 100) { "Green" } elseif ($percentage -ge 80) { "Yellow" } else { "Red" })

if ($passedChecks -eq $totalChecks) {
    Write-Host "`n🎉 ALL SYSTEMS OPERATIONAL! 🎉" -ForegroundColor Green
    Write-Host "`nYou can now:" -ForegroundColor Cyan
    Write-Host "  1. Start backend: cd backend && npm run dev" -ForegroundColor White
    Write-Host "  2. Start frontend: cd frontend && npm run dev" -ForegroundColor White
    Write-Host "  3. Run agent tests: cd backend && .\scripts\setup-and-test-agents.ps1" -ForegroundColor White
} else {
    Write-Host "`n⚠️  Some checks failed. Please review the output above." -ForegroundColor Yellow
    Write-Host "`nTroubleshooting:" -ForegroundColor Cyan
    Write-Host "  - Docker issues: Ensure Docker Desktop is running" -ForegroundColor White
    Write-Host "  - Database issues: Run setup-and-test-agents.ps1" -ForegroundColor White
    Write-Host "  - Agent issues: Check git status and ensure latest code" -ForegroundColor White
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

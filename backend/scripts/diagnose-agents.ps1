#!/usr/bin/env pwsh
# Quick diagnostic script to identify agent test issues

Write-Host "`n🔍 Advancia Pay Ledger - Agent Test Diagnostics`n" -ForegroundColor Cyan

$errors = 0

# Check 1: Are we in backend directory?
Write-Host "1️⃣  Checking current directory..." -ForegroundColor Blue
if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    if ($pkg.name -eq "advancia-pay-ledger-backend") {
        Write-Host "   ✅ In backend directory" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Wrong directory!" -ForegroundColor Yellow
        Write-Host "   Run: cd backend" -ForegroundColor White
        $errors++
    }
} else {
    Write-Host "   ❌ Not in backend directory" -ForegroundColor Red
    Write-Host "   Run: cd backend" -ForegroundColor White
    $errors++
}

# Check 2: Node modules
Write-Host "`n2️⃣  Checking dependencies..." -ForegroundColor Blue
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ node_modules missing" -ForegroundColor Red
    Write-Host "   Run: npm install" -ForegroundColor White
    $errors++
}

# Check 3: TypeScript
Write-Host "`n3️⃣  Checking TypeScript..." -ForegroundColor Blue
if (Test-Path "node_modules\.bin\tsx.cmd") {
    Write-Host "   ✅ tsx available" -ForegroundColor Green
} else {
    Write-Host "   ❌ tsx not installed" -ForegroundColor Red
    Write-Host "   Run: npm install" -ForegroundColor White
    $errors++
}

# Check 4: Prisma
Write-Host "`n4️⃣  Checking Prisma..." -ForegroundColor Blue
if (Test-Path "node_modules\.prisma\client") {
    Write-Host "   ✅ Prisma client generated" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Prisma client not generated" -ForegroundColor Yellow
    Write-Host "   Run: npx prisma generate" -ForegroundColor White
    $errors++
}

# Check 5: Environment file
Write-Host "`n5️⃣  Checking environment..." -ForegroundColor Blue
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "DATABASE_URL=.*localhost.*advancia_payledger") {
        Write-Host "   ✅ .env file exists with DATABASE_URL" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  DATABASE_URL may not be configured correctly" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ .env file missing" -ForegroundColor Red
    Write-Host "   Copy from .env.example" -ForegroundColor White
    $errors++
}

# Check 6: PostgreSQL (attempt connection)
Write-Host "`n6️⃣  Checking PostgreSQL..." -ForegroundColor Blue
try {
    $result = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($result.TcpTestSucceeded) {
        Write-Host "   ✅ PostgreSQL port 5432 is open" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Cannot connect to PostgreSQL on localhost:5432" -ForegroundColor Red
        Write-Host "   Start PostgreSQL or check DATABASE_URL" -ForegroundColor White
        $errors++
    }
} catch {
    Write-Host "   ⚠️  Could not test PostgreSQL connection" -ForegroundColor Yellow
}

# Check 7: Agent files
Write-Host "`n7️⃣  Checking agent files..." -ForegroundColor Blue
$agentFiles = @(
    "src\agents\BaseAgent.ts",
    "src\agents\scheduler.ts",
    "src\agents\MonitorAgent.ts",
    "scripts\test-agents.ts"
)
$missingFiles = @()
foreach ($file in $agentFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}
if ($missingFiles.Count -eq 0) {
    Write-Host "   ✅ All required agent files present" -ForegroundColor Green
} else {
    Write-Host "   ❌ Missing files:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "      - $_" -ForegroundColor White }
    $errors++
}

# Summary
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "✅ All checks passed! Ready to run tests." -ForegroundColor Green
    Write-Host "`nRun: npm run agent:test`n" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Found $errors issue(s). Fix them and try again." -ForegroundColor Yellow
    Write-Host "`nFix the issues above, then run: npm run agent:test`n" -ForegroundColor Cyan
}
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

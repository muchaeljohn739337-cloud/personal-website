# ==============================================================
# COMPREHENSIVE VALIDATION TEST SUITE
# ==============================================================
# Tests all critical components before production deployment
# Usage:
#   pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/validate-all.ps1

$ErrorActionPreference = 'Continue'

Write-Host @"

╔═══════════════════════════════════════════╗
║   Advancia - Comprehensive Validation    ║
║   Running All Tests...                    ║
╚═══════════════════════════════════════════╝

"@ -ForegroundColor Cyan

$root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }
$allPassed = $true

# ==============================================================
# TEST 1: Script Syntax Validation
# ==============================================================
Write-Host "`n🧪 TEST 1: PowerShell Script Syntax" -ForegroundColor Cyan
try {
  $null = [System.Management.Automation.PSParser]::Tokenize((Get-Content "$root\scripts\ADVANCIA-FULL-DEPLOY.ps1" -Raw), [ref]$null)
  Write-Host "   ✅ Deployment script syntax valid" -ForegroundColor Green
} catch {
  Write-Host "   ❌ Deployment script has syntax errors: $($_.Exception.Message)" -ForegroundColor Red
  $allPassed = $false
}

# ==============================================================
# TEST 2: Repository Structure
# ==============================================================
Write-Host "`n🧪 TEST 2: Repository Structure" -ForegroundColor Cyan
$requiredPaths = @(
  "backend",
  "frontend",
  "backend/package.json",
  "frontend/package.json",
  "backend/src",
  "frontend/src",
  "backend/prisma",
  "scripts"
)

foreach ($path in $requiredPaths) {
  $fullPath = Join-Path $root $path
  if (Test-Path $fullPath) {
    Write-Host "   ✅ $path exists" -ForegroundColor Green
  } else {
    Write-Host "   ❌ $path missing!" -ForegroundColor Red
    $allPassed = $false
  }
}

# ==============================================================
# TEST 3: Frontend Package Configuration
# ==============================================================
Write-Host "`n🧪 TEST 3: Frontend Package Configuration" -ForegroundColor Cyan
try {
  $pkg = Get-Content "$root\frontend\package.json" | ConvertFrom-Json
  Write-Host "   ✅ Name: $($pkg.name)" -ForegroundColor Green
  Write-Host "   ✅ React: $($pkg.dependencies.react)" -ForegroundColor Green
  Write-Host "   ✅ Next.js: $($pkg.dependencies.next)" -ForegroundColor Green
  
  # Check for AI SDKs (should not be present)
  if ($pkg.dependencies.'@vercel/ai' -or $pkg.dependencies.'ai') {
    Write-Host "   ⚠️  Client-side AI SDK detected (consider removing)" -ForegroundColor Yellow
  } else {
    Write-Host "   ✅ No client-side AI SDKs (optimal)" -ForegroundColor Green
  }
} catch {
  Write-Host "   ❌ Error reading frontend package.json: $($_.Exception.Message)" -ForegroundColor Red
  $allPassed = $false
}

# ==============================================================
# TEST 4: Backend Package Configuration
# ==============================================================
Write-Host "`n🧪 TEST 4: Backend Package Configuration" -ForegroundColor Cyan
try {
  $pkg = Get-Content "$root\backend\package.json" | ConvertFrom-Json
  Write-Host "   ✅ Name: $($pkg.name)" -ForegroundColor Green
  Write-Host "   ✅ TypeScript: $($pkg.devDependencies.typescript)" -ForegroundColor Green
  Write-Host "   ✅ Prisma: $($pkg.dependencies.'@prisma/client')" -ForegroundColor Green
  
  if ($pkg.scripts.build) {
    Write-Host "   ✅ Build script: $($pkg.scripts.build)" -ForegroundColor Green
  } else {
    Write-Host "   ❌ No build script defined!" -ForegroundColor Red
    $allPassed = $false
  }
} catch {
  Write-Host "   ❌ Error reading backend package.json: $($_.Exception.Message)" -ForegroundColor Red
  $allPassed = $false
}

# ==============================================================
# TEST 5: Environment Files
# ==============================================================
Write-Host "`n🧪 TEST 5: Environment Configuration" -ForegroundColor Cyan
$envFiles = @(
  "backend/.env",
  "backend/.env.example",
  "frontend/.env.example"
)

foreach ($envFile in $envFiles) {
  $fullPath = Join-Path $root $envFile
  if (Test-Path $fullPath) {
    Write-Host "   ✅ $envFile exists" -ForegroundColor Green
  } else {
    if ($envFile -like "*.example") {
      Write-Host "   ⚠️  $envFile missing (template)" -ForegroundColor Yellow
    } else {
      Write-Host "   ❌ $envFile missing!" -ForegroundColor Red
      $allPassed = $false
    }
  }
}

# ==============================================================
# TEST 6: Git Status
# ==============================================================
Write-Host "`n🧪 TEST 6: Git Repository Status" -ForegroundColor Cyan
try {
  Push-Location $root
  $status = git status --porcelain
  if ($status) {
    Write-Host "   ⚠️  Uncommitted changes detected:" -ForegroundColor Yellow
    $status | Select-Object -First 5 | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
  } else {
    Write-Host "   ✅ Working tree is clean" -ForegroundColor Green
  }
  
  $branch = git branch --show-current
  Write-Host "   ✅ Current branch: $branch" -ForegroundColor Green
  Pop-Location
} catch {
  Write-Host "   ⚠️  Not a git repository or git not available" -ForegroundColor Yellow
}

# ==============================================================
# TEST 7: Merge Conflicts Check
# ==============================================================
Write-Host "`n🧪 TEST 7: Merge Conflicts Check" -ForegroundColor Cyan
$conflictPatterns = Get-ChildItem -Path $root -Recurse -Include *.ps1,*.ts,*.tsx,*.js,*.jsx -File | 
  Select-String -Pattern "^<<<<<<< |^>>>>>>> |^=======$" -List |
  Select-Object -ExpandProperty Path -Unique

if ($conflictPatterns) {
  Write-Host "   ❌ Merge conflict markers found in:" -ForegroundColor Red
  $conflictPatterns | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
  $allPassed = $false
} else {
  Write-Host "   ✅ No merge conflicts detected" -ForegroundColor Green
}

# ==============================================================
# TEST 8: Duplicate Files Check
# ==============================================================
Write-Host "`n🧪 TEST 8: Duplicate/Backup Files Check" -ForegroundColor Cyan
$backupFiles = Get-ChildItem -Path $root -Recurse -Include *.backup,*.bak -File
if ($backupFiles) {
  Write-Host "   ⚠️  Backup files found (consider cleaning):" -ForegroundColor Yellow
  $backupFiles | Select-Object -First 3 | ForEach-Object { Write-Host "      $($_.Name)" -ForegroundColor Gray }
} else {
  Write-Host "   ✅ No backup files found" -ForegroundColor Green
}

# ==============================================================
# TEST 9: Node Modules Check
# ==============================================================
Write-Host "`n🧪 TEST 9: Dependencies Installation Status" -ForegroundColor Cyan
$backendModules = Test-Path "$root\backend\node_modules"
$frontendModules = Test-Path "$root\frontend\node_modules"

if ($backendModules) {
  Write-Host "   ✅ Backend node_modules installed" -ForegroundColor Green
} else {
  Write-Host "   ⚠️  Backend node_modules missing (run: cd backend && npm install)" -ForegroundColor Yellow
}

if ($frontendModules) {
  Write-Host "   ✅ Frontend node_modules installed" -ForegroundColor Green
} else {
  Write-Host "   ⚠️  Frontend node_modules missing (run: cd frontend && npm install)" -ForegroundColor Yellow
}

# ==============================================================
# TEST 10: Deployment Configuration
# ==============================================================
Write-Host "`n🧪 TEST 10: Deployment Configuration" -ForegroundColor Cyan
if ($env:RENDER_SERVICE_ID -and $env:RENDER_API_KEY) {
  Write-Host "   ✅ Render deployment configured" -ForegroundColor Green
} else {
  Write-Host "   ⚠️  Render deployment not configured (manual deploy required)" -ForegroundColor Yellow
}

if (Test-Path "$root\vercel.json") {
  Write-Host "   ✅ Vercel configuration found" -ForegroundColor Green
} else {
  Write-Host "   ℹ️  No vercel.json (can deploy via CLI)" -ForegroundColor Gray
}

# ==============================================================
# SUMMARY
# ==============================================================
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                 SUMMARY                   " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

if ($allPassed) {
  Write-Host "`n🎉 ALL CRITICAL TESTS PASSED!" -ForegroundColor Green
  Write-Host "`n✅ System is ready for deployment!" -ForegroundColor Green
  Write-Host "`nNext steps:" -ForegroundColor Yellow
  Write-Host "  1. Deploy frontend: cd frontend && npx vercel --prod" -ForegroundColor White
  Write-Host "  2. Deploy backend: Use Render dashboard or configure API keys" -ForegroundColor White
  Write-Host "  3. Run: scripts\ADVANCIA-FULL-DEPLOY.ps1" -ForegroundColor White
  exit 0
} else {
  Write-Host "`n⚠️  SOME TESTS FAILED!" -ForegroundColor Yellow
  Write-Host "`nPlease review the errors above before deploying." -ForegroundColor Yellow
  exit 1
}

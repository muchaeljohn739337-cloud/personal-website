Write-Host "🧠 RPA Fix Agent - Automated Issue Resolution" -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

$logDir = "$PSScriptRoot\..\logs"
if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Scan recent logs for issues
$logFiles = Get-ChildItem $logDir -Filter "*.txt" -ErrorAction SilentlyContinue | 
  Sort-Object LastWriteTime -Descending | 
  Select-Object -First 3

$fixCount = 0
$issues = @()

Write-Host "`n🔍 Scanning logs for issues..."

foreach ($log in $logFiles) {
  $content = Get-Content $log.FullName -Raw -ErrorAction SilentlyContinue
  
  # Check for module issues
  if ($content -match "Cannot find module|module not found|ERR_MODULE_NOT_FOUND") {
    $issues += "Missing npm modules detected"
    Write-Host "📦 Issue found: Missing npm modules" -ForegroundColor Yellow
    
    Write-Host "   Running npm install in backend..."
    Push-Location "$PSScriptRoot\..\backend"
    try {
      npm install
      $fixCount++
      Write-Host "   ✅ Backend dependencies installed" -ForegroundColor Green
    } catch {
      Write-Host "   ❌ Failed to install backend deps: $_" -ForegroundColor Red
    }
    Pop-Location
    
    Write-Host "   Running npm install in frontend..."
    Push-Location "$PSScriptRoot\..\frontend"
    try {
      npm install
      $fixCount++
      Write-Host "   ✅ Frontend dependencies installed" -ForegroundColor Green
    } catch {
      Write-Host "   ❌ Failed to install frontend deps: $_" -ForegroundColor Red
    }
    Pop-Location
  }
  
  # Check for Prisma issues
  if ($content -match "prisma|PrismaClient|schema\.prisma") {
    $issues += "Prisma schema/client issue detected"
    Write-Host "🧩 Issue found: Prisma needs regeneration" -ForegroundColor Yellow
    
    Push-Location "$PSScriptRoot\..\backend"
    try {
      Write-Host "   Generating Prisma client..."
      npx prisma generate
      
      Write-Host "   Deploying migrations..."
      npx prisma migrate deploy
      
      $fixCount++
      Write-Host "   ✅ Prisma fixed" -ForegroundColor Green
    } catch {
      Write-Host "   ❌ Prisma fix failed: $_" -ForegroundColor Red
    }
    Pop-Location
  }
  
  # Check for build failures
  if ($content -match "build failed|compilation error|TS\d{4}:") {
    $issues += "Build/compilation errors detected"
    Write-Host "🔧 Issue found: Build errors" -ForegroundColor Yellow
    
    Write-Host "   Attempting to rebuild..."
    try {
      Push-Location "$PSScriptRoot\..\backend"
      npm run build
      Pop-Location
      
      Push-Location "$PSScriptRoot\..\frontend"
      npm run build
      Pop-Location
      
      $fixCount++
      Write-Host "   ✅ Build successful" -ForegroundColor Green
    } catch {
      Write-Host "   ❌ Build still failing: $_" -ForegroundColor Red
    }
  }
  
  # Check for database connection issues
  if ($content -match "ECONNREFUSED|database.*connect|Connection refused") {
    $issues += "Database connection issue"
    Write-Host "🗄️ Issue found: Database connection problem" -ForegroundColor Yellow
    Write-Host "   Check DATABASE_URL in backend/.env" -ForegroundColor Yellow
  }
  
  # Check for port conflicts
  if ($content -match "EADDRINUSE|port.*already in use") {
    $issues += "Port conflict detected"
    Write-Host "🔌 Issue found: Port already in use" -ForegroundColor Yellow
    Write-Host "   Kill existing process or change port" -ForegroundColor Yellow
  }
}

Write-Host "`n📊 Summary:"
Write-Host "   Issues found: $($issues.Count)" -ForegroundColor $(if ($issues.Count -gt 0) { "Yellow" } else { "Green" })
Write-Host "   Fixes applied: $fixCount" -ForegroundColor $(if ($fixCount -gt 0) { "Green" } else { "Gray" })

if ($issues.Count -eq 0) {
  Write-Host "`n✅ No issues detected — system stable!" -ForegroundColor Green
} else {
  Write-Host "`n📋 Issues detected:" -ForegroundColor Yellow
  $issues | ForEach-Object { Write-Host "   - $_" }
  
  if ($fixCount -gt 0) {
    Write-Host "`n🔁 $fixCount automatic fix(es) applied." -ForegroundColor Green
    Write-Host "   Recommend restarting services to apply changes." -ForegroundColor Cyan
  } else {
    Write-Host "`n⚠️ Some issues require manual intervention." -ForegroundColor Yellow
  }
}

Write-Host "`n🏁 RPA Fix Agent completed.`n"

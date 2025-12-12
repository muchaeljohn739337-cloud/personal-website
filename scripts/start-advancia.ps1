Write-Host "🚀 Advancia Full System Startup — $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

# 🧹 Clean old Node processes
Write-Host "🧩 Cleaning Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 🧱 Paths
$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$root = Split-Path $scriptDir -Parent
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$logs = Join-Path $scriptDir "logs"

Write-Host "📁 Project root: $root" -ForegroundColor Gray
Write-Host "📁 Backend: $backend" -ForegroundColor Gray
Write-Host "📁 Frontend: $frontend" -ForegroundColor Gray

# Create logs directory
if (!(Test-Path $logs)) { 
    New-Item -ItemType Directory -Path $logs | Out-Null 
    Write-Host "✅ Created logs directory" -ForegroundColor Green
}

# 🔠 Local font safety
Write-Host "🔠 Ensuring local fonts..." -ForegroundColor Yellow
$layout = Join-Path $frontend "app\layout.tsx"
$css = Join-Path $frontend "styles\globals.css"
if (Test-Path $css) {
    $cssContent = Get-Content $css -Raw
    if ($cssContent -match "fonts.googleapis.com") {
        Write-Host "⚠ Removing Google Fonts references..." -ForegroundColor Yellow
        ($cssContent -split "`n") | Where-Object { $_ -notmatch "fonts.googleapis.com" } | Set-Content $css
    }
}

# ⚙ Backend Build
Write-Host "`n⚙ Building backend..." -ForegroundColor Cyan
Push-Location $backend
try {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    npm install --legacy-peer-deps --no-audit --no-fund 2>&1 | Out-Null
    
    Write-Host "🔨 Building backend TypeScript..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { 
        throw "Backend build failed with exit code $LASTEXITCODE" 
    }
    Write-Host "✅ Backend build successful" -ForegroundColor Green
    
    # 🧩 Prisma generate
    Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
    npx prisma generate 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "⚠ Prisma generate had warnings (continuing)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Prisma client generated" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend build error: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

# ⚙ Frontend Build
Write-Host "`n⚙ Building frontend..." -ForegroundColor Cyan
Push-Location $frontend
try {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install --legacy-peer-deps --no-audit --no-fund 2>&1 | Out-Null
    
    Write-Host "🧹 Cleaning .next directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    
    Write-Host "🔨 Building Next.js..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { 
        throw "Frontend build failed with exit code $LASTEXITCODE" 
    }
    Write-Host "✅ Frontend build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend build error: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

# 🚀 Start Servers
Write-Host "`n🚀 Starting servers..." -ForegroundColor Cyan

$backendJob = Start-Job -Name "BackendServer" -ScriptBlock {
    param($path)
    Set-Location $path
    npm start
} -ArgumentList $backend

$frontendJob = Start-Job -Name "FrontendServer" -ScriptBlock {
    param($path)
    Set-Location $path
    npm start
} -ArgumentList $frontend

Write-Host "⏳ Waiting for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# ✅ Health Checks
Write-Host "`n🔍 Running health checks..." -ForegroundColor Cyan

# Backend health check
$backendHealthy = $false
$backendRetries = 3
for ($i = 1; $i -le $backendRetries; $i++) {
    try {
        Write-Host "  Checking backend (attempt $i/$backendRetries)..." -ForegroundColor Gray
        $api = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 5
        if ($api.StatusCode -eq 200) { 
            Write-Host "✅ Backend is healthy (HTTP 200)" -ForegroundColor Green
            $backendHealthy = $true
            break
        }
    } catch {
        Write-Host "  ⚠ Attempt $i failed: $($_.Exception.Message)" -ForegroundColor Yellow
        if ($i -lt $backendRetries) { Start-Sleep -Seconds 5 }
    }
}

if (-not $backendHealthy) {
    Write-Host "❌ Backend health check failed after $backendRetries attempts" -ForegroundColor Red
}

# Frontend health check
$frontendHealthy = $false
$frontendRetries = 3
for ($i = 1; $i -le $frontendRetries; $i++) {
    try {
        Write-Host "  Checking frontend (attempt $i/$frontendRetries)..." -ForegroundColor Gray
        $web = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        if ($web.StatusCode -eq 200) { 
            Write-Host "✅ Frontend is healthy (HTTP 200)" -ForegroundColor Green
            $frontendHealthy = $true
            break
        }
    } catch {
        Write-Host "  ⚠ Attempt $i failed: $($_.Exception.Message)" -ForegroundColor Yellow
        if ($i -lt $frontendRetries) { Start-Sleep -Seconds 5 }
    }
}

if (-not $frontendHealthy) {
    Write-Host "❌ Frontend health check failed after $frontendRetries attempts" -ForegroundColor Red
}

# 🌐 Auto-open dashboards
if ($backendHealthy -and $frontendHealthy) {
    Write-Host "`n🌐 Opening Advancia dashboards..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000"
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3000/admin"
} else {
    Write-Host "`n⚠ Skipping browser launch due to health check failures" -ForegroundColor Yellow
}

# 🪵 Save logs
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logFile = Join-Path $logs "deploy-$timestamp.txt"
Write-Host "`n🪵 Saving startup log to: $logFile" -ForegroundColor Gray

$logContent = @"
=================================
Advancia Startup Log
=================================
Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Backend Healthy: $backendHealthy
Frontend Healthy: $frontendHealthy

=== Backend Job Output ===
$(Receive-Job $backendJob -ErrorAction SilentlyContinue | Out-String)

=== Frontend Job Output ===
$(Receive-Job $frontendJob -ErrorAction SilentlyContinue | Out-String)

=== Job Status ===
$(Get-Job | Format-Table -AutoSize | Out-String)
"@

$logContent | Out-File -FilePath $logFile -Encoding utf8

# 📊 Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 STARTUP SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "Backend Status:  $(if ($backendHealthy) { '✅ Running' } else { '❌ Failed' })" -ForegroundColor $(if ($backendHealthy) { 'Green' } else { 'Red' })
Write-Host "Frontend Status: $(if ($frontendHealthy) { '✅ Running' } else { '❌ Failed' })" -ForegroundColor $(if ($frontendHealthy) { 'Green' } else { 'Red' })
Write-Host "Log File:        $logFile" -ForegroundColor Gray
Write-Host ("=" * 60) -ForegroundColor Cyan

if ($backendHealthy -and $frontendHealthy) {
    Write-Host "`n🎯 System startup completed successfully!" -ForegroundColor Green
    Write-Host "   Backend:  http://localhost:4000" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   Admin:    http://localhost:3000/admin" -ForegroundColor Cyan
    Write-Host "`n💡 Press Ctrl+C to stop servers and view full logs" -ForegroundColor Yellow
    
    # Keep script running and show live logs
    try {
        while ($true) {
            Start-Sleep -Seconds 5
            # Check if jobs are still running
            if ((Get-Job -Name "BackendServer" -ErrorAction SilentlyContinue).State -ne "Running") {
                Write-Host "`n⚠ Backend job stopped unexpectedly!" -ForegroundColor Red
                break
            }
            if ((Get-Job -Name "FrontendServer" -ErrorAction SilentlyContinue).State -ne "Running") {
                Write-Host "`n⚠ Frontend job stopped unexpectedly!" -ForegroundColor Red
                break
            }
        }
    } finally {
        Write-Host "`n🛑 Shutting down servers..." -ForegroundColor Yellow
        Stop-Job -Name "BackendServer" -ErrorAction SilentlyContinue
        Stop-Job -Name "FrontendServer" -ErrorAction SilentlyContinue
        Remove-Job -Name "BackendServer" -ErrorAction SilentlyContinue
        Remove-Job -Name "FrontendServer" -ErrorAction SilentlyContinue
        Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Cleanup complete" -ForegroundColor Green
    }
} else {
    Write-Host "`n❌ Startup failed - check logs for details" -ForegroundColor Red
    Write-Host "   Log file: $logFile" -ForegroundColor Gray
    
    # Cleanup failed jobs
    Stop-Job -Name "BackendServer" -ErrorAction SilentlyContinue
    Stop-Job -Name "FrontendServer" -ErrorAction SilentlyContinue
    Remove-Job -Name "BackendServer" -ErrorAction SilentlyContinue
    Remove-Job -Name "FrontendServer" -ErrorAction SilentlyContinue
    
    exit 1
}

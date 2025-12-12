Write-Host "🚀 Advancia Full System Startup (Final Run) — $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

# 🧹 Clean old Node processes
Write-Host "🧩 Cleaning Node processes..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 🧱 Paths
$root = Split-Path $PSScriptRoot -Parent
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$logs = Join-Path $PSScriptRoot "logs"
if (!(Test-Path $logs)) { New-Item -ItemType Directory -Path $logs | Out-Null }

# 🔠 Local font safety
$layout = Join-Path $frontend "app\layout.tsx"
$css = Join-Path $frontend "styles\globals.css"
if (Test-Path $css) {
    (Get-Content $css) | Where-Object { $_ -notmatch "fonts.googleapis.com" } | Set-Content $css
}

# ⚙ Backend Build
Write-Host "⚙ Building backend..."
cd $backend
npm install --legacy-peer-deps --no-audit --no-fund
npm run build
if ($LASTEXITCODE -ne 0) { throw "❌ Backend build failed" }

# 🧩 Prisma generate
Write-Host "🔧 Generating Prisma client..."
npx prisma generate

# ⚙ Frontend Build
Write-Host "⚙ Building frontend..."
cd $frontend
npm install --legacy-peer-deps --no-audit --no-fund
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
if ($LASTEXITCODE -ne 0) { throw "❌ Frontend build failed" }

# 🚀 Start Servers
Write-Host "🚀 Starting backend + frontend servers..."
Start-Job -Name "Backend" -ScriptBlock { Set-Location $using:backend; npm start } | Out-Null
Start-Job -Name "Frontend" -ScriptBlock { Set-Location $using:frontend; npm start } | Out-Null
Start-Sleep -Seconds 15

# ✅ Health Checks
Write-Host "🔍 Checking backend health..."
try {
    $api = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 10
    if ($api.StatusCode -eq 200) { Write-Host "✅ Backend OK" -ForegroundColor Green }
    else { throw "Backend returned $($api.StatusCode)" }
} catch { Write-Host "⚠ Backend check failed: $($_.Exception.Message)" -ForegroundColor Yellow }

Write-Host "🔍 Checking frontend..."
try {
    $web = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
    if ($web.StatusCode -eq 200) { Write-Host "✅ Frontend OK" -ForegroundColor Green }
    else { throw "Frontend returned $($web.StatusCode)" }
} catch { Write-Host "⚠ Frontend check failed: $($_.Exception.Message)" -ForegroundColor Yellow }

# 🌐 Auto-open dashboards
Write-Host "🌐 Opening Advancia dashboards..."
Start-Process "http://localhost:3000"
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000/admin"

# 🪵 Save logs
$logFile = Join-Path $logs ("deploy-" + (Get-Date -Format 'yyyyMMdd-HHmm') + ".txt")
Write-Host "🪵 Saving log to $logFile"
Get-Job | Receive-Job | Out-File -Append $logFile -Encoding utf8

Write-Host "🎯 System startup completed successfully — everything running!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Job Status:" -ForegroundColor Cyan
Get-Job | Format-Table -AutoSize

Write-Host ""
Write-Host "💡 Quick Commands:" -ForegroundColor Yellow
Write-Host "   Stop all:      Get-Job | Stop-Job; Get-Job | Remove-Job"
Write-Host "   View logs:     Get-Job | Receive-Job"
Write-Host "   Backend logs:  Receive-Job -Name Backend -Keep"
Write-Host "   Frontend logs: Receive-Job -Name Frontend -Keep"

# ==============================================================
# ADVANCIA PAY LEDGER — FULL BUILD & DEPLOY WITH RPA
# ==============================================================
# Builds backend + frontend, optionally deploys to Render with monitoring
# Usage:
#   pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/ADVANCIA-FULL-DEPLOY.ps1

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# --- Logging setup -----------------------------------------------------------
$root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }
$logsDir = Join-Path $root 'scripts/logs'
if (!(Test-Path $logsDir)) { New-Item -ItemType Directory -Force -Path $logsDir | Out-Null }
$timestamp = [DateTime]::Now.ToString('yyyyMMdd-HHmmss')
$logFile = Join-Path $logsDir ("deploy-$timestamp.txt")
try { Start-Transcript -Path $logFile -Append | Out-Null } catch { }

Write-Host @"

╔═══════════════════════════════════════════╗
║   Advancia Pay Ledger - Full Deploy      ║
║   Automated Build → Test → Deploy        ║
╚═══════════════════════════════════════════╝

"@ -ForegroundColor Cyan

$startTime = Get-Date

# --- Helper Functions --------------------------------------------------------

function Load-Env($envPath) {
  if (Test-Path $envPath) {
    Write-Host "🔑 Loading environment from $envPath..." -ForegroundColor Gray
    Get-Content $envPath | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
      $kv = $_.Split('=', 2)
      [System.Environment]::SetEnvironmentVariable($kv[0].Trim(), $kv[1].Trim())
    }
    Write-Host "✅ Environment loaded" -ForegroundColor Green
  } else {
    Write-Host "⚠️ .env not found at $envPath - using system environment" -ForegroundColor Yellow
  }
}

function Invoke-Npm {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Label
  )
  Write-Host "`n🧱 Building $Label..." -ForegroundColor Cyan
  Push-Location $Path
  try {
    if (Test-Path 'package-lock.json') { npm ci } else { npm install }
    npm run build
    Write-Host "✅ $Label build succeeded" -ForegroundColor Green
    return $true
  } catch {
    Write-Host "❌ $Label build failed: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  } finally {
    Pop-Location
  }
}

function Test-Health {
  param(
    [Parameter(Mandatory=$true)][string]$Url,
    [Parameter(Mandatory=$true)][string]$Label
  )
  Write-Host "🔍 Testing $Label..." -NoNewline
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
      Write-Host " ✅ Healthy" -ForegroundColor Green
      return $true
    } else {
      Write-Host " ⚠️ Status $($response.StatusCode)" -ForegroundColor Yellow
      return $false
    }
  } catch {
    Write-Host " ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

function Trigger-RenderDeploy {
  if (-not $env:RENDER_SERVICE_ID -or -not $env:RENDER_API_KEY) {
    Write-Host "⚠️ RENDER_SERVICE_ID or RENDER_API_KEY not set - skipping Render deployment" -ForegroundColor Yellow
    return $null
  }
  
  Write-Host "`n🚀 Triggering Render deployment..." -ForegroundColor Cyan
  try {
    $headers = @{
      "Authorization" = "Bearer $env:RENDER_API_KEY"
      "Content-Type" = "application/json"
    }
    
    $payload = @{
      clearCache = $false
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$env:RENDER_SERVICE_ID/deploys" `
      -Method Post `
      -Headers $headers `
      -Body $payload
    
    if ($response.id) {
      Write-Host "✅ Deploy triggered - ID: $($response.id)" -ForegroundColor Green
      return $response.id
    } else {
      throw "No deploy ID returned"
    }
  } catch {
    Write-Host "❌ Render deploy failed: $($_.Exception.Message)" -ForegroundColor Red
    return $null
  }
}

function Monitor-RenderDeploy($deployId) {
  if (-not $deployId) {
    Write-Host "⚠️ No deploy ID to monitor" -ForegroundColor Yellow
    return $false
  }
  
  Write-Host "`n⏳ Monitoring deployment..." -ForegroundColor Cyan
  $maxAttempts = 30
  
  for ($i = 1; $i -le $maxAttempts; $i++) {
    Start-Sleep -Seconds 10
    
    try {
      $headers = @{ "Authorization" = "Bearer $env:RENDER_API_KEY" }
      $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$env:RENDER_SERVICE_ID/deploys/$deployId" `
        -Headers $headers
      
      $status = $response.status
      Write-Host "   [$i/$maxAttempts] Status: $status" -ForegroundColor Gray
      
      if ($status -eq "live") {
        Write-Host "🎉 Deployment succeeded!" -ForegroundColor Green
        return $true
      } elseif ($status -eq "failed") {
        Write-Host "❌ Deployment failed" -ForegroundColor Red
        return $false
      }
    } catch {
      Write-Host "   ⚠️ Error checking status: $($_.Exception.Message)" -ForegroundColor Yellow
    }
  }
  
  Write-Host "⏱️ Monitoring timeout - deploy may still be in progress" -ForegroundColor Yellow
  return $false
}

# --- Main Deployment Workflow ------------------------------------------------

try {
  $backend = Join-Path $root 'backend'
  $frontend = Join-Path $root 'frontend'

  if (!(Test-Path $backend)) { throw "Backend folder not found at $backend" }
  if (!(Test-Path $frontend)) { throw "Frontend folder not found at $frontend" }

  # Load environment
  Load-Env (Join-Path $backend '.env')

  # Run pre-flight checks (RPA agent if exists)
  $rpaAgent = Join-Path $PSScriptRoot 'rpa-fix-agent.ps1'
  if (Test-Path $rpaAgent) {
    Write-Host "`n🤖 Running pre-flight checks..." -ForegroundColor Cyan
    & $rpaAgent
  }

  # Build backend with retry
  $backendOk = Invoke-Npm -Path $backend -Label 'Backend'
  if (-not $backendOk) {
    Write-Host '🔁 Retrying backend build once...' -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    $backendOk = Invoke-Npm -Path $backend -Label 'Backend (Retry)'
  }

  # Build frontend
  $frontendOk = Invoke-Npm -Path $frontend -Label 'Frontend'

  if (-not $backendOk -or -not $frontendOk) {
    throw "Build failed - deployment aborted"
  }

  # Check if Render deployment is configured
  $deployId = Trigger-RenderDeploy

  if ($deployId) {
    # Render deployment path
    $deploySuccess = Monitor-RenderDeploy $deployId
    
    if ($deploySuccess) {
      Write-Host "`n🏥 Verifying production health..." -ForegroundColor Cyan
      Start-Sleep -Seconds 30
      
      $prodHealthy = Test-Health -Url "https://api.advanciapayledger.com/api/health" -Label "Production Backend"
      
      if ($prodHealthy) {
        $duration = (Get-Date) - $startTime
        Write-Host "`n🎉 PRODUCTION DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "   Duration: $([math]::Round($duration.TotalMinutes, 1)) minutes" -ForegroundColor Gray
        exit 0
      } else {
        throw "Production health check failed"
      }
    } else {
      throw "Render deployment did not complete successfully"
    }
  } else {
    # Local deployment path (fallback)
    Write-Host "`n🚀 Starting local servers..." -ForegroundColor Cyan
    Start-Job -ScriptBlock { Set-Location $using:backend; npm start } | Out-Null
    Start-Job -ScriptBlock { Set-Location $using:frontend; npm start } | Out-Null

    Write-Host "⏳ Waiting 15 seconds for servers to boot..." -ForegroundColor DarkCyan
    Start-Sleep -Seconds 15
    
    $backendOk = Test-Health -Url "http://localhost:4000/api/system/health" -Label "Backend API"
    $frontendOk = Test-Health -Url "http://localhost:3000" -Label "Frontend UI"

    if ($backendOk -and $frontendOk) {
      Write-Host '🎉 All systems operational locally.' -ForegroundColor Green
      Write-Host '💡 For production deployment, configure RENDER_SERVICE_ID and RENDER_API_KEY' -ForegroundColor Cyan
    } else {
      throw "Local health check failed"
    }
  }
}
catch {
  Write-Host "`n❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
finally {
  try { Stop-Transcript | Out-Null } catch { }
}

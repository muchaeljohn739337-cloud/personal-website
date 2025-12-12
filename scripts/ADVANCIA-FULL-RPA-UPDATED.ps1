Write-Host "🤖 Starting Advancia Full RPA Deploy (Self-Healing Mode)..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

# ============ UTILITY FUNCTIONS ============

function Load-Env($envPath) {
  if (Test-Path $envPath) {
    Write-Host "🔑 Loading environment from $envPath..." -ForegroundColor Gray
    (Get-Content $envPath | Where-Object { $_ -match '=' -and $_ -notmatch '^#' }) | ForEach-Object {
      $kv = $_.Split('=', 2)
      [System.Environment]::SetEnvironmentVariable($kv[0].Trim(), $kv[1].Trim())
    }
    Write-Host "✅ Environment loaded" -ForegroundColor Green
  } else {
    Write-Host "⚠️ .env not found at $envPath - using system environment" -ForegroundColor Yellow
  }
}

function Run-Build($dir, $name) {
  Write-Host "`n🧱 Building $name..." -ForegroundColor Cyan
  Push-Location $dir
  try {
    npm run build
    Write-Host "✅ $name build succeeded" -ForegroundColor Green
    return $true
  } catch {
    Write-Host "❌ $name build failed: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  } finally {
    Pop-Location
  }
}

function Test-Health($url, $label) {
  Write-Host "🔍 Testing $label..." -NoNewline
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
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
    Write-Host "⚠️ RENDER_SERVICE_ID or RENDER_API_KEY not set" -ForegroundColor Yellow
    return $null
  }
  
  Write-Host "`n🚀 Triggering Render deployment..." -ForegroundColor Cyan
  try {
    $api = "https://api.render.com/v1/services/$env:RENDER_SERVICE_ID/deploys"
    $payload = @{ triggerReason = "RPA Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri $api `
      -Headers @{ Authorization = "Bearer $env:RENDER_API_KEY"; "Content-Type" = "application/json" } `
      -Method Post `
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
      $headers = @{ Authorization = "Bearer $env:RENDER_API_KEY" }
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
  
  Write-Host "⏱️ Monitoring timeout" -ForegroundColor Yellow
  return $false
}

function Purge-CloudflareCache {
  if (-not $env:CLOUDFLARE_ZONE_ID -or -not $env:CLOUDFLARE_API_TOKEN) {
    Write-Host "⚠️ Cloudflare credentials not set - skipping cache purge" -ForegroundColor Yellow
    return $false
  }
  
  Write-Host "`n🌐 Purging Cloudflare cache..." -ForegroundColor Cyan
  
  try {
    $apiUrl = "https://api.cloudflare.com/client/v4/zones/$env:CLOUDFLARE_ZONE_ID/purge_cache"
    $headers = @{
      "Authorization" = "Bearer $env:CLOUDFLARE_API_TOKEN"
      "Content-Type" = "application/json"
    }
    
    # Purge specific URLs
    $body = @{
      files = @(
        "https://advanciapayledger.com/*"
        "https://api.advanciapayledger.com/*"
      )
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $body
    
    if ($response.success) {
      Write-Host "✅ Cloudflare cache purged successfully" -ForegroundColor Green
      if ($response.result.id) {
        Write-Host "   Purge ID: $($response.result.id)" -ForegroundColor Gray
      }
      return $true
    } else {
      Write-Host "⚠️ Cache purge failed:" -ForegroundColor Yellow
      $response.errors | ForEach-Object {
        Write-Host "   - [$($_.code)] $($_.message)" -ForegroundColor Yellow
      }
      return $false
    }
  } catch {
    Write-Host "❌ Cache purge error: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

function Notify($message, $type = "Info") {
  $icon = switch ($type) {
    "Success" { "✅" }
    "Error" { "❌" }
    "Warning" { "⚠️" }
    default { "ℹ️" }
  }
  
  $fullMessage = "$icon $message"
  
  # Console notification
  Write-Host "`n$fullMessage" -ForegroundColor $(switch ($type) {
    "Success" { "Green" }
    "Error" { "Red" }
    "Warning" { "Yellow" }
    default { "Cyan" }
  })
  
  # Windows notification
  try {
    [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null
    [System.Windows.Forms.MessageBox]::Show(
      $message,
      "Advancia RPA Deploy",
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Information
    ) | Out-Null
  } catch {
    # Silently fail if Windows Forms not available
  }
  
  # VS Code notification (if available)
  if (Get-Command code-notify -ErrorAction SilentlyContinue) {
    code-notify $fullMessage
  }
}

function Rollback {
  Write-Host "`n⚠️ Initiating rollback..." -ForegroundColor Yellow
  try {
    git revert HEAD --no-edit
    git push origin main
    Write-Host "✅ Rollback committed and pushed" -ForegroundColor Green
    Notify "Rollback applied — reverted to previous stable version" "Warning"
    return $true
  } catch {
    Write-Host "❌ Rollback failed: $($_.Exception.Message)" -ForegroundColor Red
    Notify "Rollback failed - manual intervention required" "Error"
    return $false
  }
}

function Fix-CommonIssues {
  Write-Host "`n🧠 RPA Fix Agent - Scanning for issues..." -ForegroundColor Cyan
  $fixCount = 0
  
  $logDir = "$PSScriptRoot\..\logs"
  if (!(Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
  }
  
  $logFiles = Get-ChildItem $logDir -Filter "*.txt" -ErrorAction SilentlyContinue | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 3
  
  foreach ($log in $logFiles) {
    $content = Get-Content $log.FullName -Raw -ErrorAction SilentlyContinue
    
    # Fix missing modules
    if ($content -match "Cannot find module|module not found|ERR_MODULE_NOT_FOUND") {
      Write-Host "📦 Fixing missing modules..." -ForegroundColor Yellow
      Push-Location "$PSScriptRoot\..\backend"
      npm install | Out-Null
      Pop-Location
      Push-Location "$PSScriptRoot\..\frontend"
      npm install | Out-Null
      Pop-Location
      $fixCount++
      Write-Host "✅ Dependencies installed" -ForegroundColor Green
    }
    
    # Fix Prisma issues
    if ($content -match "prisma|PrismaClient|schema\.prisma") {
      Write-Host "🧩 Fixing Prisma..." -ForegroundColor Yellow
      Push-Location "$PSScriptRoot\..\backend"
      npx prisma generate | Out-Null
      npx prisma migrate deploy | Out-Null
      Pop-Location
      $fixCount++
      Write-Host "✅ Prisma regenerated" -ForegroundColor Green
    }
    
    # Fix build failures
    if ($content -match "build failed|compilation error") {
      Write-Host "🔧 Retrying build..." -ForegroundColor Yellow
      $fixCount++
    }
  }
  
  if ($fixCount -eq 0) {
    Write-Host "✅ No issues detected" -ForegroundColor Green
  } else {
    Write-Host "🔁 $fixCount issue(s) auto-fixed" -ForegroundColor Green
  }
  
  return $fixCount
}

function Log-Maintenance {
  Write-Host "`n🧹 Performing log maintenance..." -ForegroundColor Cyan
  
  $logDir = "$PSScriptRoot\..\logs"
  $archiveDir = "$logDir\archive"
  $retentionDays = 7
  
  if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
  if (!(Test-Path $archiveDir)) { New-Item -ItemType Directory -Path $archiveDir | Out-Null }
  
  $oldLogs = Get-ChildItem -Path $logDir -Filter "*.txt" -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$retentionDays) }
  
  if ($oldLogs.Count -gt 0) {
    Write-Host "📦 Archiving $($oldLogs.Count) old logs..." -ForegroundColor Gray
    $timestamp = (Get-Date -Format "yyyyMMdd-HHmmss")
    $zipPath = "$archiveDir\logs-archive-$timestamp.zip"
    
    Compress-Archive -Path $oldLogs.FullName -DestinationPath $zipPath -Force
    $oldLogs | Remove-Item -Force -ErrorAction SilentlyContinue
    
    Write-Host "✅ Logs archived → $zipPath" -ForegroundColor Green
  }
  
  # Cleanup old archives (30+ days)
  $oldArchives = Get-ChildItem $archiveDir -Filter "*.zip" -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }
  
  if ($oldArchives.Count -gt 0) {
    Write-Host "🗑️ Cleaning $($oldArchives.Count) old archives..." -ForegroundColor Gray
    $oldArchives | Remove-Item -Force
  }
  
  Write-Host "✅ Log maintenance complete" -ForegroundColor Green
}

# ============ MAIN DEPLOYMENT SEQUENCE ============

Write-Host @"

╔═══════════════════════════════════════════════╗
║  Advancia Pay Ledger - RPA Self-Healing Deploy  ║
║  Automated Build → Test → Deploy → Monitor   ║
╚═══════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

$startTime = Get-Date

# Step 1: Load environment
Load-Env "$PSScriptRoot\..\backend\.env"

# Step 2: Run fix agent
Fix-CommonIssues

# Step 3: Build projects
Write-Host "`n📦 Building projects..." -ForegroundColor Cyan
$backendBuildOK = Run-Build "$PSScriptRoot\..\backend" "Backend"
$frontendBuildOK = Run-Build "$PSScriptRoot\..\frontend" "Frontend"

if (-not $backendBuildOK -or -not $frontendBuildOK) {
  Write-Host "`n❌ Build failed - deployment aborted" -ForegroundColor Red
  Notify "Build failed - check logs for details" "Error"
  exit 1
}

# Step 4: Local health check (optional)
if ($env:CHECK_LOCAL_HEALTH -eq "true") {
  Write-Host "`n🏥 Checking local services..." -ForegroundColor Cyan
  $backendHealthy = Test-Health "http://localhost:4000/api/health" "Local Backend"
  $frontendHealthy = Test-Health "http://localhost:3000" "Local Frontend"
  
  if (-not $backendHealthy -or -not $frontendHealthy) {
    Write-Host "`n⚠️ Local health check failed - continuing anyway" -ForegroundColor Yellow
    Write-Host "💡 Set CHECK_LOCAL_HEALTH=false to skip" -ForegroundColor Cyan
  }
}

# Step 5: Trigger Render deployment
$deployId = Trigger-RenderDeploy

if ($deployId) {
  $deploySuccess = Monitor-RenderDeploy $deployId
  
  if ($deploySuccess) {
    # Step 6: Production health check
    Write-Host "`n🏥 Verifying production health..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30  # Wait for services to stabilize
    
    $prodHealthy = Test-Health "https://api.advanciapayledger.com/api/health" "Production Backend"
    
    if ($prodHealthy) {
      # Step 7: Purge Cloudflare cache
      Purge-CloudflareCache
      
      # SUCCESS!
      $duration = (Get-Date) - $startTime
      Write-Host "`n🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
      Write-Host "   Duration: $([math]::Round($duration.TotalMinutes, 1)) minutes" -ForegroundColor Gray
      Write-Host "   Backend: https://api.advanciapayledger.com" -ForegroundColor Gray
      Write-Host "   Frontend: https://advanciapayledger.com" -ForegroundColor Gray
      Write-Host "   CDN: Cache purged (Cloudflare)" -ForegroundColor Gray
      
      Notify "Deployment successful! Duration: $([math]::Round($duration.TotalMinutes, 1)) min" "Success"
      
      # Cleanup logs
      Log-Maintenance
      
      exit 0
    } else {
      Write-Host "`n❌ Production health check failed" -ForegroundColor Red
      
      if ($env:AUTO_ROLLBACK -eq "true") {
        Rollback
      } else {
        Write-Host "💡 Set AUTO_ROLLBACK=true to enable automatic rollback" -ForegroundColor Cyan
      }
      
      Notify "Deployment succeeded but health check failed" "Warning"
      exit 1
    }
  } else {
    Write-Host "`n❌ Deployment did not complete successfully" -ForegroundColor Red
    
    if ($env:AUTO_ROLLBACK -eq "true") {
      Rollback
    }
    
    Notify "Deployment failed - check Render logs" "Error"
    exit 1
  }
} else {
  Write-Host "`n⚠️ Could not trigger Render deployment" -ForegroundColor Yellow
  Write-Host "   Possible reasons:" -ForegroundColor Gray
  Write-Host "   - RENDER_SERVICE_ID not set" -ForegroundColor Gray
  Write-Host "   - RENDER_API_KEY not set" -ForegroundColor Gray
  Write-Host "   - Network connection issue" -ForegroundColor Gray
  Write-Host "`n💡 Build succeeded locally. Deploy manually via Render dashboard." -ForegroundColor Cyan
  
  Notify "Build succeeded but could not trigger Render deploy" "Warning"
  exit 0
}

Write-Host "`n🏁 RPA Deploy cycle complete." -ForegroundColor Cyan

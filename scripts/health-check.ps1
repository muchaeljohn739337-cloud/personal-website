Write-Host "🏥 Advancia Health Monitor" -ForegroundColor Cyan
$ErrorActionPreference = "Continue"

# Service endpoints to check
$services = @{
  "Backend API" = "https://api.advanciapayledger.com/api/health"
  "Frontend" = "https://advanciapayledger.com"
}

$failed = @()
$healthy = @()

Write-Host "`n🔍 Checking system health...`n"

foreach ($serviceName in $services.Keys) {
  $url = $services[$serviceName]
  Write-Host "Testing $serviceName..." -NoNewline
  
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
      Write-Host " ✅ Online (HTTP $($response.StatusCode))" -ForegroundColor Green
      $healthy += $serviceName
    } else {
      Write-Host " ⚠️ Unusual status: HTTP $($response.StatusCode)" -ForegroundColor Yellow
      $failed += @{ Service = $serviceName; Reason = "HTTP $($response.StatusCode)" }
    }
  } catch {
    Write-Host " ❌ Failed" -ForegroundColor Red
    $reason = $_.Exception.Message
    if ($reason -match "timeout") { $reason = "Connection timeout" }
    elseif ($reason -match "refused") { $reason = "Connection refused" }
    elseif ($reason -match "404") { $reason = "Endpoint not found (404)" }
    
    $failed += @{ Service = $serviceName; Reason = $reason; URL = $url }
  }
}

Write-Host "`n📊 Health Summary:"
Write-Host "   Healthy services: $($healthy.Count)/$($services.Count)" -ForegroundColor Green
Write-Host "   Failed services: $($failed.Count)/$($services.Count)" -ForegroundColor $(if ($failed.Count -gt 0) { "Red" } else { "Green" })

if ($failed.Count -gt 0) {
  Write-Host "`n❌ Failed Services:" -ForegroundColor Red
  foreach ($fail in $failed) {
    Write-Host "   - $($fail.Service): $($fail.Reason)" -ForegroundColor Yellow
    if ($fail.URL) {
      Write-Host "     URL: $($fail.URL)" -ForegroundColor Gray
    }
  }
  
  Write-Host "`n⚠️ System is degraded. Consider:" -ForegroundColor Yellow
  Write-Host "   1. Check Render dashboard for service status"
  Write-Host "   2. Review recent deployments"
  Write-Host "   3. Check environment variables"
  Write-Host "   4. Restart services if needed"
  
  # Auto-restart option
  if ($env:AUTO_RESTART -eq "true") {
    Write-Host "`n🔄 AUTO_RESTART enabled - triggering redeploy..."
    & "$PSScriptRoot\ADVANCIA-FULL-DEPLOY.ps1"
  } else {
    Write-Host "`n💡 To enable auto-restart, set AUTO_RESTART=true in environment"
  }
  
  exit 1
} else {
  Write-Host "`n✅ All systems operational!`n" -ForegroundColor Green
  exit 0
}

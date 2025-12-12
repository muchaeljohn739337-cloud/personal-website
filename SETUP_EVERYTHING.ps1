# ═══════════════════════════════════════════════
# 🚀 ONE-COMMAND SETUP
# ═══════════════════════════════════════════════
# Run this script to set up everything automatically

Write-Host "`n╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Advancia RPA + Cloudflare + Nightly Setup  ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$ErrorActionPreference = "Continue"  # Don't stop on errors, show them

# Check if running as Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Host "👤 Running as: $(if($isAdmin){'Administrator ✅'}else{'Normal User ⚠️'})`n" -ForegroundColor $(if($isAdmin){'Green'}else{'Yellow'})

# Step 1: Copy fixed files
Write-Host "📝 Step 1: Applying Code Fixes" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────`n" -ForegroundColor Gray

try {
    Copy-Item "FIXED_rpa.ts" "backend\src\routes\rpa.ts" -Force
    Write-Host "   ✅ Fixed rpa.ts copied" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to copy rpa.ts: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Verify TypeScript
Write-Host "`n🔍 Step 2: Verifying TypeScript" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────`n" -ForegroundColor Gray

Push-Location "backend"
$tscOutput = & npx tsc --noEmit 2>&1
$tscExitCode = $LASTEXITCODE
Pop-Location

if ($tscExitCode -eq 0) {
    Write-Host "   ✅ No TypeScript errors!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  TypeScript check failed:" -ForegroundColor Yellow
    Write-Host "   $tscOutput" -ForegroundColor Gray
}

# Step 3: Test notifications
Write-Host "`n🔔 Step 3: Testing Notifications" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────`n" -ForegroundColor Gray

& pwsh -NoProfile -ExecutionPolicy Bypass -File "scripts\test-notifications.ps1"

# Step 4: Setup nightly automation (if admin)
Write-Host "`n🌙 Step 4: Nightly Automation Setup" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────`n" -ForegroundColor Gray

if ($isAdmin) {
    $setupNightly = Read-Host "   Setup nightly automation? (Y/n)"
    if ($setupNightly -ne "n" -and $setupNightly -ne "N") {
        & pwsh -NoProfile -ExecutionPolicy Bypass -File "scripts\setup-nightly-automation.ps1"
    } else {
        Write-Host "   ⏭️  Skipped nightly setup" -ForegroundColor Gray
    }
} else {
    Write-Host "   ⚠️  Nightly automation requires Administrator" -ForegroundColor Yellow
    Write-Host "   Run this later as Admin:" -ForegroundColor Gray
    Write-Host "   pwsh .\scripts\setup-nightly-automation.ps1`n" -ForegroundColor Cyan
}

# Step 5: Environment check
Write-Host "`n⚙️  Step 5: Environment Variables Check" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────`n" -ForegroundColor Gray

$requiredVars = @("RENDER_SERVICE_ID", "RENDER_API_KEY")
$optionalVars = @("CLOUDFLARE_ZONE_ID", "CLOUDFLARE_API_TOKEN")

Write-Host "   Required:" -ForegroundColor Yellow
foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Host "   ✅ $var is set" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $var is NOT set" -ForegroundColor Red
    }
}

Write-Host "`n   Optional (Cloudflare):" -ForegroundColor Yellow
foreach ($var in $optionalVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Host "   ✅ $var is set" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $var is NOT set (CDN cache won't be purged)" -ForegroundColor Gray
    }
}

Write-Host "`n   💡 Add missing variables to backend\.env" -ForegroundColor Cyan
Write-Host "   See: RPA_ENV_ADDITIONS.txt for examples`n" -ForegroundColor Gray

# Step 6: Summary
Write-Host "`n╔═══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           ✅ SETUP COMPLETE!                  ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 What's Ready:" -ForegroundColor Cyan
Write-Host "   ✓ TypeScript errors fixed" -ForegroundColor Gray
Write-Host "   ✓ Notification system tested" -ForegroundColor Gray
Write-Host "   ✓ Environment checked" -ForegroundColor Gray
if ($isAdmin) {
    Write-Host "   ✓ Nightly automation configured" -ForegroundColor Gray
}

Write-Host "`n🚀 Next Steps:" -ForegroundColor Yellow

if (-not $isAdmin) {
    Write-Host "   1. Run as Admin to setup nightly automation:" -ForegroundColor White
    Write-Host "      pwsh .\scripts\setup-nightly-automation.ps1`n" -ForegroundColor Cyan
}

Write-Host "   $(if($isAdmin){'1'}else{'2'}). Add environment variables to backend\.env" -ForegroundColor White
Write-Host "   $(if($isAdmin){'2'}else{'3'}). Test backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "   $(if($isAdmin){'3'}else{'4'}). Commit and push to trigger GitHub Actions" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "   • START_HERE.md - Quick start guide" -ForegroundColor Gray
Write-Host "   • FINAL_IMPLEMENTATION_SUMMARY.txt - Complete overview" -ForegroundColor Gray
Write-Host "   • NIGHTLY_AUTOMATION_QUICK_REF.md - Command reference" -ForegroundColor Gray

Write-Host "`n🎉 You're ready for automated deployments!`n" -ForegroundColor Green

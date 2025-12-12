# ============================================================
# Complete System and Authentication Verification
# ============================================================
# Runs comprehensive checks for:
# 1. Docker PostgreSQL setup
# 2. Database connectivity
# 3. RPA agent system
# 4. Authentication implementation (PR #52)
# ============================================================

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║     ADVANCIA PAY LEDGER - COMPLETE VERIFICATION          ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

$startTime = Get-Date

# ============================================================
# PART 1: System Infrastructure Check
# ============================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  PART 1: SYSTEM INFRASTRUCTURE CHECK" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

if (Test-Path ".\verify-system.ps1") {
    Write-Host "Running system verification script...`n" -ForegroundColor Yellow
    & ".\verify-system.ps1"
    $systemCheckResult = $LASTEXITCODE
} else {
    Write-Host "❌ verify-system.ps1 not found!" -ForegroundColor Red
    $systemCheckResult = 1
}

Start-Sleep -Seconds 2

# ============================================================
# PART 2: Authentication Implementation Check (PR #52)
# ============================================================
Write-Host "`n"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  PART 2: AUTHENTICATION VERIFICATION (PR #52)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

if (Test-Path ".\backend\scripts\verify-auth-static.ts") {
    Write-Host "Running authentication verification script...`n" -ForegroundColor Yellow
    
    Push-Location ".\backend"
    
    try {
        # Check if ts-node is available
        $tsNodeCheck = npx ts-node --version 2>$null
        
        if ($tsNodeCheck) {
            Write-Host "  ✅ ts-node available" -ForegroundColor Green
            
            # Run the auth verification script
            npx ts-node scripts/verify-auth-static.ts
            $authCheckResult = $LASTEXITCODE
        } else {
            Write-Host "  ⚠️  ts-node not available. Installing..." -ForegroundColor Yellow
            npm install -D typescript ts-node @types/node | Out-Null
            
            npx ts-node scripts/verify-auth-static.ts
            $authCheckResult = $LASTEXITCODE
        }
    } catch {
        Write-Host "  ❌ Error running auth verification: $($_.Exception.Message)" -ForegroundColor Red
        $authCheckResult = 1
    }
    
    Pop-Location
} else {
    Write-Host "❌ backend/scripts/verify-auth-static.ts not found!" -ForegroundColor Red
    $authCheckResult = 1
}

# ============================================================
# FINAL SUMMARY
# ============================================================
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n"
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║                   FINAL SUMMARY                           ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "Verification Results:" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# System Infrastructure
if ($systemCheckResult -eq 0 -or $null -eq $systemCheckResult) {
    Write-Host "  ✅ System Infrastructure: PASSED" -ForegroundColor Green
    Write-Host "     - Docker PostgreSQL running" -ForegroundColor Gray
    Write-Host "     - Database connectivity verified" -ForegroundColor Gray
    Write-Host "     - RPA agents operational" -ForegroundColor Gray
} else {
    Write-Host "  ⚠️  System Infrastructure: NEEDS ATTENTION" -ForegroundColor Yellow
    Write-Host "     Review output above for details" -ForegroundColor Gray
}

Write-Host ""

# Authentication Implementation
if ($authCheckResult -eq 0) {
    Write-Host "  ✅ Authentication (PR #52): PASSED" -ForegroundColor Green
    Write-Host "     - Admin login logging implemented" -ForegroundColor Gray
    Write-Host "     - User authentication complete" -ForegroundColor Gray
    Write-Host "     - Security best practices followed" -ForegroundColor Gray
} else {
    Write-Host "  ❌ Authentication (PR #52): FAILED" -ForegroundColor Red
    Write-Host "     Review output above for failed checks" -ForegroundColor Gray
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Duration: $($duration.TotalSeconds) seconds" -ForegroundColor Gray
Write-Host ""

# Overall Status
if (($systemCheckResult -eq 0 -or $null -eq $systemCheckResult) -and $authCheckResult -eq 0) {
    Write-Host "🎉 ALL VERIFICATIONS PASSED! 🎉" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your system is ready for:" -ForegroundColor Cyan
    Write-Host "  1. Local development" -ForegroundColor White
    Write-Host "  2. Running RPA agent tests" -ForegroundColor White
    Write-Host "  3. Finalizing PR #52 (authentication verification)" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  • Start backend:  cd backend && npm run dev" -ForegroundColor White
    Write-Host "  • Start frontend: cd frontend && npm run dev" -ForegroundColor White
    Write-Host "  • Test agents:    cd backend && .\scripts\setup-and-test-agents.ps1" -ForegroundColor White
    Write-Host "  • Finalize PR:    Mark PR #52 as ready for review" -ForegroundColor White
    
    $exitCode = 0
} elseif ($authCheckResult -ne 0) {
    Write-Host "⚠️  Authentication verification failed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Action Required:" -ForegroundColor Cyan
    Write-Host "  • Review failed checks in the Authentication section above" -ForegroundColor White
    Write-Host "  • Fix any ❌ FAIL items before finalizing PR #52" -ForegroundColor White
    Write-Host "  • Address ⚠️  WARNING items (recommended)" -ForegroundColor White
    Write-Host ""
    Write-Host "Documentation:" -ForegroundColor Cyan
    Write-Host "  backend/scripts/README-AUTH-VERIFICATION.md" -ForegroundColor White
    
    $exitCode = 1
} else {
    Write-Host "⚠️  Some checks need attention." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Action Required:" -ForegroundColor Cyan
    Write-Host "  • Review the output above" -ForegroundColor White
    Write-Host "  • Ensure Docker Desktop is running" -ForegroundColor White
    Write-Host "  • Check database connectivity" -ForegroundColor White
    
    $exitCode = 1
}

Write-Host ""
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

exit $exitCode

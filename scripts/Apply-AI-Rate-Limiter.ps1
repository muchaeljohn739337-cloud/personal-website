#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Apply AI Rate Limiter to critical backend routes

.DESCRIPTION
    This script adds AI Rate Limiter middleware to crypto, email, and AI-related
    routes to prevent system overload and ensure resource stability.

.NOTES
    Author: mucha
    Repository: https://github.com/muchaeljohn739337-cloud/modular-saas-platform
    License: PRIVATE
#>

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🛡️  APPLYING AI RATE LIMITER TO CRITICAL ROUTES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# ═══════════════════════════════════════════════════════════════
# ROUTES TO PROTECT
# ═══════════════════════════════════════════════════════════════

$routesToProtect = @(
    @{
        File = "backend/src/routes/crypto.ts"
        Type = "crypto"
        Description = "Cryptocurrency operations"
    },
    @{
        File = "backend/src/routes/email.ts"
        Type = "email"
        Description = "Email sending operations"
    },
    @{
        File = "backend/src/routes/ai.ts"
        Type = "ai"
        Description = "AI service endpoints"
    }
)

# ═══════════════════════════════════════════════════════════════
# CHECK CURRENT STATUS
# ═══════════════════════════════════════════════════════════════

Write-Host "📊 Checking current rate limiter status...`n" -ForegroundColor Yellow

$protected = 0
$unprotected = 0

foreach ($route in $routesToProtect) {
    $filePath = Join-Path $PSScriptRoot ".." $route.File
    
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        if ($content -match "aiRateLimiter") {
            Write-Host "  ✅ $($route.File) - Already protected" -ForegroundColor Green
            $protected++
        } else {
            Write-Host "  ⚠️  $($route.File) - NOT protected" -ForegroundColor Yellow
            $unprotected++
        }
    } else {
        Write-Host "  ❌ $($route.File) - File not found" -ForegroundColor Red
    }
}

Write-Host "`n📈 Summary:" -ForegroundColor Cyan
Write-Host "  Protected:   $protected routes" -ForegroundColor Green
Write-Host "  Unprotected: $unprotected routes" -ForegroundColor Yellow

# ═══════════════════════════════════════════════════════════════
# GENERATE IMPLEMENTATION GUIDE
# ═══════════════════════════════════════════════════════════════

if ($unprotected -gt 0) {
    Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "📝 MANUAL IMPLEMENTATION GUIDE" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
    
    Write-Host "To protect unprotected routes, add the following import at the top:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  import { aiRateLimiter } from '../middleware/aiRateLimiter';" -ForegroundColor White
    Write-Host ""
    Write-Host "Then add the middleware to routes like this:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  router.post('/purchase', " -ForegroundColor White
    Write-Host "    authenticateToken as any, " -ForegroundColor White
    Write-Host "    aiRateLimiter('crypto'), // Add this line" -ForegroundColor Green
    Write-Host "    async (req: any, res) => { ... }" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Example for each route type:" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($route in $routesToProtect) {
        Write-Host "  $($route.File):" -ForegroundColor Cyan
        Write-Host "    aiRateLimiter('$($route.Type)')" -ForegroundColor Green
        Write-Host ""
    }
}

# ═══════════════════════════════════════════════════════════════
# VERIFICATION CHECKLIST
# ═══════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ VERIFICATION CHECKLIST" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$checklist = @(
    "AI Rate Limiter middleware exists at backend/src/middleware/aiRateLimiter.ts",
    "Crypto routes protected with aiRateLimiter('crypto')",
    "Email routes protected with aiRateLimiter('email')",
    "AI service routes protected with aiRateLimiter('ai')",
    "Rate limits configured in connector limits (stripe: 30/min, crypto: 20/min, etc.)",
    "Resource monitoring enabled (CPU, memory thresholds)",
    "Integration tested with Task Orchestrator AI"
)

foreach ($item in $checklist) {
    Write-Host "  [ ] $item" -ForegroundColor White
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎯 RATE LIMITER CONFIGURATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Current limits (from backend/src/middleware/aiRateLimiter.ts):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Stripe:  30 requests/min, 5 concurrent" -ForegroundColor White
Write-Host "  Crypto:  20 requests/min, 3 concurrent" -ForegroundColor White
Write-Host "  Email:   50 requests/min, 10 concurrent" -ForegroundColor White
Write-Host "  Social:  40 requests/min, 5 concurrent" -ForegroundColor White
Write-Host "  AI:      15 requests/min, 2 concurrent" -ForegroundColor White
Write-Host ""
Write-Host "Resource thresholds:" -ForegroundColor Yellow
Write-Host "  CPU: 80% max" -ForegroundColor White
Write-Host "  Memory: 85% max" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ AI Rate Limiter status check complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review unprotected routes above" -ForegroundColor White
Write-Host "  2. Add aiRateLimiter middleware manually" -ForegroundColor White
Write-Host "  3. Test with: npm run dev (backend)" -ForegroundColor White
Write-Host "  4. Monitor logs for rate limit events" -ForegroundColor White
Write-Host ""

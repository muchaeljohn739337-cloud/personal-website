#!/usr/bin/env pwsh
# Automated push script that handles secret blocking
# Opens GitHub URL and attempts push

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

Write-Host "🚀 Automated Push with Secret Fix" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$githubUrl = "https://github.com/muchaeljohn739337-cloud/personal-website/security/secret-scanning/unblock-secret/36j4ryDgt0GBmIVeRekIEISibj3"

Write-Host "1️⃣  Opening GitHub secret unblock page..." -ForegroundColor Yellow
Write-Host "   URL: $githubUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "   ⚠️  Please click 'Allow secret' in the browser window that opens" -ForegroundColor Yellow
Write-Host ""

# Open the URL in default browser
Start-Process $githubUrl

Write-Host "2️⃣  Waiting 10 seconds for you to allow the secret..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "3️⃣  Attempting to push..." -ForegroundColor Yellow
Write-Host ""

$maxAttempts = 3
$attempt = 0
$success = $false

while ($attempt -lt $maxAttempts -and -not $success) {
    $attempt++
    Write-Host "   Attempt $attempt of $maxAttempts..." -ForegroundColor Gray
    
    $pushOutput = git push 2>&1
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ Push successful!" -ForegroundColor Green
        $success = $true
        break
    } elseif ($pushOutput -match 'secret-scanning') {
        Write-Host "   ⚠️  Still blocked. Did you allow the secret?" -ForegroundColor Yellow
        if ($attempt -lt $maxAttempts) {
            Write-Host "   Waiting 5 more seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds 5
        }
    } else {
        Write-Host "   ❌ Push failed:" -ForegroundColor Red
        Write-Host $pushOutput -ForegroundColor Red
        break
    }
}

if (-not $success) {
    Write-Host ""
    Write-Host "❌ Push was not successful" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "1. You clicked 'Allow secret' on the GitHub page" -ForegroundColor Gray
    Write-Host "2. The page confirmed the secret was allowed" -ForegroundColor Gray
    Write-Host "3. Then run: git push" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or rotate the token first (recommended):" -ForegroundColor Cyan
    Write-Host "https://sentry.io/settings/account/api/auth-tokens/" -ForegroundColor Blue
    exit 1
}

Write-Host ""
Write-Host "🎉 All done! Your changes have been pushed." -ForegroundColor Green

#!/usr/bin/env pwsh
# Script to fix secrets in git history and prepare for push
# This script helps resolve GitHub push protection issues

Write-Host "🔒 Git Secrets Fix Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

Write-Host "1️⃣  Checking current git status..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "2️⃣  Current file is already fixed ✅" -ForegroundColor Green
Write-Host "   CREDENTIALS_CONFIGURED.md has all secrets redacted" -ForegroundColor Gray

Write-Host ""
Write-Host "3️⃣  Checking for secrets in commit history..." -ForegroundColor Yellow

# Check if secrets exist in recent commits
$secretsFound = $false
$commits = git log --oneline -10 | ForEach-Object { ($_ -split ' ')[0] }

foreach ($commit in $commits) {
    $content = git show "$commit:CREDENTIALS_CONFIGURED.md" 2>$null
    if ($content -and ($content -match 'sntryu_')) {
        Write-Host "   ⚠️  Secret found in commit: $commit" -ForegroundColor Yellow
        $secretsFound = $true
    }
}

if (-not $secretsFound) {
    Write-Host "   ✅ No secrets found in recent commits" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  SECURITY RECOMMENDATION:" -ForegroundColor Red
    Write-Host "   The Sentry token in git history should be rotated." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Steps to fix:" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://sentry.io/settings/account/api/auth-tokens/" -ForegroundColor Gray
    Write-Host "   2. Revoke the exposed token" -ForegroundColor Gray
    Write-Host "   3. Generate a new token" -ForegroundColor Gray
    Write-Host "   4. Update your .env.local file" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "4️⃣  Attempting to push..." -ForegroundColor Yellow
Write-Host ""

# Try to push
$pushResult = git push 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push successful!" -ForegroundColor Green
    exit 0
} else {
    if ($pushResult -match 'secret-scanning/unblock-secret') {
        Write-Host "⚠️  Push blocked by GitHub secret scanning" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   To allow this push:" -ForegroundColor Cyan
        Write-Host "   1. Visit the GitHub URL shown above" -ForegroundColor Gray
        Write-Host "   2. Click 'Allow secret' (after rotating the token)" -ForegroundColor Gray
        Write-Host "   3. Run this script again or: git push" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   OR rotate the token first (recommended):" -ForegroundColor Cyan
        Write-Host "   1. Rotate Sentry token at: https://sentry.io/settings/account/api/auth-tokens/" -ForegroundColor Gray
        Write-Host "   2. Update .env.local with new token" -ForegroundColor Gray
        Write-Host "   3. Then allow the push via GitHub URL" -ForegroundColor Gray
    } else {
        Write-Host "❌ Push failed:" -ForegroundColor Red
        Write-Host $pushResult -ForegroundColor Red
    }
    exit 1
}

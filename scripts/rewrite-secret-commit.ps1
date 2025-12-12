#!/usr/bin/env pwsh
# Rewrite the commit containing secrets
# This uses git rebase to edit the commit

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

Write-Host "🔧 Rewriting commit with secrets..." -ForegroundColor Cyan
Write-Host ""

# Find the commit with the secret
$badCommit = "c1937ac"
$parentCommit = git log --format="%H" -1 $badCommit^ 2>$null

if (-not $parentCommit) {
    Write-Host "❌ Could not find parent commit" -ForegroundColor Red
    exit 1
}

Write-Host "Found commit: $badCommit" -ForegroundColor Yellow
Write-Host "Parent: $parentCommit" -ForegroundColor Gray
Write-Host ""

# Checkout the parent
Write-Host "1️⃣  Checking out parent commit..." -ForegroundColor Yellow
git checkout $parentCommit -q

# Get the file from the bad commit and fix it
Write-Host "2️⃣  Extracting and fixing file..." -ForegroundColor Yellow
git show $badCommit:CREDENTIALS_CONFIGURED.md > CREDENTIALS_CONFIGURED.md 2>$null

if (Test-Path CREDENTIALS_CONFIGURED.md) {
    # Fix the secrets
    $content = Get-Content CREDENTIALS_CONFIGURED.md -Raw
    $content = $content -replace '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', '[REDACTED - stored in environment variables]'
    $content = $content -replace '564a33d58a7f42a10c2855685faa9b2882aa0a3b9f9d689cca03defaf7b6e8d0', '[REDACTED - stored in environment variables]'
    $content = $content -replace '7af2d3b780aa8ecc442f4167338a04b08739b1b5', '[REDACTED - stored in environment variables]'
    $content = $content -replace '7zRuIE4avlyj780IJ9tGsRzw', '[REDACTED - stored in environment variables]'
    $content = $content -replace 'f3b71344d3be11f0bc0e8e1527e99f8e', '[REDACTED - stored in environment variables]'
    
    Set-Content CREDENTIALS_CONFIGURED.md -Value $content -NoNewline
    
    Write-Host "   ✅ File fixed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  File not found in that commit" -ForegroundColor Yellow
}

# Get all other files from the bad commit
Write-Host "3️⃣  Restoring other files from commit..." -ForegroundColor Yellow
git checkout $badCommit -- . 2>$null
git reset HEAD CREDENTIALS_CONFIGURED.md 2>$null

# Stage the fixed file
git add CREDENTIALS_CONFIGURED.md

# Create a new commit with the same message
$commitMessage = git log --format="%B" -1 $badCommit
Write-Host "4️⃣  Creating new commit..." -ForegroundColor Yellow
git commit -m $commitMessage

# Now rebase the rest of the commits
Write-Host "5️⃣  Rebasing subsequent commits..." -ForegroundColor Yellow
$currentBranch = git rev-parse --abbrev-ref HEAD
git checkout $currentBranch -q 2>$null

Write-Host ""
Write-Host "⚠️  Manual step required:" -ForegroundColor Yellow
Write-Host "   You'll need to complete the rebase manually or use:" -ForegroundColor Gray
Write-Host "   git rebase -i $parentCommit" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Then edit the commit to use the fixed file." -ForegroundColor Gray

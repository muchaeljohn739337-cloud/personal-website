#!/usr/bin/env pwsh
# Remove .env from Git History
# This script removes the .env file from git history to prevent exposed secrets

Write-Host "🔒 Git History Cleanup - Remove .env" -ForegroundColor Red
Write-Host "======================================" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  WARNING: This will rewrite git history!" -ForegroundColor Yellow
Write-Host "   - All commits will be rewritten" -ForegroundColor Yellow
Write-Host "   - You'll need to force push to remote" -ForegroundColor Yellow
Write-Host "   - Team members will need to re-clone" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Are you sure you want to proceed? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Aborted" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Backup current repository..." -ForegroundColor Cyan
$backupPath = "../personal-website-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item -Path "." -Destination $backupPath -Recurse -Force
Write-Host "✅ Backup created at: $backupPath" -ForegroundColor Green

Write-Host ""
Write-Host "🔍 Checking for BFG Repo-Cleaner..." -ForegroundColor Cyan
$bfgPath = "bfg.jar"
$bfgExists = Test-Path $bfgPath

if ($bfgExists) {
    Write-Host "✅ BFG found, using BFG for faster cleanup" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧹 Removing .env from history..." -ForegroundColor Cyan
    
    java -jar bfg.jar --delete-files .env
    java -jar bfg.jar --delete-files ".env.*" --no-blob-protection
    
    Write-Host "🔄 Cleaning up repository..." -ForegroundColor Cyan
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
} else {
    Write-Host "⚠️  BFG not found, using git filter-branch (slower)" -ForegroundColor Yellow
    Write-Host "   Download BFG for faster cleanup: https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🧹 Removing .env from history..." -ForegroundColor Cyan
    
    git filter-branch --force --index-filter `
        "git rm --cached --ignore-unmatch .env .env.local .env.production .env.development" `
        --prune-empty --tag-name-filter cat -- --all
    
    Write-Host "🔄 Cleaning up repository..." -ForegroundColor Cyan
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
}

Write-Host ""
Write-Host "✅ Git history cleaned!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Verify .env is removed from history:" -ForegroundColor Gray
Write-Host "      git log --all --full-history -- .env" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Force push to remote (⚠️  DESTRUCTIVE):" -ForegroundColor Gray
Write-Host "      git push origin master --force" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Notify team members to re-clone:" -ForegroundColor Gray
Write-Host "      git clone <repository-url>" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Remember:" -ForegroundColor Yellow
Write-Host "   - The exposed secrets are still compromised" -ForegroundColor Gray
Write-Host "   - You MUST rotate all exposed credentials" -ForegroundColor Gray
Write-Host "   - Run scripts/setup-vercel-secrets.ps1 to configure new secrets" -ForegroundColor Gray
Write-Host ""

$pushNow = Read-Host "Force push to remote now? (yes/no)"
if ($pushNow -eq "yes") {
    Write-Host ""
    Write-Host "🚀 Force pushing to remote..." -ForegroundColor Cyan
    git push origin master --force
    Write-Host "✅ Pushed to remote!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Remember to force push when ready: git push origin master --force" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Cleanup complete!" -ForegroundColor Green

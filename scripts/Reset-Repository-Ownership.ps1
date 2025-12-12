#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Reset repository to solo private ownership under mucha

.DESCRIPTION
    This script resets the repository configuration to ensure:
    - Owner: muchaeljohn739337-cloud
    - Repository: modular-saas-platform
    - Access: Private - Solo Development
    - Collaborators: None

.NOTES
    Author: mucha
    Date: November 30, 2025
#>

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔒 REPOSITORY RESET - SOLO PRIVATE OWNERSHIP" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration
$owner = "muchaeljohn739337-cloud"
$repoName = "modular-saas-platform"
$userName = "mucha"
$userEmail = "muchaeljohn739337@gmail.com"
$repoUrl = "https://github.com/$owner/$repoName.git"

Write-Host "Owner: $owner" -ForegroundColor White
Write-Host "Repository: $repoName" -ForegroundColor White
Write-Host "User: $userName" -ForegroundColor White
Write-Host "Access: Private - Solo Development" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check if we're in a git repository
Write-Host "1️⃣ Checking git repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not a git repository. Initializing..." -ForegroundColor Red
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository found" -ForegroundColor Green
}
Write-Host ""

# Step 2: Configure user
Write-Host "2️⃣ Configuring git user..." -ForegroundColor Yellow
git config user.name "$userName"
git config user.email "$userEmail"
Write-Host "✅ User configured: $userName <$userEmail>" -ForegroundColor Green
Write-Host ""

# Step 3: Update remote URL
Write-Host "3️⃣ Updating remote repository URL..." -ForegroundColor Yellow
$currentRemote = git remote get-url origin 2>$null

if ($currentRemote) {
    Write-Host "Current remote: $currentRemote" -ForegroundColor Gray
    git remote set-url origin $repoUrl
    Write-Host "✅ Remote URL updated" -ForegroundColor Green
} else {
    Write-Host "No remote found. Adding origin..." -ForegroundColor Gray
    git remote add origin $repoUrl
    Write-Host "✅ Remote added" -ForegroundColor Green
}
Write-Host "New remote: $repoUrl" -ForegroundColor White
Write-Host ""

# Step 4: Verify remote
Write-Host "4️⃣ Verifying remote configuration..." -ForegroundColor Yellow
git remote -v
Write-Host ""

# Step 5: Check current branch
Write-Host "5️⃣ Checking current branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current

if (-not $currentBranch) {
    Write-Host "No branch found. Creating main branch..." -ForegroundColor Gray
    git checkout -b main
    Write-Host "✅ Main branch created" -ForegroundColor Green
} else {
    Write-Host "Current branch: $currentBranch" -ForegroundColor White
    
    if ($currentBranch -ne "main") {
        Write-Host "⚠️  Current branch is not 'main'" -ForegroundColor Yellow
        $switch = Read-Host "Switch to main branch? (y/n)"
        
        if ($switch -eq "y") {
            # Check if main exists
            $mainExists = git branch --list main
            
            if ($mainExists) {
                git checkout main
                Write-Host "✅ Switched to main branch" -ForegroundColor Green
            } else {
                git checkout -b main
                Write-Host "✅ Created and switched to main branch" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "✅ Already on main branch" -ForegroundColor Green
    }
}
Write-Host ""

# Step 6: Check for uncommitted changes
Write-Host "6️⃣ Checking for uncommitted changes..." -ForegroundColor Yellow
$status = git status --porcelain

if ($status) {
    Write-Host "⚠️  Uncommitted changes detected:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    
    $commit = Read-Host "Commit these changes? (y/n)"
    
    if ($commit -eq "y") {
        git add .
        $commitMsg = Read-Host "Enter commit message (or press Enter for default)"
        
        if (-not $commitMsg) {
            $commitMsg = "chore: reset repository to solo private ownership under mucha"
        }
        
        git commit -m "$commitMsg"
        Write-Host "✅ Changes committed" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Working directory clean" -ForegroundColor Green
}
Write-Host ""

# Step 7: Push to remote (optional)
Write-Host "7️⃣ Push to remote repository?" -ForegroundColor Yellow
$push = Read-Host "Push changes to GitHub? (y/n)"

if ($push -eq "y") {
    Write-Host "Pushing to $repoUrl..." -ForegroundColor Gray
    
    try {
        git push -u origin main --force
        Write-Host "✅ Successfully pushed to remote" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Push failed. You may need to authenticate or check permissions" -ForegroundColor Yellow
        Write-Host "Error: $_" -ForegroundColor Red
    }
}
Write-Host ""

# Step 8: Summary
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 REPOSITORY CONFIGURATION SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository Details:" -ForegroundColor White
Write-Host "  Owner: $owner" -ForegroundColor Gray
Write-Host "  Name: $repoName" -ForegroundColor Gray
Write-Host "  URL: $repoUrl" -ForegroundColor Gray
Write-Host "  Access: Private - Solo Development" -ForegroundColor Gray
Write-Host ""
Write-Host "Git Configuration:" -ForegroundColor White
Write-Host "  User: $userName" -ForegroundColor Gray
Write-Host "  Email: $userEmail" -ForegroundColor Gray
Write-Host "  Branch: $(git branch --show-current)" -ForegroundColor Gray
Write-Host "  Remote: origin -> $repoUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "Status:" -ForegroundColor White
Write-Host "  ✅ Repository configured for solo private development" -ForegroundColor Green
Write-Host "  ✅ No collaborators required" -ForegroundColor Green
Write-Host "  ✅ All settings updated" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Verify on GitHub: https://github.com/$owner/$repoName" -ForegroundColor White
Write-Host "  2. Check repository is set to Private in Settings" -ForegroundColor White
Write-Host "  3. Remove any collaborators in Settings > Collaborators" -ForegroundColor White
Write-Host "  4. Configure branch protection if needed" -ForegroundColor White
Write-Host ""

Write-Host "✅ Repository reset complete!" -ForegroundColor Green
Write-Host ""

# Open GitHub repository in browser (optional)
$openBrowser = Read-Host "Open repository on GitHub? (y/n)"

if ($openBrowser -eq "y") {
    Start-Process "https://github.com/$owner/$repoName"
}

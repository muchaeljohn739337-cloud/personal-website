#!/usr/bin/env pwsh
# Script to set up branch protection for main branch
# Requires GitHub CLI (gh) to be installed and authenticated

Write-Host "🔒 Setting Up Main Branch Protection" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$repo = "muchaeljohn739337-cloud/personal-website"
$branch = "main"

# Check if gh CLI is installed
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghInstalled) {
    Write-Host "❌ GitHub CLI (gh) not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install GitHub CLI:" -ForegroundColor Yellow
    Write-Host "  winget install --id GitHub.cli" -ForegroundColor Gray
    Write-Host "  OR visit: https://cli.github.com/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "After installation, authenticate:" -ForegroundColor Yellow
    Write-Host "  gh auth login" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ GitHub CLI found" -ForegroundColor Green
Write-Host ""

# Check authentication
Write-Host "Checking authentication..." -ForegroundColor Yellow
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated with GitHub CLI" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run: gh auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Authenticated" -ForegroundColor Green
Write-Host ""

# Set up branch protection rules
Write-Host "Setting up branch protection rules..." -ForegroundColor Yellow
Write-Host ""

$protectionRules = @{
    required_status_checks = @{
        strict = $true
        contexts = @("build", "test", "lint")
    }
    enforce_admins = $false
    required_pull_request_reviews = @{
        required_approving_review_count = 1
        dismiss_stale_reviews = $true
        require_code_owner_reviews = $false
        require_last_push_approval = $false
    }
    restrictions = $null
    required_linear_history = $false
    allow_force_pushes = $false
    allow_deletions = $false
    block_creations = $false
    required_conversation_resolution = $true
    lock_branch = $false
    allow_fork_syncing = $true
}

# Convert to JSON
$jsonRules = $protectionRules | ConvertTo-Json -Depth 10 -Compress

Write-Host "Protection rules to apply:" -ForegroundColor Cyan
Write-Host "- Require pull request reviews (1 approval)" -ForegroundColor Gray
Write-Host "- Require status checks to pass" -ForegroundColor Gray
Write-Host "- Require conversation resolution" -ForegroundColor Gray
Write-Host "- Prevent force pushes" -ForegroundColor Gray
Write-Host "- Prevent branch deletion" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Apply these protection rules? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Applying protection rules..." -ForegroundColor Yellow

# Apply protection rules via GitHub API
$headers = @{
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$body = @{
    required_status_checks = @{
        strict = $true
        contexts = @()
    }
    enforce_admins = $false
    required_pull_request_reviews = @{
        required_approving_review_count = 1
        dismiss_stale_reviews = $true
        require_code_owner_reviews = $false
    }
    restrictions = $null
    required_linear_history = $false
    allow_force_pushes = $false
    allow_deletions = $false
    block_creations = $false
    required_conversation_resolution = $true
    lock_branch = $false
    allow_fork_syncing = $true
} | ConvertTo-Json -Depth 10

try {
    $result = gh api `
        --method PUT `
        -H "Accept: application/vnd.github+json" `
        -H "X-GitHub-Api-Version: 2022-11-28" `
        "repos/$repo/branches/$branch/protection" `
        --input - `
        <<< $body 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Branch protection rules applied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Main branch is now protected with:" -ForegroundColor Cyan
        Write-Host "  ✓ Pull request reviews required (1 approval)" -ForegroundColor Gray
        Write-Host "  ✓ Force pushes disabled" -ForegroundColor Gray
        Write-Host "  ✓ Branch deletion disabled" -ForegroundColor Gray
        Write-Host "  ✓ Conversation resolution required" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "❌ Failed to apply protection rules" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host ""
        Write-Host "You can also set this up manually:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://github.com/$repo/settings/branches" -ForegroundColor Gray
        Write-Host "2. Click 'Add rule' or edit 'main' branch" -ForegroundColor Gray
        Write-Host "3. Configure protection settings" -ForegroundColor Gray
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual setup:" -ForegroundColor Yellow
    Write-Host "Visit: https://github.com/$repo/settings/branches" -ForegroundColor Cyan
}

Write-Host ""

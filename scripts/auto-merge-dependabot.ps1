#!/usr/bin/env pwsh
# Script to automatically review and merge Dependabot PRs
# Only merges if PRs are safe and pass checks

Write-Host "🤖 Auto-Merge Dependabot PRs" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

$repo = "muchaeljohn739337-cloud/personal-website"

# Get all open Dependabot PRs
Write-Host "Fetching open Dependabot PRs..." -ForegroundColor Yellow
$prs = gh pr list --repo $repo --state open --author "app/dependabot" --json number,title,state,mergeable,reviewDecision,headRefName

if ($prs -eq $null -or $prs.Count -eq 0) {
    Write-Host "No Dependabot PRs found." -ForegroundColor Yellow
    exit 0
}

$prList = $prs | ConvertFrom-Json
Write-Host "Found $($prList.Count) Dependabot PR(s)" -ForegroundColor Green
Write-Host ""

foreach ($pr in $prList) {
    Write-Host "PR #$($pr.number): $($pr.title)" -ForegroundColor Cyan
    Write-Host "  State: $($pr.state)" -ForegroundColor Gray
    Write-Host "  Mergeable: $($pr.mergeable)" -ForegroundColor Gray
    Write-Host "  Review: $($pr.reviewDecision)" -ForegroundColor Gray
    Write-Host ""
    
    if ($pr.mergeable -eq "MERGEABLE" -and $pr.reviewDecision -eq "APPROVED") {
        Write-Host "  ✅ Ready to merge" -ForegroundColor Green
        $merge = Read-Host "  Merge this PR? (y/n)"
        if ($merge -eq 'y') {
            gh pr merge $pr.number --repo $repo --squash --delete-branch
            Write-Host "  ✅ Merged PR #$($pr.number)" -ForegroundColor Green
        }
    } elseif ($pr.reviewDecision -ne "APPROVED") {
        Write-Host "  ⚠️  Needs approval" -ForegroundColor Yellow
        $approve = Read-Host "  Approve this PR? (y/n)"
        if ($approve -eq 'y') {
            gh pr review $pr.number --repo $repo --approve
            Write-Host "  ✅ Approved PR #$($pr.number)" -ForegroundColor Green
        }
    } elseif ($pr.mergeable -ne "MERGEABLE") {
        Write-Host "  ⚠️  Not mergeable - check conflicts or failing checks" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "Done!" -ForegroundColor Green

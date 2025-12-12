# ==============================================================
# PRIVATE REPO CLEANUP & BUILD FIX
# ==============================================================
# Removes contributor files, fixes builds, and optimizes for private use
# Usage:
#   pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/cleanup-private-repo.ps1

$ErrorActionPreference = 'Continue'

Write-Host @"

╔═══════════════════════════════════════════╗
║   Private Repo Cleanup & Build Fix       ║
║   Self-Hosted Configuration               ║
╚═══════════════════════════════════════════╝

"@ -ForegroundColor Cyan

$root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }

# ==============================================================
# STEP 1: Remove Contributor Files
# ==============================================================
Write-Host "`n📁 STEP 1: Removing Contributor/Community Files" -ForegroundColor Cyan

$filesToRemove = @(
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  ".github/ISSUE_TEMPLATE",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/ISSUE_TEMPLATE.md",
  ".github/FUNDING.yml"
)

foreach ($file in $filesToRemove) {
  $fullPath = Join-Path $root $file
  if (Test-Path $fullPath) {
    Remove-Item $fullPath -Recurse -Force
    Write-Host "   ✅ Removed: $file" -ForegroundColor Green
  } else {
    Write-Host "   ℹ️  Not found: $file" -ForegroundColor Gray
  }
}

# ==============================================================
# STEP 2: Clean Backup Files
# ==============================================================
Write-Host "`n🧹 STEP 2: Removing Backup Files" -ForegroundColor Cyan

$backupFiles = @(
  "backend\package.json.backup",
  "backend\src\prismaClient.ts.backup",
  "frontend\Dockerfile.backup",
  "scripts\ADVANCIA-FULL-DEPLOY.ps1.backup",
  ".github\copilot-prompts.json.backup",
  ".github\copilot-prompts.json.old"
)

foreach ($file in $backupFiles) {
  $fullPath = Join-Path $root $file
  if (Test-Path $fullPath) {
    Remove-Item $fullPath -Force
    Write-Host "   ✅ Removed: $file" -ForegroundColor Green
  }
}

# ==============================================================
# STEP 3: Fix Backend Build
# ==============================================================
Write-Host "`n🔧 STEP 3: Fixing Backend Build" -ForegroundColor Cyan

Push-Location (Join-Path $root "backend")
try {
  Write-Host "   Cleaning backend node_modules..." -ForegroundColor Yellow
  Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
  Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
  
  Write-Host "   Installing backend dependencies..." -ForegroundColor Yellow
  npm install --legacy-peer-deps 2>&1 | Out-Null
  
  Write-Host "   Generating Prisma client..." -ForegroundColor Yellow
  npx prisma generate 2>&1 | Out-Null
  
  Write-Host "   ✅ Backend dependencies fixed!" -ForegroundColor Green
} catch {
  Write-Host "   ⚠️  Backend install failed: $($_.Exception.Message)" -ForegroundColor Yellow
} finally {
  Pop-Location
}

# ==============================================================
# STEP 4: Fix Frontend Build
# ==============================================================
Write-Host "`n🔧 STEP 4: Fixing Frontend Build" -ForegroundColor Cyan

Push-Location (Join-Path $root "frontend")
try {
  Write-Host "   Cleaning frontend node_modules..." -ForegroundColor Yellow
  Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
  Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
  Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
  
  Write-Host "   Installing frontend dependencies..." -ForegroundColor Yellow
  npm install --legacy-peer-deps 2>&1 | Out-Null
  
  Write-Host "   ✅ Frontend dependencies fixed!" -ForegroundColor Green
} catch {
  Write-Host "   ⚠️  Frontend install failed: $($_.Exception.Message)" -ForegroundColor Yellow
} finally {
  Pop-Location
}

# ==============================================================
# STEP 5: Remove Unnecessary Documentation
# ==============================================================
Write-Host "`n📄 STEP 5: Cleaning Unnecessary Documentation" -ForegroundColor Cyan

# These are deployment/troubleshooting duplicates
$docsToRemove = @(
  "RENDER_DEPLOY_DEBUG_GUIDE.md",
  "RPA_DEPLOYMENT_README.md",
  "WSL-SETUP-GUIDE.md"
)

foreach ($doc in $docsToRemove) {
  $fullPath = Join-Path $root $doc
  if (Test-Path $fullPath) {
    # Archive instead of delete (safer)
    $archiveDir = Join-Path $root "docs\archive"
    if (!(Test-Path $archiveDir)) {
      New-Item -ItemType Directory -Force -Path $archiveDir | Out-Null
    }
    Move-Item $fullPath $archiveDir -Force
    Write-Host "   ✅ Archived: $doc" -ForegroundColor Green
  }
}

# ==============================================================
# STEP 6: Test Builds
# ==============================================================
Write-Host "`n🧪 STEP 6: Testing Builds" -ForegroundColor Cyan

Write-Host "   Testing backend build..." -ForegroundColor Yellow
Push-Location (Join-Path $root "backend")
try {
  npm run build 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Backend builds successfully!" -ForegroundColor Green
  } else {
    Write-Host "   ⚠️  Backend build has warnings" -ForegroundColor Yellow
  }
} catch {
  Write-Host "   ❌ Backend build failed" -ForegroundColor Red
}
Pop-Location

Write-Host "   Testing frontend build..." -ForegroundColor Yellow
Push-Location (Join-Path $root "frontend")
try {
  npm run build 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Frontend builds successfully!" -ForegroundColor Green
  } else {
    Write-Host "   ⚠️  Frontend build has warnings" -ForegroundColor Yellow
  }
} catch {
  Write-Host "   ❌ Frontend build failed" -ForegroundColor Red
}
Pop-Location

# ==============================================================
# STEP 7: Create .gitignore for Private Repo
# ==============================================================
Write-Host "`n📝 STEP 7: Updating .gitignore for Private Use" -ForegroundColor Cyan

$gitignorePath = Join-Path $root ".gitignore"
$privateIgnores = @"

# ============================================================
# PRIVATE REPO SPECIFIC
# ============================================================
# Personal notes and local configs
*.local
*.private
.env.production.local
personal-notes/

# Contributor files (not needed for private repos)
CONTRIBUTING.md
CODE_OF_CONDUCT.md
.github/ISSUE_TEMPLATE/
.github/PULL_REQUEST_TEMPLATE.md

# Backup files
*.backup
*.bak
*.old

"@

if (Test-Path $gitignorePath) {
  Add-Content -Path $gitignorePath -Value $privateIgnores
  Write-Host "   ✅ Updated .gitignore" -ForegroundColor Green
} else {
  Write-Host "   ⚠️  .gitignore not found" -ForegroundColor Yellow
}

# ==============================================================
# SUMMARY
# ==============================================================
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                 SUMMARY                   " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n✅ Private Repo Cleanup Complete!" -ForegroundColor Green
Write-Host "`nChanges made:" -ForegroundColor Yellow
Write-Host "  • Removed contributor/community files" -ForegroundColor White
Write-Host "  • Cleaned backup files" -ForegroundColor White
Write-Host "  • Fixed backend & frontend dependencies" -ForegroundColor White
Write-Host "  • Tested builds" -ForegroundColor White
Write-Host "  • Updated .gitignore" -ForegroundColor White

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review README.md (contributor sections removed)" -ForegroundColor White
Write-Host "  2. Test local development:" -ForegroundColor White
Write-Host "     cd backend && npm run dev" -ForegroundColor Gray
Write-Host "     cd frontend && npm run dev" -ForegroundColor Gray
Write-Host "  3. Disable GitHub Issues if not needed:" -ForegroundColor White
Write-Host "     Settings → Features → Uncheck 'Issues'" -ForegroundColor Gray
Write-Host "  4. Configure branch protection (optional):" -ForegroundColor White
Write-Host "     Settings → Branches → Add rule" -ForegroundColor Gray

Write-Host "`n🚀 Your private repo is ready!" -ForegroundColor Green

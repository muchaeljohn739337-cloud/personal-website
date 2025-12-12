# Setup Shared Network Drive Structure for ADVANCIA-NET
# Run this script to create the folder structure on \\ADVANCIA-NET\shared

param(
    [string]$SharePath = "\\ADVANCIA-NET\shared"
)

Write-Host "🚀 Setting up ADVANCIA-NET Shared Drive Structure..." -ForegroundColor Cyan
Write-Host ""

# Check if share is accessible
if (-not (Test-Path $SharePath)) {
    Write-Host "❌ Cannot access $SharePath" -ForegroundColor Red
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. The network share exists" -ForegroundColor Yellow
    Write-Host "  2. You have write permissions" -ForegroundColor Yellow
    Write-Host "  3. The share is mapped/accessible" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Network share accessible: $SharePath" -ForegroundColor Green
Write-Host ""

# Create directory structure
$directories = @(
    "backend",
    "frontend",
    "devops",
    "logs",
    "backups",
    "secrets"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path $SharePath $dir
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "📁 Creating: $dir" -ForegroundColor Yellow
        New-Item -Path $fullPath -ItemType Directory -Force | Out-Null
        Write-Host "   ✅ Created: $fullPath" -ForegroundColor Green
    } else {
        Write-Host "   ⏭️  Already exists: $dir" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Directory Structure:" -ForegroundColor Cyan
Write-Host "  $SharePath\" -ForegroundColor White
Write-Host "  ├── backend\" -ForegroundColor White
Write-Host "  ├── frontend\" -ForegroundColor White
Write-Host "  ├── devops\" -ForegroundColor White
Write-Host "  ├── logs\" -ForegroundColor White
Write-Host "  ├── backups\" -ForegroundColor White
Write-Host "  └── secrets\" -ForegroundColor White
Write-Host ""

# Create README files in each directory
Write-Host "📝 Creating README files..." -ForegroundColor Yellow

$readmeContent = @{
    "backend" = @"
# Backend Shared Resources

This directory contains shared backend resources:
- Database connection strings
- API configurations
- Service credentials
- Shared backend utilities
"@
    "frontend" = @"
# Frontend Shared Resources

This directory contains shared frontend resources:
- Environment configurations
- Shared assets
- Build artifacts
- Deployment configurations
"@
    "devops" = @"
# DevOps Shared Resources

This directory contains DevOps resources:
- CI/CD scripts
- Deployment configurations
- Infrastructure as Code
- Automation scripts
"@
    "logs" = @"
# Logs Directory

This directory contains application logs:
- Backend logs
- Frontend logs
- Deployment logs
- Error logs
"@
    "backups" = @"
# Backups Directory

This directory contains backups:
- Database backups
- Configuration backups
- Code backups
- Archive files
"@
    "secrets" = @"
# Secrets Directory

⚠️ SECURITY WARNING ⚠️

This directory contains sensitive information:
- API keys
- Database passwords
- Service credentials
- SSL certificates

🔒 ENSURE PROPER PERMISSIONS ARE SET!
"@
}

foreach ($dir in $directories) {
    $readmePath = Join-Path (Join-Path $SharePath $dir) "README.md"
    if (-not (Test-Path $readmePath)) {
        $readmeContent[$dir] | Out-File -FilePath $readmePath -Encoding UTF8
        Write-Host "   ✅ Created README in: $dir" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 All done! Your shared network drive is ready." -ForegroundColor Green

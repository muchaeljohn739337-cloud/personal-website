# Setup Local Shared Drive Structure
# Creates structure in C:\ADVANCIA-SHARED instead of network drive

param(
    [string]$SharePath = "C:\ADVANCIA-SHARED"
)

Write-Host "🚀 Setting up ADVANCIA Shared Drive Structure..." -ForegroundColor Cyan
Write-Host ""

# Create base directory
if (-not (Test-Path $SharePath)) {
    Write-Host "📁 Creating base directory: $SharePath" -ForegroundColor Yellow
    New-Item -Path $SharePath -ItemType Directory -Force | Out-Null
    Write-Host "   ✅ Created: $SharePath" -ForegroundColor Green
}

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

# Create README files
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

Write-Host "📝 Creating README files..." -ForegroundColor Yellow
foreach ($dir in $directories) {
    $readmePath = Join-Path (Join-Path $SharePath $dir) "README.md"
    $readmeContent[$dir] | Out-File -FilePath $readmePath -Encoding UTF8
    Write-Host "   ✅ Created README in: $dir" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 All done! Your shared drive is ready at: $SharePath" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 To share on network (optional):" -ForegroundColor Cyan
Write-Host "   1. Right-click on $SharePath" -ForegroundColor White
Write-Host "   2. Select 'Properties' > 'Sharing' tab" -ForegroundColor White
Write-Host "   3. Click 'Advanced Sharing'" -ForegroundColor White
Write-Host "   4. Check 'Share this folder'" -ForegroundColor White
Write-Host "   5. Set share name to 'ADVANCIA-SHARED'" -ForegroundColor White
Write-Host "   6. Set permissions as needed" -ForegroundColor White
Write-Host ""

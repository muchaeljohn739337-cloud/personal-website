# Create Network Share - ADVANCIA-NET
# Run this as Administrator on the machine that will host the share

Write-Host "🔧 Creating Network Share: ADVANCIA-NET\shared" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  This requires Administrator privileges!" -ForegroundColor Yellow
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Please run this script as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Define paths
$localPath = "C:\ADVANCIA-SHARED"
$shareName = "shared"

# Create local directory
Write-Host "📁 Creating local directory: $localPath" -ForegroundColor Yellow
if (-not (Test-Path $localPath)) {
    New-Item -Path $localPath -ItemType Directory -Force | Out-Null
    Write-Host "   ✅ Created: $localPath" -ForegroundColor Green
} else {
    Write-Host "   ⏭️  Already exists" -ForegroundColor Gray
}

# Create subdirectories
$directories = @("backend", "frontend", "devops", "logs", "backups", "secrets")
foreach ($dir in $directories) {
    $dirPath = Join-Path $localPath $dir
    if (-not (Test-Path $dirPath)) {
        New-Item -Path $dirPath -ItemType Directory -Force | Out-Null
    }
}

Write-Host ""
Write-Host "🌐 Creating network share..." -ForegroundColor Yellow

# Remove existing share if it exists
$existingShare = Get-SmbShare -Name $shareName -ErrorAction SilentlyContinue
if ($existingShare) {
    Write-Host "   ⚠️  Share already exists, removing..." -ForegroundColor Yellow
    Remove-SmbShare -Name $shareName -Force
}

# Create new share
try {
    New-SmbShare -Name $shareName -Path $localPath -FullAccess "Everyone" -Description "ADVANCIA Shared Resources"
    Write-Host "   ✅ Network share created!" -ForegroundColor Green
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✅ SHARE CREATED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your share at:" -ForegroundColor Cyan
    Write-Host "  \\$env:COMPUTERNAME\$shareName" -ForegroundColor White
    Write-Host "  (Maps to: $localPath)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  Security Note:" -ForegroundColor Yellow
    Write-Host "   Currently set to 'Everyone - Full Access'" -ForegroundColor Yellow
    Write-Host "   Consider restricting permissions in production!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To restrict access, run:" -ForegroundColor Cyan
    Write-Host "   Grant-SmbShareAccess -Name $shareName -AccountName 'DOMAIN\User' -AccessRight Full" -ForegroundColor White
    Write-Host "   Revoke-SmbShareAccess -Name $shareName -AccountName 'Everyone'" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "   ❌ Failed to create share: $_" -ForegroundColor Red
    exit 1
}

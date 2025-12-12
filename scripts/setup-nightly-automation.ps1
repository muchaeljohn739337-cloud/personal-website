# ====================================
# Advancia Nightly Automation Setup
# ====================================
# Run this script ONCE to set up automatic nightly deployments

Write-Host "`n╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Advancia Nightly Automation Setup          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script requires Administrator privileges" -ForegroundColor Yellow
    Write-Host "   Right-click PowerShell → Run as Administrator" -ForegroundColor Gray
    Write-Host "`n   Then run: pwsh .\scripts\setup-nightly-automation.ps1`n" -ForegroundColor Cyan
    exit 1
}

# Verify the deployment script exists
$scriptPath = "$PSScriptRoot\ADVANCIA-FULL-RPA.ps1"
if (!(Test-Path $scriptPath)) {
    Write-Host "❌ Deployment script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found deployment script" -ForegroundColor Green
Write-Host "   Path: $scriptPath`n" -ForegroundColor Gray

# Ask for schedule time
Write-Host "⏰ When should nightly deployments run?" -ForegroundColor Cyan
Write-Host "   Default: 2:00 AM" -ForegroundColor Gray
$timeInput = Read-Host "   Enter time (HH:MM) or press Enter for default"

if ([string]::IsNullOrWhiteSpace($timeInput)) {
    $hour = 2
    $minute = 0
} else {
    try {
        $timeParts = $timeInput.Split(":")
        $hour = [int]$timeParts[0]
        $minute = [int]$timeParts[1]
        
        if ($hour -lt 0 -or $hour -gt 23 -or $minute -lt 0 -or $minute -gt 59) {
            throw "Invalid time"
        }
    } catch {
        Write-Host "❌ Invalid time format. Using default: 2:00 AM" -ForegroundColor Yellow
        $hour = 2
        $minute = 0
    }
}

$scheduleTime = Get-Date -Hour $hour -Minute $minute -Second 0

Write-Host "`n✅ Schedule: Daily at $($scheduleTime.ToString('h:mm tt'))" -ForegroundColor Green

# Remove existing task if present
try {
    $existingTask = Get-ScheduledTask -TaskName "AdvanciaAutoRPA" -ErrorAction SilentlyContinue
    if ($existingTask) {
        Write-Host "`n⚠️  Removing existing scheduled task..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName "AdvanciaAutoRPA" -Confirm:$false
        Write-Host "✅ Existing task removed" -ForegroundColor Green
    }
} catch {
    # Task doesn't exist, continue
}

# Create scheduled task
Write-Host "`n📋 Creating scheduled task..." -ForegroundColor Cyan

$action = New-ScheduledTaskAction `
    -Execute "pwsh.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" `
    -WorkingDirectory (Split-Path $scriptPath -Parent)

$trigger = New-ScheduledTaskTrigger `
    -Daily `
    -At $scheduleTime

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2)

$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Highest

try {
    Register-ScheduledTask `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -TaskName "AdvanciaAutoRPA" `
        -Description "Automatically build, deploy, and maintain Advancia Pay Ledger nightly at $($scheduleTime.ToString('h:mm tt'))" `
        -Force | Out-Null
    
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Verify task was created
Write-Host "`n🔍 Verifying scheduled task..." -ForegroundColor Cyan
$task = Get-ScheduledTask -TaskName "AdvanciaAutoRPA"

if ($task) {
    Write-Host "✅ Task verified!" -ForegroundColor Green
    Write-Host "`n📊 Task Details:" -ForegroundColor Cyan
    Write-Host "   Name: $($task.TaskName)" -ForegroundColor Gray
    Write-Host "   State: $($task.State)" -ForegroundColor Gray
    Write-Host "   Schedule: Daily at $($scheduleTime.ToString('h:mm tt'))" -ForegroundColor Gray
    Write-Host "   Script: $scriptPath" -ForegroundColor Gray
} else {
    Write-Host "❌ Task verification failed!" -ForegroundColor Red
    exit 1
}

# Ask if user wants to test now
Write-Host "`n🧪 Would you like to test the deployment now?" -ForegroundColor Yellow
Write-Host "   This will trigger a full deployment cycle" -ForegroundColor Gray
$testNow = Read-Host "   Run test? (y/N)"

if ($testNow -eq "y" -or $testNow -eq "Y") {
    Write-Host "`n🚀 Starting test deployment..." -ForegroundColor Cyan
    Start-ScheduledTask -TaskName "AdvanciaAutoRPA"
    
    Write-Host "✅ Task started!" -ForegroundColor Green
    Write-Host "`n📝 You can monitor progress in:" -ForegroundColor Cyan
    Write-Host "   • Task Scheduler → Task Scheduler Library → AdvanciaAutoRPA" -ForegroundColor Gray
    Write-Host "   • Logs directory: $PSScriptRoot\..\logs" -ForegroundColor Gray
    Write-Host "   • Event Viewer → Application → AdvanciaRPA" -ForegroundColor Gray
} else {
    Write-Host "`n⏭️  Skipping test deployment" -ForegroundColor Gray
}

# Setup BurntToast for better notifications (optional)
Write-Host "`n🔔 Enhanced Notifications Setup" -ForegroundColor Cyan
Write-Host "   BurntToast module provides rich Windows 10/11 toast notifications" -ForegroundColor Gray

$hasBurntToast = Get-Module -ListAvailable -Name BurntToast
if ($hasBurntToast) {
    Write-Host "   ✅ BurntToast already installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  BurntToast not installed (optional)" -ForegroundColor Yellow
    $installToast = Read-Host "   Install BurntToast for better notifications? (y/N)"
    
    if ($installToast -eq "y" -or $installToast -eq "Y") {
        try {
            Write-Host "   📦 Installing BurntToast..." -ForegroundColor Cyan
            Install-Module -Name BurntToast -Scope CurrentUser -Force -AllowClobber
            Write-Host "   ✅ BurntToast installed!" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Installation failed (will use fallback notifications)" -ForegroundColor Yellow
        }
    }
}

# Summary
Write-Host "`n╔═══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          ✅ SETUP COMPLETE!                   ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📅 Nightly deployments configured:" -ForegroundColor Cyan
Write-Host "   • Runs daily at $($scheduleTime.ToString('h:mm tt'))" -ForegroundColor Gray
Write-Host "   • Automatic build, deploy, and cleanup" -ForegroundColor Gray
Write-Host "   • Health monitoring and self-healing" -ForegroundColor Gray
Write-Host "   • Cloudflare cache purging" -ForegroundColor Gray
Write-Host "   • Log maintenance and archival" -ForegroundColor Gray

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Verify environment variables in backend\.env" -ForegroundColor Gray
Write-Host "   2. Check GitHub secrets are configured" -ForegroundColor Gray
Write-Host "   3. Wait for first nightly run or trigger manually" -ForegroundColor Gray

Write-Host "`n📝 Management Commands:" -ForegroundColor Cyan
Write-Host "   • View task: Get-ScheduledTask -TaskName 'AdvanciaAutoRPA'" -ForegroundColor Gray
Write-Host "   • Run now: Start-ScheduledTask -TaskName 'AdvanciaAutoRPA'" -ForegroundColor Gray
Write-Host "   • Disable: Disable-ScheduledTask -TaskName 'AdvanciaAutoRPA'" -ForegroundColor Gray
Write-Host "   • Remove: Unregister-ScheduledTask -TaskName 'AdvanciaAutoRPA'" -ForegroundColor Gray

Write-Host "`n📊 Monitor deployments:" -ForegroundColor Cyan
Write-Host "   • Task Scheduler → AdvanciaAutoRPA" -ForegroundColor Gray
Write-Host "   • Event Viewer → Application → Source: AdvanciaRPA" -ForegroundColor Gray
Write-Host "   • Logs: $PSScriptRoot\..\logs\nightly-summary.txt" -ForegroundColor Gray

Write-Host "`n🎉 Automation is ready! Sleep well knowing deployments are handled." -ForegroundColor Green
Write-Host ""

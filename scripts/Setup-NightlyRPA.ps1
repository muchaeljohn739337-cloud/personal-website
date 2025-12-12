# ========================================
# ADVANCIA RPA - SCHEDULED TASK SETUP
# ========================================
# This script creates a Windows Scheduled Task to run ADVANCIA-FULL-RPA.ps1 nightly at 2 AM
# Run this script once to set up automated nightly deployments

$ErrorActionPreference = "Stop"

Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Advancia RPA Nightly Scheduler Setup                ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Paths
$scriptPath = "$PSScriptRoot\ADVANCIA-FULL-RPA.ps1"
$taskName = "AdvanciaAutoRPA"

# Verify script exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Error: ADVANCIA-FULL-RPA.ps1 not found at:" -ForegroundColor Red
    Write-Host "   $scriptPath" -ForegroundColor Yellow
    exit 1
}

Write-Host "📄 Script Path: $scriptPath" -ForegroundColor Gray
Write-Host "👤 Run as User: $env:USERNAME" -ForegroundColor Gray
Write-Host "⏰ Schedule: Daily at 2:00 AM`n" -ForegroundColor Gray

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "⚠️  Task '$taskName' already exists!" -ForegroundColor Yellow
    $choice = Read-Host "Do you want to recreate it? (y/n)"
    
    if ($choice -ne 'y') {
        Write-Host "❌ Setup cancelled" -ForegroundColor Red
        exit 0
    }
    
    Write-Host "🗑️  Removing existing task..." -ForegroundColor Gray
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "✅ Existing task removed" -ForegroundColor Green
}

# Create scheduled task components
Write-Host "`n🔧 Creating scheduled task components..." -ForegroundColor Cyan

# Action: Run PowerShell with the script
$action = New-ScheduledTaskAction `
    -Execute "pwsh.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

# Trigger: Daily at 2 AM
$trigger = New-ScheduledTaskTrigger -Daily -At 2am

# Settings: Run even on battery, start if missed, etc.
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2)

# Register the task
Write-Host "📝 Registering scheduled task..." -ForegroundColor Cyan

try {
    Register-ScheduledTask `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -TaskName $taskName `
        -Description "Automatically build, deploy, and clean Advancia nightly at 2 AM" `
        -User $env:USERNAME `
        -RunLevel Highest
    
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Verify task was created
Write-Host "`n🔍 Verifying task creation..." -ForegroundColor Cyan
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($task) {
    Write-Host "✅ Task verified!" -ForegroundColor Green
    Write-Host "`n📋 Task Details:" -ForegroundColor Cyan
    Write-Host "   Name: $($task.TaskName)" -ForegroundColor Gray
    Write-Host "   State: $($task.State)" -ForegroundColor Gray
    Write-Host "   Next Run: $((Get-ScheduledTaskInfo -TaskName $taskName).NextRunTime)" -ForegroundColor Gray
} else {
    Write-Host "❌ Task verification failed!" -ForegroundColor Red
    exit 1
}

# Ask if user wants to test run now
Write-Host "`n🧪 Would you like to test run the task now? (y/n): " -ForegroundColor Yellow -NoNewline
$testRun = Read-Host

if ($testRun -eq 'y') {
    Write-Host "`n🚀 Starting test run..." -ForegroundColor Cyan
    Write-Host "   This may take several minutes..." -ForegroundColor Gray
    
    try {
        Start-ScheduledTask -TaskName $taskName
        Write-Host "✅ Task started! Check Task Scheduler or logs for progress." -ForegroundColor Green
        Write-Host "   Logs location: $PSScriptRoot\..\logs\" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Failed to start task: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Test run skipped" -ForegroundColor Gray
}

# Final instructions
Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ SETUP COMPLETE                                     ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📌 What happens next:" -ForegroundColor Cyan
Write-Host "   • Task will run automatically daily at 2:00 AM" -ForegroundColor Gray
Write-Host "   • Builds backend and frontend" -ForegroundColor Gray
Write-Host "   • Deploys to Render" -ForegroundColor Gray
Write-Host "   • Purges Cloudflare cache" -ForegroundColor Gray
Write-Host "   • Sends notifications on completion" -ForegroundColor Gray
Write-Host "   • Maintains logs (archives after 7 days)" -ForegroundColor Gray

Write-Host "`n🛠️  Useful commands:" -ForegroundColor Cyan
Write-Host "   View task:        Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "   Run task now:     Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "   Disable task:     Disable-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "   Remove task:      Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor Gray
Write-Host "   View logs:        Get-Content '$PSScriptRoot\..\logs\nightly-summary.txt'" -ForegroundColor Gray

Write-Host "`n📂 Logs & notifications:" -ForegroundColor Cyan
Write-Host "   • Check Windows Event Viewer → Application log (Source: AdvanciaRPA)" -ForegroundColor Gray
Write-Host "   • Check: $PSScriptRoot\..\logs\nightly-summary.txt" -ForegroundColor Gray
Write-Host "   • Desktop notifications (if running interactively)" -ForegroundColor Gray

Write-Host "`n🎉 You're all set! The task will run tonight at 2 AM.`n" -ForegroundColor Green

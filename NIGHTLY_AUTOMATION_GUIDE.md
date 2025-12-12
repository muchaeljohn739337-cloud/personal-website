# 🌙 Nightly RPA Automation Setup Guide

Complete guide to setting up automated nightly deployments for Advancia Pay Ledger.

---

## 🎯 What This Does

Your system will automatically:

- ✅ Run every night at 2:00 AM
- ✅ Build backend and frontend
- ✅ Deploy to Render
- ✅ Purge Cloudflare cache
- ✅ Run health checks
- ✅ Send notifications (toast, event log, or file)
- ✅ Clean up old logs
- ✅ Auto-rollback on failure (optional)

---

## 🚀 Quick Setup (1 Minute)

### Step 1: Run Setup Script

```powershell
# Open PowerShell as Administrator (right-click → Run as Administrator)
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\scripts

# Run the setup script
.\Setup-NightlyRPA.ps1
```

**That's it!** The script will:

1. Create a Windows Scheduled Task
2. Configure it to run daily at 2 AM
3. Ask if you want to test run now

### Step 2: Test It (Optional)

```powershell
# Test run immediately
Start-ScheduledTask -TaskName "AdvanciaAutoRPA"

# Watch progress
Get-ScheduledTaskInfo -TaskName "AdvanciaAutoRPA"
```

---

## 📋 Prerequisites

### Required Environment Variables

Make sure these are set in `backend/.env`:

```bash
# Render deployment
RENDER_SERVICE_ID="srv-xxxxx"
RENDER_API_KEY="rnd-xxxxx"

# Cloudflare (optional but recommended)
CLOUDFLARE_ZONE_ID="your-zone-id"
CLOUDFLARE_API_TOKEN="your-api-token"

# Deployment behavior
AUTO_ROLLBACK="false"  # Set to "true" for auto-rollback on failure
CHECK_LOCAL_HEALTH="false"  # Skip local checks when running scheduled
```

---

## 🔔 Notification Setup

The system supports **4 notification methods** (tries each in order):

### Method 1: BurntToast Module (Recommended)

Best for Windows 10/11 with modern toast notifications:

```powershell
# Install BurntToast module (one-time)
Install-Module -Name BurntToast -Scope CurrentUser -Force

# Test it
Import-Module BurntToast
New-BurntToastNotification -Text "Test", "Hello from Advancia!"
```

**Features:**

- ✅ Modern Windows 10/11 toast notifications
- ✅ Appears in Action Center
- ✅ Can include sounds, images, buttons
- ✅ Doesn't interrupt your work

### Method 2: Windows Event Log (Automatic Fallback)

Always available, no installation needed:

```powershell
# View logs in Event Viewer
eventvwr.msc
# Navigate to: Windows Logs → Application
# Filter by Source: AdvanciaRPA
```

**Features:**

- ✅ Built into Windows
- ✅ Persistent log history
- ✅ Can set up email alerts via Event Viewer
- ✅ Queryable via PowerShell

### Method 3: MessageBox (Interactive Sessions)

Shown when running interactively:

**Features:**

- ✅ Built-in, no installation needed
- ✅ Blocks until acknowledged
- ✅ Good for manual test runs

### Method 4: Log File (Always Active)

Always writes to `logs/nightly-summary.txt`:

```powershell
# View summary log
Get-Content logs\nightly-summary.txt -Tail 20

# View real-time
Get-Content logs\nightly-summary.txt -Wait
```

---

## 🛠️ Managing the Scheduled Task

### View Task Status

```powershell
# Get task details
Get-ScheduledTask -TaskName "AdvanciaAutoRPA"

# Get last run information
Get-ScheduledTaskInfo -TaskName "AdvanciaAutoRPA" |
  Select-Object LastRunTime, LastTaskResult, NextRunTime
```

### Manual Controls

```powershell
# Run task now (for testing)
Start-ScheduledTask -TaskName "AdvanciaAutoRPA"

# Temporarily disable
Disable-ScheduledTask -TaskName "AdvanciaAutoRPA"

# Re-enable
Enable-ScheduledTask -TaskName "AdvanciaAutoRPA"

# Remove task completely
Unregister-ScheduledTask -TaskName "AdvanciaAutoRPA" -Confirm:$false
```

### Change Schedule

```powershell
# Change to run at 3 AM instead
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Set-ScheduledTask -TaskName "AdvanciaAutoRPA" -Trigger $trigger

# Run twice daily (2 AM and 2 PM)
$trigger1 = New-ScheduledTaskTrigger -Daily -At 2am
$trigger2 = New-ScheduledTaskTrigger -Daily -At 2pm
Set-ScheduledTask -TaskName "AdvanciaAutoRPA" -Trigger @($trigger1, $trigger2)

# Run on specific days only (Mon, Wed, Fri)
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Wednesday,Friday -At 2am
Set-ScheduledTask -TaskName "AdvanciaAutoRPA" -Trigger $trigger
```

---

## 📊 Monitoring & Logs

### View Deployment History

```powershell
# View last 20 deployments
Get-Content logs\nightly-summary.txt -Tail 20

# Filter for errors only
Get-Content logs\nightly-summary.txt | Select-String "Error"

# Count successful vs failed
$logs = Get-Content logs\nightly-summary.txt
$success = ($logs | Select-String "Success").Count
$failed = ($logs | Select-String "Error|failed").Count
Write-Host "✅ Success: $success | ❌ Failed: $failed"
```

### Event Viewer Integration

1. Open Event Viewer: `eventvwr.msc`
2. Navigate to: **Windows Logs → Application**
3. Filter by Source: **AdvanciaRPA**
4. Event IDs:
   - `1000` - Info messages
   - `1001` - Success (deployment completed)
   - `2001` - Warnings (partial failures)
   - `3001` - Errors (deployment failed)

### Set Up Email Alerts (Optional)

1. Open Event Viewer → Application Log
2. Right-click on an AdvanciaRPA event
3. Select **Attach Task To This Event**
4. Choose **Send an e-mail**
5. Configure SMTP settings

---

## 🔧 Troubleshooting

### Task Not Running

**Check if task exists:**

```powershell
Get-ScheduledTask -TaskName "AdvanciaAutoRPA"
```

**Check task history:**

```powershell
Get-ScheduledTaskInfo -TaskName "AdvanciaAutoRPA"
```

**Common issues:**

- Computer was asleep at 2 AM → Task will run when it wakes up
- User password changed → Need to update task credentials
- PowerShell not found → Verify pwsh.exe is in PATH

### Deployment Fails

**Check logs:**

```powershell
# View deployment log
Get-Content logs\nightly-summary.txt -Tail 50

# Check Render logs
# Visit: https://dashboard.render.com → Your service → Logs
```

**Common fixes:**

- Environment variables missing → Check `backend/.env`
- Render API credentials expired → Update in `.env`
- Build failures → Check TypeScript errors: `cd backend && npx tsc --noEmit`

### Notifications Not Working

**Verify notification setup:**

```powershell
# Test BurntToast (if installed)
Import-Module BurntToast
New-BurntToastNotification -Text "Test", "Is this working?"

# Test Event Log
$src = "AdvanciaRPA"
if ([System.Diagnostics.EventLog]::SourceExists($src)) {
    Write-EventLog -LogName Application -Source $src -EntryType Information -EventId 1000 -Message "Test"
    Write-Host "✅ Event Log test sent. Check Event Viewer."
} else {
    Write-Host "⚠️ Event source not created (requires admin once)"
}

# Check log file
Get-Content logs\nightly-summary.txt -Tail 5
```

---

## 📈 Advanced Configuration

### Run As Different User

```powershell
# Get current task
$task = Get-ScheduledTask -TaskName "AdvanciaAutoRPA"

# Change user (will prompt for password)
Set-ScheduledTask -TaskName "AdvanciaAutoRPA" -User "DOMAIN\Username"
```

### Add Pre/Post-Deployment Scripts

Edit `ADVANCIA-FULL-RPA.ps1` and add custom logic:

```powershell
# Before deployment
function Pre-Deploy {
    # Your custom code here
    # Example: Backup database, notify team, etc.
}

# After successful deployment
function Post-Deploy {
    # Your custom code here
    # Example: Run smoke tests, update status page, etc.
}
```

### Increase Logging Detail

```powershell
# In ADVANCIA-FULL-RPA.ps1, add at the top:
$VerbosePreference = "Continue"
$DebugPreference = "Continue"

# Or run manually with verbose:
.\ADVANCIA-FULL-RPA.ps1 -Verbose
```

---

## 📅 Typical Daily Flow

Here's what happens every night at 2 AM:

```
02:00:00  🌙 Task triggered by Windows scheduler
02:00:01  🔑 Load environment variables from .env
02:00:02  🧠 Run self-healing fix agent (scan logs, auto-fix issues)
02:00:05  🧱 Build backend (npm run build)
02:02:15  🧱 Build frontend (npm run build)
02:05:30  🚀 Trigger Render deployment via API
02:05:31  ⏳ Monitor deployment status (check every 10s)
02:08:45  🎉 Deployment succeeded
02:09:15  🏥 Verify production health checks
02:09:45  🌐 Purge Cloudflare CDN cache
02:09:50  📬 Send success notification (toast + event log + file)
02:10:00  🧹 Archive old logs (>7 days)
02:10:05  ✅ Complete!
```

**Total time:** ~10-15 minutes depending on build complexity

---

## 🎛️ Environment Variable Reference

```bash
# Required for deployment
RENDER_SERVICE_ID="srv-xxxxx"
RENDER_API_KEY="rnd-xxxxx"

# Optional: Cloudflare CDN cache management
CLOUDFLARE_ZONE_ID="your-zone-id"
CLOUDFLARE_API_TOKEN="your-api-token"

# Optional: Behavior flags
AUTO_ROLLBACK="false"           # Auto-revert on deployment failure
CHECK_LOCAL_HEALTH="false"      # Check local services before deploy
BACKEND_URL="https://api.advanciapayledger.com"
ADMIN_EMAIL="your@email.com"
```

---

## 🚨 Emergency Procedures

### Stop All Automated Deployments

```powershell
# Disable the task immediately
Disable-ScheduledTask -TaskName "AdvanciaAutoRPA"

# Verify it's disabled
Get-ScheduledTask -TaskName "AdvanciaAutoRPA" | Select-Object State
```

### Rollback Last Deployment

```powershell
# If AUTO_ROLLBACK is enabled, it happens automatically
# For manual rollback:
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform
git log --oneline -5  # Find the commit before deployment
git revert HEAD --no-edit
git push origin main
```

### Emergency Render Rollback

1. Go to: https://dashboard.render.com
2. Select your service
3. Click "Deploys" tab
4. Find last successful deploy
5. Click "⋯" → "Redeploy"

---

## 📞 Support & Resources

### Quick Links

- **Render Dashboard:** https://dashboard.render.com
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Task Scheduler:** `taskschd.msc`
- **Event Viewer:** `eventvwr.msc`

### Useful Commands

```powershell
# Quick status check
Get-ScheduledTaskInfo -TaskName "AdvanciaAutoRPA" |
  Select-Object @{N='Last Run';E={$_.LastRunTime}},
                @{N='Next Run';E={$_.NextRunTime}},
                @{N='Result';E={if($_.LastTaskResult -eq 0){"Success"}else{"Failed"}}}

# View recent logs
Get-Content logs\nightly-summary.txt -Tail 10

# Test deployment manually (skip schedule)
cd scripts
.\ADVANCIA-FULL-RPA.ps1
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Scheduled task created: `Get-ScheduledTask -TaskName "AdvanciaAutoRPA"`
- [ ] Task is enabled: Check State is "Ready"
- [ ] Next run is scheduled: Check NextRunTime is set
- [ ] Environment variables configured in `backend/.env`
- [ ] Test run completed successfully
- [ ] Notifications working (checked Event Viewer or log file)
- [ ] Logs directory exists and is writable
- [ ] BurntToast module installed (optional but recommended)

---

## 🎉 You're All Set!

Your nightly automation is configured and ready. The system will:

- ✅ Deploy automatically every night at 2 AM
- ✅ Send notifications on completion
- ✅ Maintain logs for 7 days (then archive)
- ✅ Self-heal common issues automatically

**Next deployment:** Check `Get-ScheduledTaskInfo -TaskName "AdvanciaAutoRPA"` for NextRunTime

---

**Last Updated:** October 24, 2025  
**Version:** 2.0.0

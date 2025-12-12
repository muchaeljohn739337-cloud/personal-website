# 🌙 Nightly Automation - Quick Reference

## ⚡ Setup (Run Once)

```powershell
# Run as Administrator
pwsh -ExecutionPolicy Bypass -File .\scripts\setup-nightly-automation.ps1
```

This creates a scheduled task that runs daily at 2 AM (or your chosen time).

---

## 🎯 Management Commands

```powershell
# View task details
Get-ScheduledTask -TaskName "AdvanciaAutoRPA"

# Trigger deployment now
Start-ScheduledTask -TaskName "AdvanciaAutoRPA"

# Disable automatic runs
Disable-ScheduledTask -TaskName "AdvanciaAutoRPA"

# Re-enable automatic runs
Enable-ScheduledTask -TaskName "AdvanciaAutoRPA"

# Remove task completely
Unregister-ScheduledTask -TaskName "AdvanciaAutoRPA" -Confirm:$false
```

---

## 📊 Monitoring

### Task Scheduler

1. Press `Win + R` → type `taskschd.msc`
2. Navigate to: Task Scheduler Library
3. Find: `AdvanciaAutoRPA`
4. View: Last Run Result, Next Run Time, History

### Event Viewer

1. Press `Win + R` → type `eventvwr.msc`
2. Navigate to: Windows Logs → Application
3. Filter by Source: `AdvanciaRPA`
4. View deployment results and notifications

### Log Files

```powershell
# View nightly summary
Get-Content "logs\nightly-summary.txt" -Tail 20

# View all logs
Get-ChildItem "logs" | Sort-Object LastWriteTime -Descending
```

---

## 🧪 Testing

```powershell
# Test notifications
pwsh .\scripts\test-notifications.ps1

# Test full deployment (dry run)
pwsh .\scripts\ADVANCIA-FULL-RPA.ps1

# View task output
Start-ScheduledTask -TaskName "AdvanciaAutoRPA"
Get-ScheduledTaskInfo -TaskName "AdvanciaAutoRPA"
```

---

## 🔔 Notification Methods

The system tries these in order:

1. **BurntToast** - Rich Windows 10/11 toast
2. **Event Log** - Windows Event Viewer (Application → AdvanciaRPA)
3. **MessageBox** - Interactive popup
4. **File Log** - `logs/nightly-summary.txt`

### Install BurntToast (Optional)

```powershell
Install-Module -Name BurntToast -Scope CurrentUser
```

---

## ⚙️ Configuration

Edit `backend/.env`:

```bash
# Required for deployment
RENDER_SERVICE_ID="srv-xxxxx"
RENDER_API_KEY="rnd-xxxxx"

# Optional - Cloudflare CDN
CLOUDFLARE_ZONE_ID="your-zone-id"
CLOUDFLARE_API_TOKEN="your-token"

# Deployment behavior
AUTO_ROLLBACK="false"         # Auto-revert on failure
CHECK_LOCAL_HEALTH="false"    # Check local before deploy
```

---

## 🚨 Troubleshooting

### Task doesn't run

```powershell
# Check task status
Get-ScheduledTask -TaskName "AdvanciaAutoRPA" | Select-Object State, LastRunTime, NextRunTime

# Check if enabled
$task = Get-ScheduledTask -TaskName "AdvanciaAutoRPA"
if ($task.State -eq "Disabled") {
    Enable-ScheduledTask -TaskName "AdvanciaAutoRPA"
}
```

### No notifications

```powershell
# Test notification system
pwsh .\scripts\test-notifications.ps1

# Check Event Viewer
eventvwr.msc
# → Application → Source: AdvanciaRPA
```

### Deployment fails

```powershell
# Check recent logs
Get-Content "logs\nightly-summary.txt" -Tail 50

# View Render logs
# https://dashboard.render.com → Your Service → Logs

# Check environment
Get-ChildItem Env: | Where-Object { $_.Name -match "RENDER|CLOUDFLARE" }
```

---

## 📅 What Runs Nightly

1. ✅ Load environment variables
2. ✅ Auto-fix detected issues
3. ✅ Build backend & frontend
4. ✅ Trigger Render deployment
5. ✅ Monitor deployment status
6. ✅ Verify production health
7. ✅ Purge Cloudflare cache
8. ✅ Archive old logs
9. ✅ Send success/failure notification

---

## 💡 Tips

- **First deployment**: Manually trigger to verify setup
- **Monitor closely**: Check Event Viewer for first few runs
- **Log retention**: Logs archived after 7 days, deleted after 30 days
- **Scheduled time**: Runs at 2 AM by default (configurable during setup)
- **Network required**: Task checks network availability before running
- **Battery friendly**: Won't prevent sleep if on battery

---

## 🎉 Success Indicators

You'll know it's working when you see:

- ✅ Toast notification (if BurntToast installed)
- ✅ Event Viewer entry with "✅ Render deploy succeeded"
- ✅ New entry in `logs/nightly-summary.txt`
- ✅ Task Scheduler shows "Last Run Result: The operation completed successfully (0x0)"
- ✅ Production endpoints respond with HTTP 200

---

**For detailed setup:** See `NIGHTLY_AUTOMATION_GUIDE.md`
**For troubleshooting:** Check Event Viewer → Application → AdvanciaRPA

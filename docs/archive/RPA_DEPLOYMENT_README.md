# 🤖 Advancia RPA Self-Healing Deployment System

Complete automated deployment pipeline with self-healing, monitoring, and rollback capabilities.

## 🚀 Quick Start

### 1. Configure Secrets

Add these to your GitHub repository secrets:

```
RENDER_SERVICE_ID=srv-xxxxxxxxxxxxx
RENDER_API_KEY=rnd_xxxxxxxxxxxxx
BACKEND_URL=https://api.advanciapayledger.com  # optional
```

### 2. Local Environment Variables

Add to `backend/.env`:

```env
# Render API (for local deployments)
RENDER_SERVICE_ID=srv-xxxxxxxxxxxxx
RENDER_API_KEY=rnd_xxxxxxxxxxxxx

# Optional features
AUTO_ROLLBACK=true           # Auto-revert on failure
CHECK_LOCAL_HEALTH=false     # Skip local health checks
```

### 3. Deploy

**Automatic (recommended):**

```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

GitHub Actions automatically deploys!

**Manual:**

```powershell
pwsh ./scripts/ADVANCIA-FULL-RPA.ps1
```

## 📋 Features

### ✅ Self-Healing

- Auto-fixes missing npm modules
- Regenerates Prisma client
- Retries failed builds
- Detects common issues from logs

### 🔄 Auto-Rollback

If deployment fails and `AUTO_ROLLBACK=true`:

- Reverts last commit
- Pushes to main
- Notifies admin

### 🏥 Health Monitoring

- Verifies build success
- Checks local services (optional)
- Monitors Render deployment
- Validates production health

### 📬 Notifications

- Windows desktop alerts
- VS Code notifications
- GitHub issue creation (on failure)
- Console output

### 🧹 Log Maintenance

- Archives logs older than 7 days
- Compresses to ZIP
- Deletes archives older than 30 days
- Runs automatically

## 🔧 Configuration

### Environment Variables

| Variable             | Required | Default                             | Description                          |
| -------------------- | -------- | ----------------------------------- | ------------------------------------ |
| `RENDER_SERVICE_ID`  | ✅       | -                                   | Your Render service ID               |
| `RENDER_API_KEY`     | ✅       | -                                   | Your Render API key                  |
| `BACKEND_URL`        | ❌       | `https://api.advanciapayledger.com` | Backend URL for health checks        |
| `AUTO_ROLLBACK`      | ❌       | `false`                             | Enable automatic rollback on failure |
| `CHECK_LOCAL_HEALTH` | ❌       | `false`                             | Check local services before deploy   |

### GitHub Actions

Triggers:

- **Push to main**: Automatic deployment
- **Every 4 hours**: Scheduled health check
- **Manual**: Via Actions tab

## 📊 Workflow

```
┌─────────────┐
│ Push to main│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Fix Agent   │  Auto-fixes common issues
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Build       │  Backend + Frontend
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Deploy      │  Trigger Render
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Monitor     │  Watch deployment
└──────┬──────┘
       │
       ├─Success──▶ Health Check ──Success──▶ ✅ Done
       │                  │
       │               Failure
       │                  │
       └─Failure──────────┴──▶ Rollback? ──▶ Notify
```

## 🛠️ Troubleshooting

### Build Fails Locally

```powershell
# Check for TypeScript errors
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Reinstall dependencies
npm install
```

### Deployment Fails

1. Check GitHub Actions logs
2. Verify Render dashboard
3. Check secrets are set correctly
4. Review recent commits

### Health Check Fails

```powershell
# Test endpoint directly
Invoke-WebRequest -Uri "https://api.advanciapayledger.com/api/health"

# Check Render logs
# Visit: https://dashboard.render.com
```

### Rollback Not Working

Ensure:

- `AUTO_ROLLBACK=true` is set
- Git credentials are configured
- You have push permissions to main

## 📁 File Structure

```
scripts/
├── ADVANCIA-FULL-RPA.ps1      # Main deployment script
├── rpa-fix-agent.ps1           # Auto-fix common issues
├── health-check.ps1            # Health monitoring
└── send-notification.ps1       # Notification system

.github/workflows/
└── rpa-auto-deploy.yml         # GitHub Actions workflow
```

## 🔐 Security

- Never commit API keys or secrets
- Use GitHub Secrets for sensitive values
- Rotate API keys periodically
- Review deployment logs for data exposure
- Use `.env` files locally (gitignored)

## 📞 Support

Issues? Check:

1. GitHub Actions logs
2. Render deployment logs
3. This README
4. `RPA_AUTO_DEPLOY_GUIDE.md` for detailed docs

---

**Status**: ✅ Production Ready  
**Last Updated**: October 24, 2025  
**Version**: 2.0.0

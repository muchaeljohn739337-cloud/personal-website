# 🤖 Advancia RPA Auto-Deploy System

## Overview

Fully automated CI/CD pipeline with self-healing capabilities, health monitoring, and rollback functionality.

## Components Created

### 1. GitHub Actions Workflow

**File:** `.github/workflows/rpa-auto-deploy.yml`

**Triggers:**

- Push to `main` branch
- Every 4 hours (scheduled self-check)
- Manual trigger via GitHub UI

**What it does:**

- ✅ Checks out code
- ✅ Installs dependencies (backend + frontend)
- ✅ TypeScript type checking
- ✅ Builds both projects
- ✅ Runs tests
- ✅ Triggers Render deployment
- ✅ Monitors deployment status
- ✅ Health checks production
- ✅ Creates GitHub issue if fails

### 2. RPA Fix Agent

**File:** `scripts/rpa-fix-agent.ps1`

**Auto-fixes:**

- Missing npm modules → runs `npm install`
- Prisma client issues → regenerates client
- Build failures → attempts rebuild
- Detects database connection issues
- Detects port conflicts

### 3. Health Monitor

**File:** `scripts/health-check.ps1`

**Monitors:**

- Backend API health endpoint
- Frontend availability
- Response times
- Auto-restart capability (if enabled)

### 4. Notification System

**File:** `scripts/send-notification.ps1`

**Methods:**

- SendGrid email (if configured)
- SMTP email (if configured)
- GitHub issues (if configured)
- Console fallback

### 5. Main Deploy Script

**File:** `scripts/ADVANCIA-FULL-DEPLOY.ps1`

**Full workflow:**

1. Load environment variables
2. Run pre-flight checks (RPA fix agent)
3. Build backend & frontend
4. Trigger Render deployment
5. Monitor deployment progress
6. Verify production health
7. Send notifications
8. Rollback if failure (optional)

## Setup Instructions

### Required GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions → New repository secret:

```
RENDER_SERVICE_ID=srv-xxxxxxxxxxxxx
RENDER_API_KEY=rnd_xxxxxxxxxxxxx
BACKEND_URL=https://api.advanciapayledger.com
ADMIN_EMAIL=your@email.com
```

### Optional Secrets (for notifications)

```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@advanciapayledger.com
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx  # Auto-provided by GitHub Actions
```

### Local Environment Variables

Add to `backend/.env`:

```env
# Required for Render deploy
RENDER_SERVICE_ID=srv-xxxxxxxxxxxxx
RENDER_API_KEY=rnd_xxxxxxxxxxxxx

# Optional features
AUTO_ROLLBACK=true          # Auto-revert on deploy failure
AUTO_RESTART=true           # Auto-restart on health check failure
REQUIRE_LOCAL_HEALTH=false  # Skip local health checks

# Notifications
ADMIN_EMAIL=your@email.com
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

## Usage

### Automatic Deployment

Just push to `main` branch:

```bash
git add .
git commit -m "feat: new feature"
git push origin main
```

GitHub Actions automatically:

1. Builds & tests
2. Deploys to Render
3. Monitors health
4. Notifies you of results

### Manual Deployment

Run locally:

```powershell
pwsh ./scripts/ADVANCIA-FULL-DEPLOY.ps1
```

### Health Check Only

```powershell
pwsh ./scripts/health-check.ps1
```

### RPA Fix Agent Only

```powershell
pwsh ./scripts/rpa-fix-agent.ps1
```

### Send Test Notification

```powershell
pwsh ./scripts/send-notification.ps1 `
  -Subject "Test Notification" `
  -Body "This is a test" `
  -Type "Info"
```

## Workflow Diagram

```
┌─────────────────┐
│  Push to main   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│ - Type check    │
│ - Build         │
│ - Test          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Trigger Render  │
│ Deployment      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Monitor Deploy  │
│ (30 attempts)   │
└────────┬────────┘
         │
         ├──Success──▶ Health Check ──Success──▶ ✅ Done
         │                    │
         │                 Failure
         │                    │
         └──Failure───────────┴──▶ Rollback? ──▶ Notify Admin
```

## Self-Healing Features

### Automatic Fixes

- **Missing modules**: Runs `npm install`
- **Prisma issues**: Regenerates client & migrates
- **Build failures**: Attempts clean rebuild
- **Health failures**: Triggers redeploy (if AUTO_RESTART=true)

### Rollback on Failure

If `AUTO_ROLLBACK=true`:

- Deployment fails → Auto-reverts last commit
- Health check fails → Restores previous version
- Notifies admin of rollback action

### Scheduled Self-Checks

Every 4 hours, GitHub Actions:

- Runs full build & test suite
- Verifies production health
- Creates issue if problems detected

## Monitoring & Alerts

### Success Notifications

- ✅ Deployment completed
- Duration time
- Service URLs

### Failure Notifications

- ❌ Build failures
- ❌ Deployment failures
- ❌ Health check failures
- Includes error details and logs

### Methods

1. **Email** (SendGrid or SMTP)
2. **GitHub Issues** (auto-created with details)
3. **Console logs** (fallback)

## Troubleshooting

### GitHub Action Fails

1. Check Actions tab in repository
2. Review workflow run logs
3. Verify secrets are set correctly
4. Check Render service status

### Local Script Fails

```powershell
# Enable verbose logging
$env:DEBUG = "*"
pwsh ./scripts/ADVANCIA-FULL-DEPLOY.ps1
```

### Health Checks Fail

```powershell
# Test endpoints directly
Invoke-WebRequest -Uri "https://api.advanciapayledger.com/api/health"
```

### No Notifications Received

1. Verify `ADMIN_EMAIL` is set
2. Check notification method is configured (SendGrid/SMTP/GitHub)
3. Test notification script directly

## Next Steps

1. ✅ Set up GitHub repository secrets
2. ✅ Configure notification method (email or GitHub issues)
3. ✅ Test local deployment script
4. ✅ Push to `main` to trigger first automated deploy
5. ✅ Monitor GitHub Actions workflow
6. ✅ Verify production health
7. ✅ Set up Render webhook (optional for instant notifications)

## Security Notes

- Never commit API keys or secrets to repository
- Use GitHub Secrets for all sensitive values
- Rotate API keys periodically
- Use `.env` files locally (gitignored)
- Review deployment logs for sensitive data exposure

## Support

If you encounter issues:

1. Check GitHub Actions logs
2. Review Render deployment logs
3. Run `rpa-fix-agent.ps1` locally
4. Check this documentation

---

**Status**: ✅ System ready for deployment
**Last Updated**: October 24, 2025

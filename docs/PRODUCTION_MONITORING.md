# Production Monitoring Setup

## Overview

Automated production health checks run every 30 minutes via GitHub Actions to monitor:

- Backend API health (`/api/health`)
- System status endpoints (`/api/system/status`, `/api/system/health`)
- Admin endpoints (with authentication)
- Frontend availability and performance
- Database connectivity

## Workflow Configuration

**File:** `.github/workflows/production-monitor.yml`

**Schedule:** Every 30 minutes (configurable via cron expression)

**Manual Trigger:** Available via GitHub Actions UI

## Setup Instructions

### 1. Configure Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
ADVANCIA_API_BEARER=<your-jwt-token-for-admin-access>
ADVANCIA_API_KEY=<your-api-key-if-required>
```

> **Note:** These are optional. The monitoring script will run public health checks without them, but authenticated endpoints will return 401 (which is expected and handled).

### 2. Enable Workflow

1. Navigate to **Actions** tab in GitHub
2. Find "Production Health Monitor" workflow
3. Click **Enable workflow** if prompted
4. Test with **Run workflow** button

### 3. Monitor Results

- **Success:** Workflow completes with green checkmark
- **Failure:** Workflow fails and creates a GitHub issue with label `production`, `monitoring`, `urgent`

## Manual Monitoring

Run the monitoring script locally:

```powershell
# Without authentication
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/monitor-production.ps1

# With authentication (set env vars first)
$env:ADVANCIA_API_BEARER = "your-token-here"
$env:ADVANCIA_API_KEY = "your-key-here"
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/monitor-production.ps1
```

## What's Monitored

### Health Endpoints

- ✅ `/api/health` - Backend health and database connectivity
- ✅ `/api/system/status` - System-wide status and alerts
- ✅ `/api/system/health` - Detailed system health metrics

### Admin Endpoints (requires auth)

- ✅ `/api/admin/users` - User management endpoint
- Returns 401 without valid token (expected behavior)

### Frontend

- ✅ `https://www.advanciapayledger.com` - Page load time and availability
- Measures response time and page size

## Performance Thresholds

- 🟢 **Green:** < 2000ms load time
- 🟡 **Yellow:** 2000-5000ms load time
- 🔴 **Red:** > 5000ms load time

## Alerting

### GitHub Issues

Failed checks automatically create issues with:

- Timestamp of failure
- Link to workflow run
- Labels: `production`, `monitoring`, `urgent`

### Future Enhancements

Consider adding:

- Slack/Discord notifications via webhooks
- Email alerts via GitHub Actions marketplace actions
- Integration with Sentry, Datadog, or New Relic
- Custom dashboard for historical monitoring data

## Troubleshooting

### Workflow Not Running

- Check if workflow is enabled in Actions tab
- Verify cron schedule syntax
- Check repository permissions for Actions

### Authentication Failures

- Verify secrets are set correctly
- Ensure bearer token hasn't expired
- Check API key is valid

### False Positives

- Review script output in workflow logs
- Adjust timeout values in `monitor-production.ps1` if needed
- Update expected status codes for your endpoints

## Maintenance

### Update Monitoring Frequency

Edit cron expression in `.github/workflows/production-monitor.yml`:

```yaml
schedule:
  - cron: "*/15 * * * *" # Every 15 minutes
  - cron: "0 * * * *" # Every hour
  - cron: "0 0 * * *" # Daily at midnight
```

### Add New Endpoints

Edit `scripts/monitor-production.ps1` and add to the `$endpoints` array:

```powershell
$endpoints = @(
    @{Name="New Endpoint"; Url="https://api.advanciapayledger.com/api/new"; Method="Get"}
)
```

### Disable Monitoring

Navigate to workflow in Actions tab and click **Disable workflow**

## Related Documentation

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Production Deployment Guide](../RENDER_DEPLOY_DEBUG_GUIDE.md)
- [System Architecture](../README.md)

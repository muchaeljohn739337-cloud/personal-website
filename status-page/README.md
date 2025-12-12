# 🎯 Advancia Status Page - Solo Operator Guide

**Real-time system monitoring and incident tracking for self-hosted deployments.**

This status page automatically monitors your Advancia platform and provides visibility into uptime, performance, and incidents—designed for single-operator management with zero manual intervention.

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADVANCIA STATUS FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Backend    │      │   Frontend   │      │  PostgreSQL  │
│   (Port      │      │   (Port      │      │   Database   │
│    4000)     │      │    3000)     │      │              │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       └─────────────────────┴─────────────────────┘
                             │
                   ┌─────────▼──────────┐
                   │   PM2 Process      │
                   │   Manager          │
                   │   - Auto-restart   │
                   │   - Log rotation   │
                   │   - Memory monitor │
                   └─────────┬──────────┘
                             │
                   ┌─────────▼──────────┐
                   │   Watchdog Script  │
                   │   (Every 2 min)    │
                   │   - Health checks  │
                   │   - Port scans     │
                   │   - Response time  │
                   └─────────┬──────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
     ┌─────▼──────┐   ┌──────▼──────┐   ┌─────▼──────┐
     │   Logs     │   │  Incidents  │   │  Metrics   │
     │   JSON     │   │    JSON     │   │   JSON     │
     │  /logs/    │   │  /logs/     │   │  /logs/    │
     └─────┬──────┘   └──────┬──────┘   └─────┬──────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                   ┌─────────▼──────────┐
                   │   Nginx Reverse    │
                   │   Proxy (Port 80)  │
                   │   /status route    │
                   └─────────┬──────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
     ┌─────▼──────┐   ┌──────▼──────┐   ┌─────▼──────┐
     │   Status   │   │  Grafana    │   │  Email/    │
     │   Web UI   │   │  Dashboard  │   │  Slack     │
     │  (Public)  │   │  (Private)  │   │  Alerts    │
     └────────────┘   └─────────────┘   └────────────┘
```

---

## 🚀 Core Features

### ✅ Automatic Health Monitoring

- **Backend API**: Port 4000 health endpoint checks
- **Frontend App**: Port 3000 availability tests
- **Database**: PostgreSQL connection validation
- **Response Time**: Tracks latency trends (<200ms target)
- **Error Rates**: Monitors 4xx/5xx responses

### 📊 Real-Time Metrics Collection

- **CPU Usage**: Per-process monitoring
- **Memory Usage**: Heap and RSS tracking
- **Request Counts**: API calls per minute
- **Active Connections**: WebSocket + HTTP
- **Uptime Percentage**: 7-day, 30-day, 90-day rolling

### 🔔 Intelligent Alerting

- **Downtime Detection**: Immediate alerts (< 30 seconds)
- **Performance Degradation**: Warns if response time > 1s
- **Resource Exhaustion**: Alerts at 85% memory/CPU
- **Silent Failures**: Catches hung processes
- **Auto-Recovery**: Triggers PM2 restarts

### 📈 Historical Tracking

- **Incident Logs**: Timestamped events with resolution times
- **Uptime Reports**: Daily/weekly/monthly summaries
- **Performance Trends**: Response time graphs
- **Error Analytics**: Categorized failure patterns
- **Deployment History**: Version tracking with rollback info

---

## ⚙️ Installation & Setup

### Prerequisites

```bash
# Ensure PM2 is installed
npm install -g pm2

# Install required monitoring tools
npm install --save node-cron express axios ws
```

### Step 1: Deploy Watchdog Script

```bash
# Copy watchdog to project root
cp status-page/scripts/watchdog.ps1 ./scripts/

# Make it executable (Linux/Mac)
chmod +x scripts/watchdog.ps1

# Test manually
pwsh scripts/watchdog.ps1
```

**Watchdog runs every 2 minutes and checks:**

- Backend API `/api/health` endpoint
- Frontend homepage accessibility
- Database connection via Prisma
- PM2 process status
- Disk space availability
- SSL certificate expiration

### Step 2: Configure PM2 Monitoring

```bash
# Start with PM2 ecosystem file
pm2 start ecosystem.config.js

# Enable PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Save configuration
pm2 save
pm2 startup
```

**`ecosystem.config.js` example:**

```javascript
module.exports = {
  apps: [
    {
      name: "advancia-backend",
      script: "backend/dist/index.js",
      instances: 1,
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "advancia-frontend",
      script: "npm",
      args: "run start",
      cwd: "./frontend",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
    },
    {
      name: "advancia-watchdog",
      script: "pwsh",
      args: "-NoProfile -ExecutionPolicy Bypass -File ./scripts/watchdog.ps1",
      cron_restart: "*/2 * * * *",
      autorestart: false,
      watch: false,
      log_file: "./logs/watchdog.log",
    },
  ],
};
```

### Step 3: Configure Nginx Status Endpoint

```bash
# Copy Nginx config
sudo cp status-page/nginx/status.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/status.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**`/etc/nginx/sites-available/status.conf`:**

```nginx
server {
    listen 80;
    server_name status.advanciapayledger.com;

    # Status page UI
    location /status {
        alias /var/www/advancia-status;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API for status data
    location /status/api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Logs endpoint (requires authentication)
    location /status/logs {
        auth_basic "Restricted Access";
        auth_basic_user_file /etc/nginx/.htpasswd;
        alias /var/www/advancia-status/logs;
        autoindex on;
    }

    # SSL configuration (managed by Certbot)
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/status.advanciapayledger.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/status.advanciapayledger.com/privkey.pem;
}
```

### Step 4: Enable HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d status.advanciapayledger.com

# Auto-renewal is configured by default
# Test renewal:
sudo certbot renew --dry-run
```

### Step 5: Configure DNS

**Add A Record in Cloudflare:**

- **Type**: A
- **Name**: status
- **Content**: [Your server IP]
- **TTL**: Auto
- **Proxy**: Disabled (for direct access)

### Step 6: Set Up Alert Notifications

**Email Configuration (`config/notifications.json`):**

```json
{
  "email": {
    "enabled": true,
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_user": "alerts@advanciapayledger.com",
    "smtp_password": "YOUR_APP_PASSWORD",
    "recipients": ["you@example.com"]
  },
  "slack": {
    "enabled": false,
    "webhook_url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  },
  "alert_thresholds": {
    "downtime_seconds": 30,
    "response_time_ms": 1000,
    "cpu_percent": 85,
    "memory_percent": 85
  }
}
```

**Test alerts:**

```bash
pwsh scripts/test-notifications.ps1
```

---

## 📋 Daily Operations

### Check System Health

```bash
# Quick status check
pm2 status

# View logs
pm2 logs advancia-backend --lines 50
pm2 logs advancia-frontend --lines 50
pm2 logs advancia-watchdog --lines 20

# Detailed monitoring
pm2 monit
```

### View Status Dashboard

**Public Status Page:**

- URL: `https://status.advanciapayledger.com/status`
- Shows: Uptime, incidents, historical performance
- No authentication required

**Grafana Dashboard (Private):**

- URL: `https://status.advanciapayledger.com/grafana`
- Shows: Real-time metrics, custom queries
- Requires authentication

### Check Incident History

```bash
# View recent incidents
cat logs/incidents.json | jq '.[-10:]'

# Count incidents this month
cat logs/incidents.json | jq '[.[] | select(.timestamp | startswith("2025-11"))] | length'

# Generate uptime report
pwsh scripts/uptime-report.ps1 --days 30
```

### Manual Health Check

```bash
# Run watchdog manually
pwsh scripts/health-check.ps1

# Test individual services
curl -f http://localhost:4000/api/health || echo "Backend down"
curl -f http://localhost:3000 || echo "Frontend down"

# Database connectivity
cd backend && npx prisma db execute --stdin <<< "SELECT 1;"
```

---

## 🔧 Maintenance Tasks

### Log Rotation

**PM2 automatic rotation (already configured):**

- Logs rotate at 10MB
- Keeps 7 days of history
- Compressed archives stored in `logs/archive/`

**Manual rotation:**

```bash
# Flush PM2 logs
pm2 flush

# Archive old logs
pwsh scripts/archive-logs.ps1 --older-than 30
```

### Incident Log Cleanup

```bash
# Keep only recent incidents
pwsh scripts/cleanup-incidents.ps1 --keep-days 90

# Archive to cold storage
pwsh scripts/archive-incidents.ps1 --destination /backups/incidents/
```

### Performance Optimization

```bash
# Clear old metrics
pwsh scripts/cleanup-metrics.ps1 --keep-days 30

# Vacuum PostgreSQL
cd backend && npx prisma db execute --stdin <<< "VACUUM ANALYZE;"

# Clear Nginx cache
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx
```

---

## 🚨 Incident Response

### When Alerts Fire

**1. Assess Severity:**

```bash
# Check current status
pm2 status

# View error logs
pm2 logs --err --lines 100
```

**2. Quick Fixes:**

```bash
# Restart specific service
pm2 restart advancia-backend

# Restart all services
pm2 restart all

# Reload without downtime
pm2 reload advancia-backend
```

**3. Database Issues:**

```bash
# Check connections
cd backend && npx prisma studio

# Run migrations
cd backend && npx prisma migrate deploy

# Reset if needed (CAUTION: Data loss)
cd backend && npx prisma migrate reset
```

**4. Document Incident:**

```bash
# Add to incident log
pwsh scripts/log-incident.ps1 \
  --severity "high" \
  --title "Backend API Timeout" \
  --description "Response time exceeded 5s, restarted service" \
  --resolution "PM2 restart resolved issue"
```

### Escalation Checklist

- [ ] Services restarted
- [ ] Logs reviewed
- [ ] Database connection verified
- [ ] Disk space checked (`df -h`)
- [ ] Memory usage checked (`free -m`)
- [ ] Network connectivity tested (`ping 8.8.8.8`)
- [ ] SSL certificate validated (`curl https://advanciapayledger.com`)
- [ ] Incident logged

---

## 📈 Monitoring Dashboards

### Built-in Status Page

**Location:** `/status-page/public/index.html`

**Features:**

- Current service status (green/yellow/red)
- 7-day uptime percentage
- Recent incidents timeline
- Response time chart
- Scheduled maintenance notices

**Customization:**
Edit `public/config.js` to adjust:

- Update intervals
- Color schemes
- Displayed metrics
- Public vs. private visibility

### Grafana Setup (Optional)

```bash
# Install Grafana
sudo apt-get install -y grafana

# Start service
sudo systemctl enable grafana-server
sudo systemctl start grafana-server

# Access at http://localhost:3001
# Default credentials: admin/admin
```

**Import Dashboard:**

1. Open Grafana → Dashboards → Import
2. Upload `status-page/grafana/advancia-dashboard.json`
3. Select data source: Prometheus or InfluxDB
4. Click "Import"

---

## 🔐 Security & Privacy

### Authentication

**Status page access levels:**

- **Public**: Service status only (no logs)
- **Private**: Full metrics and logs (password protected)

**Configure access:**

```bash
# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd admin

# Update Nginx config to require auth
sudo nginx -t && sudo systemctl reload nginx
```

### Data Retention

**Automatic cleanup schedule:**

- **Logs**: 30 days
- **Incidents**: 90 days
- **Metrics**: 365 days
- **Backups**: 7 days

**Configure in `config/retention.json`:**

```json
{
  "logs_retention_days": 30,
  "incidents_retention_days": 90,
  "metrics_retention_days": 365,
  "backup_retention_days": 7
}
```

---

## 🛠️ Advanced Configuration

### Custom Health Checks

**Add your own checks to `scripts/watchdog.ps1`:**

```powershell
# Example: Check Redis connectivity
function Test-Redis {
    try {
        $result = redis-cli ping
        return $result -eq "PONG"
    } catch {
        return $false
    }
}

# Example: Check external API dependency
function Test-ExternalAPI {
    try {
        $response = Invoke-WebRequest -Uri "https://api.stripe.com/v1/health" -TimeoutSec 5
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}
```

### Custom Alerts

**Edit `scripts/notifications.ps1` to add alert types:**

```powershell
# Example: Alert on high error rate
if ($errorRate -gt 0.05) {
    Send-Alert -Type "ERROR_SPIKE" -Message "Error rate exceeded 5%"
}

# Example: Alert on slow database queries
if ($avgQueryTime -gt 500) {
    Send-Alert -Type "SLOW_QUERIES" -Message "Avg query time: ${avgQueryTime}ms"
}
```

### Integration with External Services

**Webhook configuration (`config/webhooks.json`):**

```json
{
  "webhooks": [
    {
      "name": "PagerDuty",
      "url": "https://events.pagerduty.com/v2/enqueue",
      "events": ["downtime", "critical"],
      "headers": {
        "Authorization": "Token token=YOUR_PAGERDUTY_TOKEN"
      }
    },
    {
      "name": "Discord",
      "url": "https://discord.com/api/webhooks/YOUR_WEBHOOK",
      "events": ["all"]
    }
  ]
}
```

---

## 📊 Key Metrics Reference

| Metric            | Target | Warning | Critical |
| ----------------- | ------ | ------- | -------- |
| **Uptime**        | 99.9%  | <99%    | <95%     |
| **Response Time** | <200ms | >1000ms | >5000ms  |
| **Error Rate**    | <0.1%  | >1%     | >5%      |
| **CPU Usage**     | <50%   | >80%    | >95%     |
| **Memory Usage**  | <60%   | >85%    | >95%     |
| **Disk Space**    | <70%   | >85%    | >95%     |

---

## 🐛 Troubleshooting

### Status Page Not Updating

```bash
# Check watchdog is running
pm2 list | grep watchdog

# Restart watchdog
pm2 restart advancia-watchdog

# Check logs
pm2 logs advancia-watchdog --lines 50
```

### Nginx 502 Bad Gateway

```bash
# Check backend is running
pm2 status advancia-backend

# Check backend logs
pm2 logs advancia-backend --err --lines 20

# Restart backend
pm2 restart advancia-backend
```

### No Alerts Received

```bash
# Test email configuration
pwsh scripts/test-email.ps1

# Check notification logs
cat logs/notifications.log | tail -20

# Verify SMTP credentials
cd backend && node -e "require('./src/services/notificationService').testEmail()"
```

### High Memory Usage

```bash
# Check process memory
pm2 list

# Restart high-memory process
pm2 restart advancia-backend

# Enable memory monitoring
pm2 set pm2-logrotate:max_size 5M
```

---

## 📚 Additional Resources

- **Main README**: `../README.md` - Installation and configuration
- **API Docs**: `../docs/API.md` - Backend API reference
- **Troubleshooting**: `../TROUBLESHOOTING.md` - Common issues
- **Deployment**: `../PRODUCTION_DEPLOYMENT_GUIDE.md` - Production setup
- **Scripts**: `./scripts/` - All automation scripts
- **Logs**: `./logs/` - Historical data

---

## 🎯 Solo Operator Checklist

**Daily:**

- [ ] Check status page (`https://status.advanciapayledger.com`)
- [ ] Review PM2 status (`pm2 status`)
- [ ] Scan alert emails/Slack messages

**Weekly:**

- [ ] Review incident logs (`cat logs/incidents.json`)
- [ ] Check disk space (`df -h`)
- [ ] Review performance trends (`pwsh scripts/uptime-report.ps1 --days 7`)
- [ ] Update dependencies if needed (`npm outdated`)

**Monthly:**

- [ ] Archive old logs (`pwsh scripts/archive-logs.ps1`)
- [ ] Review uptime reports (`pwsh scripts/uptime-report.ps1 --days 30`)
- [ ] Test backup restoration
- [ ] Update SSL certificates if needed (`sudo certbot renew`)
- [ ] Review and optimize database (`VACUUM ANALYZE`)

**Quarterly:**

- [ ] Conduct security audit
- [ ] Test disaster recovery plan
- [ ] Update documentation
- [ ] Review and adjust alert thresholds

---

**Status Page Version:** 1.0.0  
**Last Updated:** November 2025  
**Solo Operator:** Self-Hosted Advancia Platform  
**Support:** Internal documentation only

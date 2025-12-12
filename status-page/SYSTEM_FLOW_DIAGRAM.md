# 🎯 Advancia Status Page - System Flow Diagram

## Visual System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                          ADVANCIA PLATFORM SERVICES                         │
│                                                                             │
│    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐        │
│    │   Backend API   │   │  Frontend App   │   │   PostgreSQL    │        │
│    │   Port 4000     │   │   Port 3000     │   │    Database     │        │
│    │                 │   │                 │   │                 │        │
│    │ • REST API      │   │ • Next.js       │   │ • User Data     │        │
│    │ • WebSocket     │   │ • React UI      │   │ • Transactions  │        │
│    │ • Auth          │   │ • Dashboard     │   │ • Sessions      │        │
│    └────────┬────────┘   └────────┬────────┘   └────────┬────────┘        │
│             │                     │                     │                   │
└─────────────┼─────────────────────┼─────────────────────┼───────────────────┘
              │                     │                     │
              │                     │                     │
              ▼                     ▼                     ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                     PM2 PROCESS MANAGER                     │
    │                                                             │
    │  • Auto-restart on crash                                   │
    │  • Memory monitoring (max 500MB backend, 400MB frontend)   │
    │  • CPU usage tracking                                      │
    │  • Log aggregation and rotation                            │
    │  • Cluster mode for backend (scalable)                     │
    │  • Health status reporting                                 │
    └─────────────────────────┬───────────────────────────────────┘
                              │
                              │ Process Metrics
                              │ Exit Codes
                              │ Restart Events
                              ▼
    ┌─────────────────────────────────────────────────────────────┐
    │              WATCHDOG MONITORING SCRIPT                     │
    │                (Runs every 2 minutes)                       │
    │                                                             │
    │  Health Checks:                     Thresholds:             │
    │  ✓ Backend /api/health             • Response time: <1s    │
    │  ✓ Frontend homepage               • CPU usage: <85%       │
    │  ✓ Database connectivity           • Memory: <85%          │
    │  ✓ PM2 process status              • Disk space: <90%      │
    │  ✓ Disk space availability         • Uptime target: 99.9%  │
    │  ✓ SSL certificate expiry                                  │
    │                                                             │
    │  Actions on Failure:                                       │
    │  → Log incident to JSON                                    │
    │  → Send alert (email/Slack)                                │
    │  → Attempt auto-recovery (pm2 restart)                     │
    │  → Update status.json                                      │
    └─────────────────────────┬───────────────────────────────────┘
                              │
                              │ Writes to:
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐       ┌──────────┐
    │ status   │        │incidents │       │ metrics  │
    │ .json    │        │ .json    │       │ .json    │
    │          │        │          │       │          │
    │ Current  │        │ History  │       │ Time     │
    │ health   │        │ of       │       │ series   │
    │ snapshot │        │ outages  │       │ data     │
    └─────┬────┘        └─────┬────┘       └─────┬────┘
          │                   │                   │
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              │ Served by:
                              ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                  NGINX REVERSE PROXY                        │
    │                      (Port 80/443)                          │
    │                                                             │
    │  Routes:                                                    │
    │  /status           → Public status page UI                 │
    │  /status/data      → JSON data endpoints (public read)     │
    │  /status/logs      → Log files (password protected)        │
    │  /status/incidents → Incident history (public)             │
    │  /status/health    → Simple health check                   │
    │                                                             │
    │  SSL/TLS: Let's Encrypt (auto-renewal)                     │
    │  Caching: Static assets cached 1 hour                      │
    │  Security: HTTPS redirect, security headers                │
    └─────────────────────────┬───────────────────────────────────┘
                              │
                              │ Accessible via:
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐       ┌──────────┐
    │  Public  │        │ Grafana  │       │  Email   │
    │  Status  │        │Dashboard │       │  Slack   │
    │   Web    │        │(Private) │       │ Alerts   │
    │   UI     │        │          │       │          │
    │          │        │ Real-    │       │ Instant  │
    │ • Uptime │        │ time     │       │ notifi-  │
    │ • Metrics│        │ graphs   │       │ cations  │
    │ • History│        │ Custom   │       │ on       │
    │ • Status │        │ queries  │       │ outages  │
    └──────────┘        └──────────┘       └──────────┘
       Public              Private            Push
    (Anyone can          (Admin only)       (Critical
      view)              (Auth required)    events only)
```

## Data Flow Sequence

### Normal Operation (Every 2 minutes)

```
1. PM2 Cron Trigger
   ↓
2. Watchdog Script Executes
   ↓
3. Backend Health Check
   → GET http://localhost:4000/api/health
   → Measure response time
   → Check HTTP 200 status
   ↓
4. Frontend Health Check
   → GET http://localhost:3000
   → Measure response time
   → Verify page loads
   ↓
5. Database Health Check
   → Execute: SELECT 1;
   → Measure query time
   → Verify connection
   ↓
6. PM2 Process Check
   → Query: pm2 jlist
   → Check each process status
   → Monitor CPU/memory
   ↓
7. System Resource Check
   → Disk space percentage
   → Available free GB
   ↓
8. SSL Certificate Check
   → Days until expiry
   → Validity status
   ↓
9. Write Results
   → Update status.json (current snapshot)
   → Append to metrics.json (historical)
   → No alerts sent (everything healthy)
   ↓
10. Exit (wait 2 minutes, repeat)
```

### Incident Detection & Response Flow

```
1. Watchdog Detects Issue
   (e.g., Backend not responding)
   ↓
2. Log Incident
   → Write to incidents.json
   → Timestamp: 2025-11-30T15:23:45Z
   → Severity: critical
   → Component: backend
   ↓
3. Send Alert (Parallel)
   ├→ Email Alert
   │  → SMTP to admin@advanciapayledger.com
   │  → Subject: [CRITICAL] Backend Down
   │  → Body: Error details, timestamp
   │
   ├→ Slack Webhook (if enabled)
   │  → POST to webhook URL
   │  → Formatted message with severity
   │
   └→ Discord/PagerDuty (if enabled)
      → Integration-specific payloads
   ↓
4. Attempt Auto-Recovery
   → Execute: pm2 restart advancia-backend
   → Wait 10 seconds
   → Re-check health
   ↓
5. Verify Recovery
   ├→ If Healthy:
   │  → Log resolution in incidents.json
   │  → Send recovery notification
   │  → Update status.json to "healthy"
   │
   └→ If Still Down:
      → Escalate severity
      → Log continued outage
      → Wait for next cycle (2 min)
   ↓
6. Update Public Status
   → status.json reflects new state
   → Nginx serves updated data
   → Web UI auto-refreshes (30s interval)
   → Visitors see current status
```

## Alert Rate Limiting

```
┌─────────────────────────────────────────────┐
│        Alert Throttling Logic               │
└─────────────────────────────────────────────┘

Event: Backend Down
  ↓
Check: Alert sent in last 15 minutes?
  ├→ YES: Skip alert (cooldown period)
  │       Log locally only
  │
  └→ NO: Check hourly limit
         ↓
         Check: >10 alerts sent this hour?
           ├→ YES: Send summary alert
           │       "Multiple incidents detected"
           │       List all recent issues
           │
           └→ NO: Send individual alert
                  Increment counter
                  Record timestamp
```

## Uptime Calculation

```
Metrics Collection:
┌─────────────────────────────────────────────┐
│ Every 2 minutes = 720 checks per day       │
│ Every check writes to metrics.json         │
│                                             │
│ {                                           │
│   "timestamp": "2025-11-30T15:24:00Z",     │
│   "component": "backend",                  │
│   "status": "healthy",                     │
│   "response_time_ms": 145                  │
│ }                                           │
└─────────────────────────────────────────────┘
       ↓
Uptime Formula:
┌─────────────────────────────────────────────┐
│ Uptime % = (Healthy Checks / Total Checks) │
│            × 100                            │
│                                             │
│ Example (7 days):                           │
│ Total checks: 5,040                         │
│ Healthy: 5,030                              │
│ Down: 10                                    │
│                                             │
│ Uptime = (5030/5040) × 100 = 99.80%        │
└─────────────────────────────────────────────┘
```

## Directory Structure

```
advancia-platform/
│
├── status-page/
│   ├── README.md                    ← Solo operator guide
│   ├── config/
│   │   └── notifications.json       ← Alert settings
│   ├── scripts/
│   │   ├── watchdog.ps1            ← Main monitoring script
│   │   └── setup.ps1               ← One-command setup
│   ├── nginx/
│   │   └── status.conf             ← Nginx configuration
│   └── public/
│       └── index.html              ← Status page UI
│
├── logs/
│   ├── status.json                 ← Current snapshot
│   ├── incidents.json              ← Incident history
│   ├── metrics.json                ← Time-series data
│   ├── watchdog.log                ← Watchdog execution log
│   ├── backend-*.log               ← Application logs
│   ├── frontend-*.log              ← Application logs
│   └── archive/                    ← Rotated logs (>7 days)
│
├── ecosystem.config.js             ← PM2 configuration
└── scripts/
    └── test-status-page.ps1        ← Quick test script
```

## Timeline View (24-hour period)

```
Time     Backend  Frontend  Database  Incidents
─────────────────────────────────────────────────
00:00    ████████ ████████  ████████  [None]
02:00    ████████ ████████  ████████  [None]
04:00    ████████ ████████  ████████  [None]
06:00    ████████ ████████  ████████  [None]
08:00    ████████ ████████  ████████  [None]
10:00    ████████ ████████  ████████  [None]
12:00    ████████ ████▓▓▓▓  ████████  [Slow Response]
14:00    ████████ ████████  ████████  [Resolved]
16:00    ████████ ████████  ████████  [None]
18:00    ████████ ████████  ████████  [None]
20:00    ████████ ████████  ████████  [None]
22:00    ████████ ████████  ████████  [None]

Legend:
████ = Healthy (green)
▓▓▓▓ = Degraded (yellow)
░░░░ = Down (red)
```

---

**Document Version:** 1.0.0  
**Last Updated:** November 30, 2025  
**Purpose:** Visual reference for solo operators managing Advancia status monitoring

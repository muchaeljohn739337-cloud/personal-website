# 🏗️ Advancia SaaS Platform - System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 14)                            │
│                      Port 3000 / Vercel / Cloudflare                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Homepage   │  │   Dashboard  │  │    Admin     │                  │
│  │              │  │              │  │              │                  │
│  │  • Hero      │  │  • Profile   │  │  • Users     │                  │
│  │  • Features  │  │  • Wallet    │  │  • Payments  │                  │
│  │  • Pricing   │  │  • Txs       │  │  • Support   │                  │
│  └──────────────┘  └──────────────┘  │  • Security  │← NEW! 🔐        │
│                                       └──────────────┘                  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │           Security Control Center (Admin)                         │  │
│  │                                                                    │  │
│  │  • Real-time Status Dashboard (10s refresh)                       │  │
│  │  • Threat Level Indicator (LOW/MEDIUM/HIGH/CRITICAL)              │  │
│  │  • Guardian AI Status (Active/Inactive)                           │  │
│  │  • Anti-Detect Status (Active/Inactive)                           │  │
│  │  • Pending Approvals Queue (One-click approve/reject)             │  │
│  │  • Security Events Log (Severity-filtered)                        │  │
│  │  • Blocked IPs Table (Unblock button)                             │  │
│  │  • Protect Mode Controls (Emergency lockdown)                     │  │
│  │  • Threat Intelligence (Attack patterns, forensics)               │  │
│  │  • Audit Trail Timeline (Complete history)                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                │ HTTPS / WebSocket
                                │
┌───────────────────────────────┴─────────────────────────────────────────┐
│                          BACKEND (Express + TypeScript)                  │
│                        Port 4000 / Render / Docker                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   UNIFIED SECURITY ORCHESTRATOR                   │   │
│  │                                                                   │   │
│  │  ┌──────────────────────┐     ┌──────────────────────┐          │   │
│  │  │    GUARDIAN AI       │◄───►│   ANTI-DETECT LAYER  │          │   │
│  │  │                      │     │                      │          │   │
│  │  │  • Health Monitor    │     │  1. Anti-Suggest     │          │   │
│  │  │  • Memory Tracker    │     │  2. Anti-Plan        │          │   │
│  │  │  • CPU Monitor       │     │  3. Anti-Approve     │          │   │
│  │  │  • Vuln Scanner      │     │  4. Anti-Secure      │          │   │
│  │  │  • API Usage Track   │     │  5. Anti-Organize    │          │   │
│  │  │  • Auto-Correction   │     │  6. Anti-Exploit     │          │   │
│  │  │  • DB Reconnect      │     │                      │          │   │
│  │  │  • Email/Slack       │     │  • Rate Limiting     │          │   │
│  │  │                      │     │  • IP Blocking       │          │   │
│  │  │  ⏰ 1min health      │     │  • Honeypot Traps    │          │   │
│  │  │  ⏰ 5min security    │     │  • Approval Queue    │          │   │
│  │  │  ⏰ 1hr vuln scan    │     │  • Forensic Logging  │          │   │
│  │  └──────────────────────┘     │  • Protect Mode      │          │   │
│  │           ▲                    └──────────────────────┘          │   │
│  │           │                             ▲                         │   │
│  │           └─────────EVENT COORDINATION──┘                         │   │
│  │                                                                   │   │
│  │  Event Stream (Bidirectional):                                   │   │
│  │  • security_threat → unified handler                             │   │
│  │  • memory_leak_detected → check approvals before restart         │   │
│  │  • critical_threat → escalate monitoring                         │   │
│  │  • protect_mode_activated → system lockdown                      │   │
│  │  • approval_required → email/slack notification                  │   │
│  │  • exploit_detected → threat intelligence update                 │   │
│  │  • ip_blocked → guardian metric logging                          │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      EXPRESS MIDDLEWARE STACK                     │   │
│  │                                                                   │   │
│  │  1. Unified Security Middleware ◄─ FIRST (blocks threats)        │   │
│  │  2. CORS + Trust Proxy                                            │   │
│  │  3. Rate Limiting (60 req/min per IP)                             │   │
│  │  4. JSON Parser + Body Parser                                     │   │
│  │  5. JWT Authentication (where required)                           │   │
│  │  6. Role Authorization (admin/user/moderator)                     │   │
│  │  7. Request Logging                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         API ROUTES                                │   │
│  │                                                                   │   │
│  │  /api/auth          • Login, Register, 2FA, OTP                  │   │
│  │  /api/users         • Profile, Wallet, Transactions              │   │
│  │  /api/payments      • Stripe, Crypto, Balance, Webhook           │   │
│  │  /api/tokens        • Token wallet, transactions, rewards        │   │
│  │  /api/rewards       • Tier progress, claim, history              │   │
│  │  /api/support       • Tickets, FAQ, contact                      │   │
│  │  /api/system        • Health, status, metrics                    │   │
│  │  /api/ethereum      • ETH gateway, contracts, gas                │   │
│  │                                                                   │   │
│  │  /api/admin/security   ← NEW! 🔐 Security Control Center        │   │
│  │    • GET  /status              • GET  /events                    │   │
│  │    • GET  /forensic-report     • GET  /blocked-ips               │   │
│  │    • GET  /approvals           • POST /unblock-ip/:ip            │   │
│  │    • GET  /approvals/:id       • POST /disable-protect-mode      │   │
│  │    • POST /approvals/:id       • GET  /audit-trail               │   │
│  │    • GET  /rules               • GET  /honeypots                 │   │
│  │    • POST /rules               • PATCH /rules/:id                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       SOCKET.IO (Real-time)                       │   │
│  │                                                                   │   │
│  │  Events:                                                          │   │
│  │  • join-room (user-{userId})                                      │   │
│  │  • transaction-updated                                            │   │
│  │  • notification-received                                          │   │
│  │  • balance-updated                                                │   │
│  │  • security-alert ← NEW! 🔐                                      │   │
│  │  • approval-required ← NEW! 🔐                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                │ Prisma ORM
                                │
┌───────────────────────────────┴─────────────────────────────────────────┐
│                        DATABASE (PostgreSQL 15)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │
│  │  Core Data Models  │  │  Guardian AI Data  │  │ Anti-Detect Data │  │
│  │                    │  │                    │  │                  │  │
│  │  • User            │  │  • BlockedIP       │  │ • ApprovalQueue  │  │
│  │  • Transaction     │  │  • Incident        │  │ • BlockedAction  │  │
│  │  • TokenWallet     │  │  • SecurityEvent   │  │ • SecurityRule   │  │
│  │  • Reward          │  │  • SystemMetric    │  │ • AuditTrail     │  │
│  │  • UserTier        │  │  • VulnScan        │  │ • HoneypotAccess │  │
│  │  • Notification    │  │                    │  │ • RateLimitViol  │  │
│  │  • SupportTicket   │  │  (5 tables)        │  │                  │  │
│  │  • AuditLog        │  │                    │  │  (6 tables)      │  │
│  │  • ... (30+ more)  │  │                    │  │                  │  │
│  └────────────────────┘  └────────────────────┘  └──────────────────┘  │
│                                                                           │
│  Indexes: 50+ optimized indexes for fast queries                         │
│  JSONB columns for flexible data (forensic_data, request_data, etc.)     │
│  Foreign keys enforcing referential integrity                             │
│                                                                           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                │ Connections
                                │
┌───────────────────────────────┴─────────────────────────────────────────┐
│                         EXTERNAL INTEGRATIONS                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Stripe     │  │    Crypto    │  │   Email      │                  │
│  │              │  │              │  │              │                  │
│  │ • Payments   │  │ • Bitcoin    │  │ • SMTP       │                  │
│  │ • Subscr.    │  │ • Ethereum   │  │ • Gmail      │                  │
│  │ • Webhooks   │  │ • USDC       │  │ • Alerts     │                  │
│  │ • Invoices   │  │ • Coinbase   │  │ • Approvals  │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │    Slack     │  │   Social     │  │   Storage    │                  │
│  │              │  │              │  │              │                  │
│  │ • Webhooks   │  │ • OAuth2     │  │ • Local FS   │                  │
│  │ • Alerts     │  │ • Twitter    │  │ • S3         │                  │
│  │ • Notifs     │  │ • Discord    │  │ • Cloudflare │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                        DATA FLOW EXAMPLES
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│ Example 1: SQL Injection Attempt (Auto-Blocked)                          │
└─────────────────────────────────────────────────────────────────────────┘

  Client
    │
    │ POST /api/auth/login
    │ {"email":"admin@test.com OR 1=1--", "password":"test"}
    │
    ▼
  Unified Security Middleware
    │
    │ 1. Anti-Exploit detects SQL injection pattern
    │ 2. Blocks request immediately
    │ 3. Adds IP to blockedIPs set (24hr)
    │ 4. Creates BlockedAction entry in DB
    │ 5. Creates SecurityEvent entry
    │ 6. Emits "exploit_detected" event
    │
    ▼
  Guardian AI (Event Handler)
    │
    │ 1. Receives "exploit_detected" event
    │ 2. Sends email to ADMIN_EMAIL
    │ 3. Sends Slack notification
    │ 4. Creates forensic snapshot
    │ 5. Increments threat intelligence counter
    │
    ▼
  Client receives: 400 Bad Request
  {"error": "Request contains suspicious content"}


┌─────────────────────────────────────────────────────────────────────────┐
│ Example 2: Payment Requires Approval (Human-in-Loop)                     │
└─────────────────────────────────────────────────────────────────────────┘

  Client
    │
    │ POST /api/payments/checkout
    │ {"amount": 5000, "currency": "USD"}
    │
    ▼
  Unified Security Middleware
    │
    │ 1. Anti-Approve checks operation type
    │ 2. "PAYMENT_PROCESSING" requires approval
    │ 3. Creates ApprovalQueue entry
    │ 4. Sets status = PENDING, expires_at = +1hr
    │ 5. Emits "approval_required" event
    │
    ▼
  Guardian AI (Event Handler)
    │
    │ 1. Receives "approval_required" event
    │ 2. Sends email to ADMIN_EMAIL
    │ 3. Sends Slack notification with approve link
    │
    ▼
  Client receives: 202 Accepted
  {"auto_approved": false, "approval_id": "abc-123", "status": "PENDING"}

  ─────────────────────────────────

  Admin
    │
    │ Opens /admin/security
    │ Sees pending approval in queue
    │ Clicks "Approve" button
    │
    ▼
  POST /api/admin/security/approvals/abc-123
  {"approved": true, "reason": "Verified with user"}
    │
    ▼
  Unified Security Orchestrator
    │
    │ 1. Updates ApprovalQueue: status = APPROVED
    │ 2. Logs AuditTrail entry
    │ 3. Proceeds with payment
    │ 4. Emits "approval_processed" event
    │
    ▼
  Payment executes successfully
  Client notification sent


┌─────────────────────────────────────────────────────────────────────────┐
│ Example 3: Protect Mode Activated (Critical Threat)                      │
└─────────────────────────────────────────────────────────────────────────┘

  Multiple exploit attempts (10+ in 1 minute)
    │
    ▼
  Anti-Detect Layer
    │
    │ 1. Detects pattern: rapid exploit attempts
    │ 2. Activates Protect Mode
    │ 3. Sets protectMode = true
    │ 4. Freezes all endpoints except admin routes
    │ 5. Emits "protect_mode_activated" event
    │
    ▼
  Guardian AI (Event Handler)
    │
    │ 1. Receives "protect_mode_activated" event
    │ 2. Sends CRITICAL email to admin
    │ 3. Sends CRITICAL Slack notification
    │ 4. Creates comprehensive forensic snapshot
    │ 5. Increases monitoring frequency to 10s
    │
    ▼
  All non-admin requests blocked
  {"error": "System in protect mode"}

  ─────────────────────────────────

  Admin
    │
    │ Opens /admin/security
    │ Sees red "PROTECT MODE ACTIVE" banner
    │ Reviews security events and forensic report
    │ Identifies and resolves threat
    │ Clicks "Disable Protect Mode"
    │
    ▼
  POST /api/admin/security/disable-protect-mode
  {"reason": "Threat resolved, attacker IP blocked"}
    │
    ▼
  Unified Security Orchestrator
    │
    │ 1. Sets protectMode = false
    │ 2. Clears frozenEndpoints
    │ 3. Logs AuditTrail entry
    │ 4. Restores normal operation
    │
    ▼
  System returns to normal


═══════════════════════════════════════════════════════════════════════════
                         DEPLOYMENT ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│                            PRODUCTION (LIVE)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Vercel (Frontend)                                                │  │
│  │  https://advanciapayledger.com                                    │  │
│  │                                                                    │  │
│  │  • Next.js 14 Static Site + API Routes                            │  │
│  │  • Edge Network CDN (global)                                       │  │
│  │  • Auto SSL certificate                                            │  │
│  │  • Zero-downtime deploys                                           │  │
│  │  • Git auto-deploy on push                                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Render (Backend)                                                 │  │
│  │  https://api.advanciapayledger.com                                │  │
│  │                                                                    │  │
│  │  • Node.js 18+ Express server                                      │  │
│  │  • Auto-scaling (2-10 instances)                                   │  │
│  │  • PostgreSQL 15 database                                          │  │
│  │  • Health check: /api/health                                       │  │
│  │  • Auto-restart on crash                                           │  │
│  │  • Environment variables synced                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Cloudflare (Alternative/Backup)                                  │  │
│  │  https://advancia-platform.pages.dev                              │  │
│  │                                                                    │  │
│  │  • Pages (frontend static)                                         │  │
│  │  • Workers (API proxy)                                             │  │
│  │  • R2 Storage (file uploads)                                       │  │
│  │  • KV Storage (cache)                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT (LOCAL)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  PM2 Process Manager                                              │  │
│  │                                                                    │  │
│  │  • advancia-backend  (port 4000) - Express + Guardian + Anti-Det  │  │
│  │  • advancia-frontend (port 3000) - Next.js with hot-reload        │  │
│  │                                                                    │  │
│  │  Commands:                                                         │  │
│  │  • pm2 list       - Show status                                    │  │
│  │  • pm2 logs       - View logs                                      │  │
│  │  • pm2 monit      - Real-time monitoring                           │  │
│  │  • pm2 restart all - Restart services                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Local Database (Docker)                                          │  │
│  │                                                                    │  │
│  │  • PostgreSQL 15 container                                         │  │
│  │  • Port 5432 exposed                                               │  │
│  │  • Volume mounted for persistence                                  │  │
│  │  • docker-compose.yml included                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                          SECURITY LAYERS
═══════════════════════════════════════════════════════════════════════════

Layer 1: Anti-Suggest
  ├─ Blocked Keywords: 12 (delete, drop, bypass, disable, expose, etc.)
  ├─ Blocked Actions: 7 (delete_env, drop_db, bypass_approval, etc.)
  ├─ Blocked Paths: 5 (/config/secrets, /.env, /admin/delete, etc.)
  └─ Action: Block + Log + Alert

Layer 2: Anti-Plan
  ├─ Approval Required: 6 types (INFRA, SECURITY, DATABASE, etc.)
  ├─ Auto-Plan Blocked: 5 types (deployment, migration, etc.)
  └─ Action: Create approval request + Notify admin

Layer 3: Anti-Approve
  ├─ Zero Auto-Execution: 7 operations (payments, crypto, keys, etc.)
  ├─ Approval Queue: Timeout 1hr, 2FA support
  └─ Action: Queue + Wait for admin approval

Layer 4: Anti-Secure
  ├─ Rate Limiting: 100 req/min per IP
  ├─ IP Whitelisting: Configurable list
  ├─ Honeypot Traps: Auto-ban on access (7 days)
  └─ Action: Block + Ban + Alert

Layer 5: Anti-Organize
  ├─ Protected Structures: 6 types (tables, routes, config, etc.)
  ├─ Blocked Operations: 5 types (rename, delete, restructure, etc.)
  └─ Action: Block + Log + Alert

Layer 6: Anti-Exploit
  ├─ Injection Patterns: 7 types (SQL, XSS, path traversal, etc.)
  ├─ Bot Detection: Signature matching
  ├─ Rapid Scanning: Pattern detection
  └─ Action: Block + Ban + Protect Mode (if critical)


═══════════════════════════════════════════════════════════════════════════
                         MONITORING & ALERTS
═══════════════════════════════════════════════════════════════════════════

Guardian AI Monitors:
  ├─ Memory Usage (every 1 minute)
  │   └─ Alert if > 800 MB
  ├─ CPU Usage (every 30 seconds)
  │   └─ Alert if > 90%
  ├─ Security Scan (every 5 minutes)
  │   └─ Check for new threats
  ├─ Vulnerability Scan (every 1 hour)
  │   └─ Deep system analysis
  ├─ API Usage (every 30 seconds)
  │   └─ Track request rates
  └─ Database Health (every 1 minute)
      └─ Auto-reconnect if down

Anti-Detect Monitors:
  ├─ Blocked IPs (real-time)
  ├─ Attack Patterns (5-minute window)
  ├─ Approval Queue (real-time)
  ├─ Forensic Timeline (continuous)
  └─ Protect Mode Status (real-time)

Alert Channels:
  ├─ Email (SMTP)
  │   ├─ CRITICAL: Red, urgent action required
  │   ├─ WARNING: Yellow, attention needed
  │   └─ INFO: Green, informational
  ├─ Slack (Webhooks)
  │   ├─ Formatted messages with color-coding
  │   ├─ Quick action buttons
  │   └─ Thread replies for context
  └─ Dashboard (Real-time)
      ├─ 10-second auto-refresh
      ├─ Visual threat level indicator
      └─ One-click actions


═══════════════════════════════════════════════════════════════════════════
                      DEPLOYMENT SCRIPTS
═══════════════════════════════════════════════════════════════════════════

scripts/dev-local.ps1
  ├─ Install PM2 globally
  ├─ Stop existing processes
  ├─ Install backend dependencies
  ├─ Start backend (pm2 start npm -- run dev)
  ├─ Install frontend dependencies
  ├─ Set NEXT_PUBLIC_API_URL=http://localhost:4000
  ├─ Start frontend (pm2 start npm -- run dev)
  ├─ Wait for services (5 seconds)
  ├─ Show PM2 status
  └─ Follow logs

scripts/deploy-production.ps1
  ├─ Pre-flight checks (git, node, npm)
  ├─ Validate environment variables
  ├─ Run database migrations
  │   ├─ Guardian AI tables
  │   └─ Anti-Detect tables
  ├─ Generate Prisma Client
  ├─ Build backend (npm run build)
  ├─ Deploy backend to Render
  ├─ Build frontend (npm run build)
  ├─ Deploy frontend to Vercel
  ├─ Post-deployment verification
  │   ├─ Backend health check
  │   └─ Frontend accessibility check
  └─ Display summary with URLs


═══════════════════════════════════════════════════════════════════════════
```

## Key Features

### Self-Protecting

- ✅ Guardian AI monitors system health 24/7
- ✅ Anti-Detect blocks threats in real-time
- ✅ Auto-blocks malicious IPs for 24 hours
- ✅ Protect mode lockdown on critical threats
- ✅ Rate limiting prevents abuse

### Self-Correcting

- ✅ Auto-restart on memory leaks
- ✅ Auto-reconnect to database
- ✅ Auto-scale on Render (2-10 instances)
- ✅ Error recovery with retry logic
- ✅ Health checks every 1 minute

### Anti-Intrusion

- ✅ 6-layer AI protection (Anti-Suggest, Anti-Plan, Anti-Approve, Anti-Secure, Anti-Organize, Anti-Exploit)
- ✅ Detects 7 injection patterns (SQL, XSS, path traversal, template, code execution, etc.)
- ✅ Honeypot traps auto-ban attackers
- ✅ Bot detection and blocking
- ✅ Complete forensic audit trail

### Human-in-Loop

- ✅ Zero auto-execution for sensitive operations
- ✅ Approval queue with 1-hour timeout
- ✅ Email + Slack notifications for approvals
- ✅ One-click approve/reject in dashboard
- ✅ 2FA support for high-risk approvals
- ✅ Complete audit trail of all decisions

### Production-Ready

- ✅ Render backend deployment (auto-scaling)
- ✅ Vercel frontend deployment (edge CDN)
- ✅ PostgreSQL 15 database with 11 security tables
- ✅ SSL certificates auto-configured
- ✅ Health checks and monitoring
- ✅ Environment variable management
- ✅ Git-based deployment workflow

---

**🚀 Launch Commands:**

```powershell
# Local development
.\scripts\dev-local.ps1

# Production deployment
.\scripts\deploy-production.ps1
```

**🎯 Ready to launch immediately!**

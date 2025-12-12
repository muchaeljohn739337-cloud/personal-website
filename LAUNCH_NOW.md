# 🚀 Advancia SaaS Platform - Launch Instructions

## Overview

You now have a **complete, production-ready SaaS AI system** with:

- ✅ **Guardian AI** - Self-monitoring and auto-correction
- ✅ **Anti-Detect Layer** - 6-layer AI protection system
- ✅ **Admin Dashboard** - Real-time security control center
- ✅ **Full Connectors** - Stripe, Crypto, Email, Social
- ✅ **Deployment Scripts** - Render + Vercel + Cloudflare

---

## 🎯 Launch in 3 Commands

### 1. Local Development (One Command)

```powershell
.\scripts\dev-local.ps1
```

**What this does:**

- ✅ Installs all dependencies (backend + frontend)
- ✅ Starts backend on port 4000
- ✅ Starts frontend on port 3000
- ✅ Initializes Guardian AI monitoring
- ✅ Activates Anti-Detect protection
- ✅ Opens PM2 monitoring dashboard

**Access:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Admin Dashboard: http://localhost:3000/admin
- Security Center: http://localhost:3000/admin/security

### 2. Production Deployment (One Command)

```powershell
.\scripts\deploy-production.ps1
```

**What this does:**

- ✅ Validates environment variables
- ✅ Runs database migrations (Guardian + Anti-Detect)
- ✅ Builds backend with TypeScript
- ✅ Deploys backend to Render
- ✅ Builds frontend with Next.js
- ✅ Deploys frontend to Vercel
- ✅ Runs health checks on both services

**Production URLs:**

- Frontend: https://advanciapayledger.com
- Backend API: https://api.advanciapayledger.com
- Admin: https://advanciapayledger.com/admin
- Security: https://advanciapayledger.com/admin/security

### 3. Monitor & Manage

```powershell
# Local monitoring
pm2 monit

# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all
```

---

## 📋 Pre-Launch Checklist

### Step 1: Configure Environment Variables

**Backend `.env` file:**

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/advancia

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Security & Monitoring
ADMIN_EMAIL=your-email@domain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email Alerts (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# IP Protection
WHITELIST_IPS=127.0.0.1,::1
STRICT_IP_MODE=false

# Thresholds
MEMORY_THRESHOLD_MB=800
CPU_THRESHOLD_PERCENT=90
API_RATE_LIMIT=100

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Crypto (Optional)
COINBASE_API_KEY=...
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/...
```

**Frontend `.env.local` file:**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
# For production: https://api.advanciapayledger.com

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Step 2: Run Database Migrations

```powershell
cd backend

# Guardian AI tables
npx prisma db execute --file prisma/migrations/add_guardian_tables.sql --schema prisma/schema.prisma

# Anti-Detect tables
npx prisma db execute --file prisma/migrations/add_anti_detect_tables.sql --schema prisma/schema.prisma

# Generate Prisma Client
npx prisma generate
```

**Expected output:**

```
✅ 6 Guardian AI tables created
✅ 5 Anti-Detect tables created
✅ 10 security rules inserted
✅ Prisma Client generated
```

### Step 3: Create Admin User

```powershell
cd backend
npm run seed:admin
```

Follow prompts to create your first admin user.

### Step 4: Test Security Integration

```powershell
# Start backend in dev mode
cd backend
npm run dev

# In another terminal, test endpoints
curl http://localhost:4000/api/health
curl http://localhost:4000/api/admin/security/status
```

**Expected response from `/api/admin/security/status`:**

```json
{
  "guardian_active": true,
  "anti_detect_active": true,
  "protect_mode": false,
  "threat_level": "LOW",
  "active_threats": 0,
  "pending_approvals": 0,
  "threat_intelligence": {
    "blocked_ips": 0,
    "attack_patterns": 0,
    "forensic_entries": 0
  }
}
```

---

## 🔧 Backend Integration (Already Done!)

The backend integration is **already complete** in this repo. Here's what was added:

### 1. Main Entry Point: `backend/src/ai/index.js`

```javascript
const { initializeSecurity, getSecurityMiddleware } = require("./ai");

// Initialize security BEFORE starting Express
const security = await initializeSecurity();

// Apply security middleware FIRST
app.use(getSecurityMiddleware());
```

### 2. Security Routes: `backend/src/routes/security.ts`

All admin security endpoints are ready:

- `GET /api/admin/security/status` - System status
- `GET /api/admin/security/forensic-report` - Forensic data
- `GET /api/admin/security/approvals` - Pending approvals
- `POST /api/admin/security/approvals/:id` - Approve/reject
- `GET /api/admin/security/events` - Security events
- `GET /api/admin/security/blocked-ips` - Blocked IPs
- `POST /api/admin/security/unblock-ip/:ip` - Unblock IP
- `POST /api/admin/security/disable-protect-mode` - Emergency override
- And 5 more endpoints for rules, audit trail, honeypots

### 3. Frontend Dashboard: `frontend/src/app/admin/security/page.tsx`

Complete React dashboard with:

- Real-time status monitoring (10-second auto-refresh)
- Threat level indicator (color-coded)
- Pending approvals queue (one-click approve/reject)
- Security events log (severity-filtered)
- Blocked IPs table (with unblock button)
- Protect mode controls (emergency lockdown)

---

## 🛡️ Security Features

### Guardian AI (Self-Monitoring)

**What it does:**

- ✅ Monitors memory usage every 1 minute
- ✅ Tracks CPU usage continuously
- ✅ Scans for security vulnerabilities every 1 hour
- ✅ Monitors API usage every 30 seconds
- ✅ Auto-restarts on memory leaks
- ✅ Auto-reconnects to database
- ✅ Sends email/Slack alerts on issues

### Anti-Detect Layer (AI Protection)

**6 Protection Layers:**

1. **Anti-Suggest** - Blocks 12 dangerous keywords, 7 actions, 5 paths
2. **Anti-Plan** - Requires approval for infrastructure changes
3. **Anti-Approve** - Zero auto-execution for sensitive operations
4. **Anti-Secure** - Rate limiting, IP blocking, honeypot traps
5. **Anti-Organize** - Prevents destructive structure changes
6. **Anti-Exploit** - Detects 7 injection patterns (SQL, XSS, etc.)

### Human-in-Loop Approval

**Operations requiring approval:**

- ❌ Payment processing (>$100)
- ❌ Crypto transfers
- ❌ API key rotation
- ❌ User data export
- ❌ Database backup/restore
- ❌ Infrastructure deployment
- ❌ Security rule changes

**Approval workflow:**

1. AI/user attempts sensitive operation
2. Operation blocked, approval request created
3. Admin receives email + Slack notification
4. Admin reviews in dashboard
5. Admin approves/rejects with reason
6. Operation proceeds only if approved
7. Full audit trail logged

---

## 📊 Monitoring & Alerts

### Email Alerts

Configured via `ADMIN_EMAIL` + SMTP settings in `.env`:

**Alert types:**

- 🚨 **CRITICAL** - Protect mode activated, exploit detected, database down
- ⚠️ **WARNING** - Approval required, high threat activity, memory threshold exceeded
- ℹ️ **INFO** - Approval processed, system restarted, routine maintenance

### Slack Integration (Optional)

Set `SLACK_WEBHOOK_URL` in `.env` for real-time Slack notifications.

### Dashboard Monitoring

Visit `/admin/security` for:

- Real-time threat level (LOW/MEDIUM/HIGH/CRITICAL)
- Guardian AI status (Active/Inactive)
- Anti-Detect status (Active/Inactive)
- Active threats count
- Pending approvals count
- Blocked IPs count
- Attack patterns detected
- Forensic entries timeline

---

## 🚨 Emergency Procedures

### Protect Mode Activated

**What it means:**
Critical threat detected, system locked down.

**What to do:**

1. Login to admin dashboard: `/admin/security`
2. Review security events and forensic report
3. Identify and resolve threat
4. Click "Disable Protect Mode" button
5. System returns to normal operation

### IP Blocked by Mistake

**What to do:**

1. Login to admin dashboard: `/admin/security`
2. Click "Blocked IPs" tab
3. Find the IP address
4. Click "Unblock" button
5. IP immediately unblocked

### Approval Queue Backed Up

**What to do:**

1. Login to admin dashboard: `/admin/security`
2. Review each approval request
3. Approve or reject with reason
4. System automatically processes next in queue

---

## 🎯 Production Deployment

### Render (Backend)

**Auto-detected configuration:**

- Node.js 18+
- PostgreSQL database
- Environment variables synced from `.env`
- Health check endpoint: `/api/health`
- Auto-restart on crash

**Manual setup:**

1. Login to https://dashboard.render.com
2. Create new Web Service
3. Connect your Git repository
4. Set build command: `cd backend && npm install && npm run build`
5. Set start command: `cd backend && npm start`
6. Add environment variables from `.env`
7. Deploy

### Vercel (Frontend)

**Auto-detected configuration:**

- Next.js 14 App Router
- Static site generation
- API routes supported
- Edge network CDN

**Manual setup:**

1. Login to https://vercel.com/dashboard
2. Import Git repository
3. Vercel auto-detects Next.js
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com`
5. Deploy

### Cloudflare (Alternative)

**Already configured:**

- `wrangler.toml` in frontend/
- Cloudflare Pages deployment ready
- KV Storage bindings configured

```powershell
cd frontend
npx wrangler pages deploy . --project-name advancia-platform
```

---

## ✅ Post-Deployment Checklist

### Backend

- [ ] Health endpoint responds: `https://api.advanciapayledger.com/api/health`
- [ ] Security status endpoint responds: `https://api.advanciapayledger.com/api/admin/security/status`
- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] Email alerts working (send test)
- [ ] Slack webhooks configured (optional)

### Frontend

- [ ] Homepage loads: `https://advanciapayledger.com`
- [ ] Admin dashboard accessible: `/admin`
- [ ] Security dashboard loads: `/admin/security`
- [ ] Can approve/reject test approval
- [ ] Real-time updates working (10s refresh)

### Security

- [ ] Guardian AI active (check status endpoint)
- [ ] Anti-Detect active (check status endpoint)
- [ ] Test SQL injection blocked (see below)
- [ ] Test approval workflow (see below)
- [ ] Verify forensic logging (check audit trail)

---

## 🧪 Testing

### Test 1: SQL Injection Blocked

```bash
curl -X POST https://api.advanciapayledger.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com OR 1=1--","password":"test"}'
```

**Expected:**

```json
{
  "error": "Request contains suspicious content",
  "details": "Possible exploit attempt detected",
  "layer": "ANTI_EXPLOIT"
}
```

**What happens:**

- IP auto-blocked for 24 hours
- Admin receives email alert
- Event logged in Security Events
- Forensic snapshot created

### Test 2: Approval Workflow

```bash
# Trigger payment (requires approval)
curl -X POST https://api.advanciapayledger.com/api/payments/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"currency":"USD"}'
```

**Expected:**

```json
{
  "auto_approved": false,
  "approval_id": "approval-abc-123",
  "status": "PENDING",
  "message": "Operation requires admin approval"
}
```

**What happens:**

1. Payment blocked
2. Approval queue entry created
3. Admin receives email + Slack notification
4. Admin reviews in dashboard
5. Admin clicks "Approve" or "Reject"
6. Payment proceeds if approved

### Test 3: Protect Mode

```bash
# Trigger multiple SQL injections rapidly
for i in {1..10}; do
  curl -X POST https://api.advanciapayledger.com/api/users/search \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"admin OR 1=1--$i\"}"
done
```

**Expected:**

```json
{
  "error": "System in protect mode",
  "message": "Critical threat detected. System locked down."
}
```

**What happens:**

1. Multiple exploit attempts detected
2. Protect mode activated automatically
3. All non-admin requests blocked
4. Admin receives critical alert
5. Admin must manually disable protect mode

---

## 📚 Documentation

**Main Guides:**

- [READY_TO_LAUNCH.md](./READY_TO_LAUNCH.md) - This guide
- [ANTI_DETECT_SETUP.md](./ANTI_DETECT_SETUP.md) - Anti-Detect details
- [INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md) - Integration steps
- [GUARDIAN_AI_SETUP.md](./GUARDIAN_AI_SETUP.md) - Guardian AI details

**User Guides:**

- [LAUNCH_GUIDE_FOR_USERS.md](./LAUNCH_GUIDE_FOR_USERS.md) - End-user guide
- [AUTOMATION_STACK.md](./AUTOMATION_STACK.md) - Payment automation

**API Documentation:**

- Backend API: https://api.advanciapayledger.com/api-docs
- Security endpoints: See `backend/src/routes/security.ts`

---

## 🆘 Troubleshooting

### "Database connection failed"

```powershell
# Check DATABASE_URL in .env
cd backend
npx prisma db pull

# If fails, verify PostgreSQL is running
docker ps | grep postgres
```

### "Security not initialized"

```powershell
# Check if migrations ran
cd backend
npx prisma migrate status

# Re-run migrations
npx prisma db execute --file prisma/migrations/add_guardian_tables.sql
npx prisma db execute --file prisma/migrations/add_anti_detect_tables.sql
```

### "Frontend can't reach backend"

```powershell
# Check NEXT_PUBLIC_API_URL in frontend/.env.local
echo $env:NEXT_PUBLIC_API_URL

# Should be http://localhost:4000 (local) or https://api.advanciapayledger.com (prod)

# Check CORS origins in backend/src/config/index.ts
# Should include your frontend URL
```

### "Email alerts not working"

```powershell
# Test SMTP credentials
cd backend
node scripts/test-smtp.js

# Check .env file has:
# SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL
```

### "PM2 not found"

```powershell
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

---

## 🎉 You're Ready to Launch!

**Quick Start Commands:**

```powershell
# Local development
.\scripts\dev-local.ps1

# Production deployment
.\scripts\deploy-production.ps1

# Monitor
pm2 monit
```

**Access Points:**

- Frontend: http://localhost:3000 (local) or https://advanciapayledger.com (prod)
- Admin: /admin
- Security Center: /admin/security

**Support:**

- Email: support@advanciapayledger.com
- Documentation: See links above
- GitHub Issues: Open an issue on the repository

---

**🚀 Your self-protecting, self-correcting, anti-intrusion SaaS AI system is ready to launch!**

**Zero auto-execution. Full human control. Complete audit trail. Production-ready.**

# 🛡️ ANTI-DETECT LAYER - Complete Setup Guide

**6-Layer AI Security System with Guardian AI Integration**

---

## 🎯 What You Get

A **self-protecting, self-correcting, anti-intrusion** SaaS AI system with:

✅ **Guardian AI** - Health monitoring, auto-correction, alerts  
✅ **Anti-Detect Layer** - 6 layers of AI protection  
✅ **Human-in-Loop Approval** - No auto-execution of sensitive operations  
✅ **Full Audit Trail** - Forensic review of all security events  
✅ **Intrusion Detection** - Auto-block attacks, exploits, and threats

---

## 📋 6 Anti-Detect Layers

| Layer                | Purpose                                   | Protection                                                         |
| -------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| **1. Anti-Suggest**  | Block unsafe AI suggestions               | ❌ "delete environment", "bypass approval", "disable security"     |
| **2. Anti-Plan**     | Prevent dangerous action plans            | ⚠️ Infrastructure changes require approval                         |
| **3. Anti-Approve**  | No auto-approval for sensitive ops        | 🔐 Payments, key rotation, data export frozen until admin confirms |
| **4. Anti-Secure**   | Stop brute force, token leaks, API misuse | 🚨 Auto-block IPs, lock accounts, rotate secrets                   |
| **5. Anti-Organize** | Prevent destructive changes               | 🔒 No DB reorganization, file movement, or route changes           |
| **6. Anti-Exploit**  | Block injection, spoofing, flooding       | 🛡️ SQL injection, XSS, command injection detection                 |

---

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
cd backend
npm install nodemailer axios
```

### 2. Run Database Migrations

```bash
# Guardian AI tables
psql -U postgres -d advancia -f backend/prisma/migrations/add_guardian_tables.sql

# Anti-Detect tables
psql -U postgres -d advancia -f backend/prisma/migrations/add_anti_detect_tables.sql
```

Or if `psql` not in PATH:

```powershell
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d advancia -f backend\prisma\migrations\add_guardian_tables.sql

& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d advancia -f backend\prisma\migrations\add_anti_detect_tables.sql
```

### 3. Configure Environment Variables

Add to `backend/.env`:

```env
# Guardian AI + Anti-Detect Configuration
ADMIN_EMAIL=your-email@domain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security Settings
WHITELIST_IPS=127.0.0.1,::1,your-ip-address
STRICT_IP_MODE=false

# Alert Thresholds
MEMORY_THRESHOLD_MB=800
CPU_THRESHOLD_PERCENT=90
API_RATE_LIMIT=100
```

### 4. Integrate into Backend

**Option A: Simple Integration (Recommended)**

Modify `backend/src/index.ts`:

```typescript
import { UnifiedSecurityOrchestrator } from "./ai/unified_security.js";

const app = express();

// Initialize Unified Security
const security = new UnifiedSecurityOrchestrator();
await security.initialize();

// Apply middleware BEFORE other middleware
app.use(security.unifiedSecurityMiddleware());

// Your existing middleware
app.use(express.json());
app.use(cors());
// ... rest of your app
```

**Option B: Separate Guardian + Anti-Detect**

```typescript
import { GuardianAI } from "./ai/ai_orchestrator.js";
import { AntiDetectLayer } from "./ai/anti_detect.js";

const guardian = new GuardianAI();
await guardian.initialize();

const antiDetect = new AntiDetectLayer();
await antiDetect.init();

app.use(guardian.guardianMiddleware());
app.use(antiDetect.antiDetectMiddleware());
```

### 5. Start the System

```bash
npm run launch
```

---

## 🔐 Human-in-Loop Approval System

### How It Works

1. **AI/System requests sensitive operation** (payment, key rotation, etc.)
2. **Anti-Approve Layer intercepts** and creates approval request
3. **Admin receives alert** (email + Slack)
4. **Admin reviews and approves/rejects** via dashboard
5. **Operation proceeds only if approved**

### Operations Requiring Approval

- ❌ Payment processing
- ❌ Crypto transfers
- ❌ API key rotation
- ❌ User data export
- ❌ Infrastructure deployment
- ❌ Security rule changes
- ❌ Database migrations

### Admin Approval API

**Create Approval Request:**

```javascript
const approval = await security.requestHumanApproval({
  type: "PAYMENT_PROCESSING",
  description: "Process $1000 payment for user@example.com",
  user: { id: "user_123", email: "user@example.com" },
  data: { amount: 1000, currency: "USD" },
});

// Returns: { approval_id, status: 'PENDING', message }
```

**Process Approval (Admin):**

```javascript
const result = await security.processAdminApproval(
  "approval-id-123",
  adminUser,
  { approved: true, reason: "Verified payment details" }
);
```

**Check Approval Status:**

```javascript
GET /api/admin/approvals/:approvalId
```

---

## 📊 Admin Dashboard Integration

### React Component Example

```typescript
// frontend/src/app/admin/security/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function SecurityDashboard() {
  const [status, setStatus] = useState(null);
  const [approvals, setApprovals] = useState([]);

  useEffect(() => {
    // Fetch unified security status
    fetch("/api/admin/security/status")
      .then((r) => r.json())
      .then(setStatus);

    // Fetch pending approvals
    fetch("/api/admin/approvals?status=PENDING")
      .then((r) => r.json())
      .then(setApprovals);

    // Poll every 10 seconds
    const interval = setInterval(() => {
      fetch("/api/admin/security/status")
        .then((r) => r.json())
        .then(setStatus);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!status) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Threat Level */}
      <div
        className={`p-4 rounded ${
          status.threat_level === "CRITICAL"
            ? "bg-red-100"
            : status.threat_level === "HIGH"
            ? "bg-orange-100"
            : status.threat_level === "MEDIUM"
            ? "bg-yellow-100"
            : "bg-green-100"
        }`}
      >
        <h2 className="text-xl font-bold">
          Threat Level: {status.threat_level}
        </h2>
        {status.protect_mode && (
          <p className="text-red-600">🚨 PROTECT MODE ACTIVE</p>
        )}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border p-4 rounded">
          <h3 className="font-semibold">Guardian AI</h3>
          <p
            className={
              status.guardian_active ? "text-green-600" : "text-red-600"
            }
          >
            {status.guardian_active ? "✅ Active" : "❌ Inactive"}
          </p>
        </div>
        <div className="border p-4 rounded">
          <h3 className="font-semibold">Anti-Detect</h3>
          <p
            className={
              status.anti_detect_active ? "text-green-600" : "text-red-600"
            }
          >
            {status.anti_detect_active ? "✅ Active" : "❌ Inactive"}
          </p>
        </div>
        <div className="border p-4 rounded">
          <h3 className="font-semibold">Active Threats</h3>
          <p className="text-2xl font-bold">{status.active_threats}</p>
        </div>
      </div>

      {/* Pending Approvals */}
      <div>
        <h3 className="text-lg font-bold mb-4">
          Pending Approvals ({approvals.length})
        </h3>
        {approvals.map((approval) => (
          <div key={approval.id} className="border p-4 mb-2 rounded">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{approval.operation_type}</h4>
                <p className="text-sm text-gray-600">{approval.description}</p>
                <p className="text-xs text-gray-400">
                  Requested: {new Date(approval.created_at).toLocaleString()}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleApproval(approval.id, true)}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleApproval(approval.id, false)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Blocked IPs */}
      <div>
        <h3 className="text-lg font-bold">Blocked IPs</h3>
        <p className="text-sm text-gray-600">
          {status.threat_intelligence?.blocked_ips} IPs currently blocked
        </p>
      </div>
    </div>
  );
}

async function handleApproval(approvalId: string, approved: boolean) {
  const reason = approved
    ? prompt("Approval reason (optional):") || "Approved by admin"
    : prompt("Rejection reason:");

  if (!approved && !reason) return;

  await fetch(`/api/admin/approvals/${approvalId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved, reason }),
  });

  window.location.reload();
}
```

### Backend API Routes

```typescript
// backend/src/routes/security.ts
import { Router } from "express";
import { UnifiedSecurityOrchestrator } from "../ai/unified_security";

const router = Router();
const security = new UnifiedSecurityOrchestrator();

// Get unified security status
router.get("/status", async (req, res) => {
  const status = security.getUnifiedStatus();
  res.json(status);
});

// Get forensic report
router.get("/forensic-report", async (req, res) => {
  const timeframe = parseInt(req.query.timeframe as string) || 3600000;
  const report = await security.getForensicReport(timeframe);
  res.json(report);
});

// Get pending approvals
router.get("/approvals", async (req, res) => {
  const approvals = await prisma.approvalQueue.findMany({
    where: { status: req.query.status || "PENDING" },
    orderBy: { created_at: "desc" },
  });
  res.json(approvals);
});

// Process approval
router.post("/approvals/:id", async (req, res) => {
  const { id } = req.params;
  const { approved, reason } = req.body;

  const result = await security.processAdminApproval(
    id,
    req.user, // Authenticated admin user
    { approved, reason }
  );

  res.json(result);
});

export default router;
```

---

## 🔍 Detection Examples

### Example 1: SQL Injection Blocked

**Input:**

```
POST /api/users/search
{ "query": "admin' OR '1'='1" }
```

**Anti-Exploit Response:**

```json
{
  "error": "Request contains suspicious content",
  "details": "Possible exploit attempt detected",
  "layer": "ANTI_EXPLOIT",
  "action": "BLOCKED_AND_LOGGED"
}
```

### Example 2: Dangerous Suggestion Blocked

**AI Suggestion:**

```
"Let's delete the production environment to free up resources"
```

**Anti-Suggest Response:**

```json
{
  "allowed": false,
  "reason": "Suggestion contains blocked content",
  "threats": [
    {
      "layer": "ANTI_SUGGEST",
      "type": "BLOCKED_KEYWORD",
      "keyword": "delete environment",
      "severity": "HIGH"
    }
  ]
}
```

### Example 3: Payment Requires Approval

**Request:**

```javascript
await processPayment({ amount: 5000, user: "user_123" });
```

**Anti-Approve Response:**

```json
{
  "auto_approved": false,
  "approval_id": "approval-abc-123",
  "status": "PENDING",
  "message": "Operation requires admin approval"
}
```

**Admin receives email:**

```
Subject: ⚠️ APPROVAL REQUIRED

Operation requires admin approval:
Process payment of $5000 for user_123

Approval ID: approval-abc-123

Click here to review: http://localhost:3000/admin/approvals/approval-abc-123
```

---

## 🚨 Protect Mode

When critical threats are detected, the system automatically enters **Protect Mode**:

### What Happens

1. ✅ **System locks down** - Non-admin requests blocked
2. ✅ **IP auto-blocked** - Threat source immediately banned
3. ✅ **Admins alerted** - Email + Slack + SMS (if configured)
4. ✅ **Forensic snapshot created** - Full system state captured
5. ✅ **Monitoring increased** - Real-time threat detection
6. ✅ **Endpoints frozen** - Affected routes disabled

### How to Exit Protect Mode

Admin can manually exit via:

```bash
curl -X POST http://localhost:4000/api/admin/security/disable-protect-mode \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

Or it auto-exits when threat count drops to 0.

---

## 📈 Monitoring Commands

### Check System Status

```bash
curl http://localhost:4000/api/admin/security/status
```

### Get Forensic Report (Last Hour)

```bash
curl http://localhost:4000/api/admin/security/forensic-report?timeframe=3600000
```

### View Blocked IPs

```bash
psql -U postgres -d advancia -c "SELECT ip_address, reason, blocked_at FROM \"BlockedIP\" ORDER BY blocked_at DESC LIMIT 10;"
```

### View Recent Security Events

```bash
psql -U postgres -d advancia -c "SELECT event_type, severity, created_at FROM \"SecurityEvent\" ORDER BY created_at DESC LIMIT 20;"
```

### View Pending Approvals

```bash
curl http://localhost:4000/api/admin/approvals?status=PENDING
```

---

## 🛠️ Configuration Options

### Adjust Security Rules

Edit `backend/src/ai/anti_detect.js`:

```javascript
this.rules = {
  antiSuggest: {
    blocked_keywords: [
      "your-custom-keyword",
      // Add more
    ],
  },
  antiSecure: {
    rate_limits: {
      api_calls: { max: 200, window: 60000 }, // Increase limit
    },
  },
};
```

### Add Custom Honeypot Endpoints

```javascript
honeypot_endpoints: [
  "/admin/backdoor",
  "/api/internal/secrets",
  "/your-custom-trap",
];
```

### Whitelist Trusted IPs

```env
WHITELIST_IPS=127.0.0.1,::1,203.0.113.0,198.51.100.0
STRICT_IP_MODE=true
```

---

## 🧪 Testing

### Test Anti-Suggest

```javascript
const result = await security.validateAISuggestion({
  text: "delete environment",
  action: "DELETE_ENV",
  user: testUser,
});

console.log(result.allowed); // false
console.log(result.threats); // [{ type: 'BLOCKED_KEYWORD', ... }]
```

### Test Anti-Exploit

```javascript
const result = await security.antiDetect.detectExploitAttempts({
  type: "REQUEST_BODY",
  value: "'; DROP TABLE users;--",
  ip: "192.168.1.100",
});

console.log(result.safe); // false
console.log(result.exploits); // [{ type: 'INJECTION_ATTEMPT', ... }]
```

### Trigger Protect Mode (Testing Only)

```javascript
security.antiDetect.emit("critical_threat", {
  threats: [{ severity: "CRITICAL", type: "TEST_THREAT" }],
});

// Check status
console.log(security.systemStatus.protect_mode); // true
```

---

## 🆘 Troubleshooting

### Issue: "Unified Security not initialized"

**Solution:**

```typescript
await security.initialize(); // Call before using
```

### Issue: All requests blocked

**Cause:** System in Protect Mode

**Solution:**

```bash
# Check status
curl http://localhost:4000/api/admin/security/status

# If protect_mode: true, disable it
curl -X POST http://localhost:4000/api/admin/security/disable-protect-mode \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Issue: No email alerts received

**Solution:**
Check SMTP configuration in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password, not regular password
```

Test with:

```bash
cd backend && node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'your-email@gmail.com', pass: 'your-app-password' }
});
transport.sendMail({
  from: 'your-email@gmail.com',
  to: 'your-email@gmail.com',
  subject: 'Test',
  text: 'Working!'
}).then(console.log).catch(console.error);
"
```

---

## 🎯 Next Steps

1. ✅ **Deploy to production**
2. ✅ **Configure Slack webhooks** for team alerts
3. ✅ **Review and customize security rules**
4. ✅ **Train admins** on approval workflow
5. ✅ **Monitor forensic reports** weekly
6. ✅ **Test incident response** with drills

---

## 📚 Related Documentation

- [GUARDIAN_AI_SETUP.md](./GUARDIAN_AI_SETUP.md) - Guardian AI details
- [LAUNCH_GUIDE_FOR_USERS.md](./LAUNCH_GUIDE_FOR_USERS.md) - Platform launch guide
- [AUTOMATION_STACK.md](./AUTOMATION_STACK.md) - Full automation workflows

---

**🛡️ Your SaaS is now self-protecting, self-correcting, and intrusion-proof!**

**Zero auto-execution. Full human control. Complete audit trail.**

# Admin Ledger & Audit System - Complete Guide

## 🎯 Overview

Complete admin financial management system with ledger tracking, audit logging, AI fraud detection, and account management capabilities.

## 📋 Features

### Core Operations

- **Deductions** - Remove funds from user accounts (with approval workflow)
- **Credits** - Add funds to user accounts (auto-approved)
- **Adjustments** - Manual balance corrections (requires supervisor approval)
- **Account Freeze/Unfreeze** - Suspend user accounts

### Security & Compliance

- ✅ Admin-only routes (IP-whitelisted)
- ✅ Full audit trail for every operation
- ✅ AI fraud detection via Mom AI Core
- ✅ Duplicate deduction prevention
- ✅ Balance validation before deductions
- ✅ User suspension status checks
- ✅ Real-time Socket.IO notifications

## 🗄️ Database Schema

### financial_ledger

```prisma
model financial_ledger {
  id        String   @id
  userId    String
  type      String   // 'DEDUCTION' | 'CREDIT' | 'ADJUSTMENT'
  amount    Decimal  @db.Decimal(18, 8)
  currency  String
  actorId   String   // Admin who performed action
  reason    String   @db.Text
  status    String   // 'PENDING' | 'APPROVED' | 'REJECTED'
  txHash    String?  // Optional blockchain tx hash
  createdAt DateTime
  updatedAt DateTime
}
```

### user_wallets

```prisma
model user_wallets {
  id        String   @id
  userId    String
  currency  String   // 'USD', 'BTC', 'ETH', 'USDT', 'USDC', 'DAI'
  balance   Decimal  @db.Decimal(18, 8)
  createdAt DateTime
  updatedAt DateTime

  @@unique([userId, currency])
}
```

### audit_logs (enhanced)

```prisma
model audit_logs {
  id        String   @id
  action    String   // e.g., "deduction", "credit", "account_freeze"
  userId    String?
  adminId   String?  // Admin who performed action
  details   Json?    // Operation details
  timestamp DateTime
}
```

### users (enhanced)

```prisma
model users {
  // ... existing fields ...
  suspended Boolean @default(false)  // Account freeze flag
}
```

## 🚀 API Endpoints

### Base URL

```
/api/admin/ledger
```

All endpoints require:

- JWT authentication (`Authorization: Bearer TOKEN`)
- Admin role
- IP whitelist (configured in backend/src/config/index.ts)

---

### 1️⃣ POST /deduction

**Admin-only: Deduct funds from user account**

**Request Body:**

```json
{
  "userId": "user-123",
  "amount": "100.50",
  "currency": "USD",
  "reason": "Refund reversal due to chargeback",
  "requiresApproval": true // Optional, defaults to true
}
```

**Response (Pending Approval):**

```json
{
  "success": true,
  "message": "⏳ Deduction created and pending approval",
  "ledgerEntry": {
    "id": "ledger-1733481234567-abc123",
    "userId": "user-123",
    "type": "DEDUCTION",
    "amount": "100.50",
    "currency": "USD",
    "actorId": "admin-789",
    "reason": "Refund reversal due to chargeback",
    "status": "PENDING",
    "createdAt": "2025-12-06T10:30:00Z"
  },
  "requiresApproval": true,
  "aiAnalysis": {
    "riskLevel": "MEDIUM",
    "decision": "REVIEW_REQUIRED"
  }
}
```

**Response (Auto-Approved):**

```json
{
  "success": true,
  "message": "✅ Deduction processed successfully",
  "ledgerEntry": {
    /* ... */
  },
  "requiresApproval": false,
  "aiAnalysis": {
    /* ... */
  }
}
```

**Validations:**

- ❌ Amount must be > 0
- ❌ Reason must be ≥ 10 characters
- ❌ User account must not be suspended
- ❌ User must have sufficient balance
- ❌ No duplicate deduction within 1 minute

**AI Fraud Detection:**

- Amounts > $1000: HIGH severity, requires approval
- Amounts ≤ $1000: MEDIUM severity, may auto-approve
- Creates Mom AI incident for analysis

---

### 2️⃣ POST /credit

**Admin-only: Add funds to user account**

**Request Body:**

```json
{
  "userId": "user-123",
  "amount": "50.00",
  "currency": "USD",
  "reason": "Compensation for service downtime",
  "txHash": "0x123abc..." // Optional blockchain tx hash
}
```

**Response:**

```json
{
  "success": true,
  "message": "✅ Credit processed successfully",
  "ledgerEntry": {
    "id": "ledger-1733481234567-def456",
    "userId": "user-123",
    "type": "CREDIT",
    "amount": "50.00",
    "currency": "USD",
    "status": "APPROVED",
    "txHash": "0x123abc..."
  },
  "newBalance": "1050.00"
}
```

**Features:**

- ✅ Auto-approved (no waiting)
- ✅ Creates/updates user wallet automatically
- ✅ Immediate balance update
- ✅ Notifies user via Socket.IO

---

### 3️⃣ POST /adjustment

**Admin-only: Manual balance adjustment (correction)**

**Request Body:**

```json
{
  "userId": "user-123",
  "amount": "-25.50", // Can be positive or negative
  "currency": "USD",
  "reason": "Manual correction for database sync error on 2025-12-05"
}
```

**Response:**

```json
{
  "success": true,
  "message": "⏳ Adjustment created and pending supervisor approval",
  "ledgerEntry": {
    "id": "ledger-1733481234567-ghi789",
    "type": "ADJUSTMENT",
    "status": "PENDING",
    "amount": "-25.50"
  },
  "requiresApproval": true,
  "aiAnalysis": {
    "riskLevel": "HIGH",
    "decision": "SUPERVISOR_APPROVAL"
  }
}
```

**Validations:**

- ❌ Reason must be ≥ 15 characters (stricter for adjustments)
- ❌ Always requires supervisor approval (HIGH severity)

---

### 4️⃣ POST /approve/:id

**Admin-only: Approve pending ledger entry**

**URL Parameter:**

- `id` - Ledger entry ID

**Response:**

```json
{
  "success": true,
  "message": "✅ Ledger entry approved and processed",
  "ledgerEntry": {
    "id": "ledger-1733481234567-abc123",
    "status": "APPROVED",
    "updatedAt": "2025-12-06T10:35:00Z"
  }
}
```

**Actions:**

- ✅ Updates ledger status to APPROVED
- ✅ Processes financial operation (updates wallet balance)
- ✅ Creates transaction record
- ✅ Logs audit trail
- ✅ Notifies user

---

### 5️⃣ POST /reject/:id

**Admin-only: Reject pending ledger entry**

**URL Parameter:**

- `id` - Ledger entry ID

**Request Body:**

```json
{
  "reason": "Insufficient documentation provided"
}
```

**Response:**

```json
{
  "success": true,
  "message": "✅ Ledger entry rejected",
  "ledgerEntry": {
    "id": "ledger-1733481234567-abc123",
    "status": "REJECTED"
  }
}
```

**Validations:**

- ❌ Rejection reason must be ≥ 10 characters

---

### 6️⃣ POST /freeze-account

**Admin-only: Freeze user account**

**Request Body:**

```json
{
  "userId": "user-123",
  "reason": "Multiple failed login attempts detected - security investigation"
}
```

**Response:**

```json
{
  "success": true,
  "message": "🔒 User account frozen successfully",
  "userId": "user-123"
}
```

**Actions:**

- ✅ Sets `users.suspended = true`
- ✅ Sets `users.active = false`
- ✅ Creates audit log
- ✅ Notifies user: "🔒 Your account has been frozen. Please contact support."

**Validations:**

- ❌ Reason must be ≥ 15 characters

---

### 7️⃣ POST /unfreeze-account

**Admin-only: Unfreeze user account**

**Request Body:**

```json
{
  "userId": "user-123",
  "reason": "Security investigation complete - no threats found"
}
```

**Response:**

```json
{
  "success": true,
  "message": "✅ User account unfrozen successfully",
  "userId": "user-123"
}
```

**Actions:**

- ✅ Sets `users.suspended = false`
- ✅ Sets `users.active = true`
- ✅ Creates audit log
- ✅ Notifies user: "✅ Your account has been unfrozen. You can now access all features."

---

### 8️⃣ GET /history

**Admin-only: View ledger history**

**Query Parameters:**

```
?userId=user-123           // Filter by user
&type=DEDUCTION           // Filter by type (DEDUCTION | CREDIT | ADJUSTMENT)
&status=PENDING           // Filter by status (PENDING | APPROVED | REJECTED)
&page=1                   // Page number (default: 1)
&limit=50                 // Results per page (max: 100, default: 50)
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "ledger-1733481234567-abc123",
      "userId": "user-123",
      "type": "DEDUCTION",
      "amount": "100.50",
      "currency": "USD",
      "actorId": "admin-789",
      "reason": "Refund reversal",
      "status": "APPROVED",
      "createdAt": "2025-12-06T10:30:00Z",
      "user": {
        "id": "user-123",
        "email": "user@example.com",
        "username": "john_doe"
      },
      "actor": {
        "id": "admin-789",
        "email": "admin@advanciapayledger.com",
        "username": "admin_jane"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "totalPages": 3
  }
}
```

---

### 9️⃣ GET /audit-logs

**Admin-only: View audit logs**

**Query Parameters:**

```
?userId=user-123          // Filter by user
&adminId=admin-789        // Filter by admin
&action=deduction         // Filter by action type
&page=1
&limit=50
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "audit-1733481234567-xyz",
      "action": "deduction",
      "userId": "user-123",
      "adminId": "admin-789",
      "details": {
        "amount": "100.50",
        "currency": "USD",
        "reason": "Refund reversal",
        "ledgerId": "ledger-1733481234567-abc123",
        "status": "APPROVED",
        "aiRiskLevel": "MEDIUM"
      },
      "timestamp": "2025-12-06T10:30:00Z"
    }
  ],
  "pagination": {
    /* ... */
  }
}
```

---

### 🔟 GET /pending

**Admin-only: Get all pending ledger entries**

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "ledger-1733481234567-abc123",
      "type": "DEDUCTION",
      "amount": "100.50",
      "status": "PENDING",
      "user": {
        /* ... */
      },
      "actor": {
        /* ... */
      }
    }
  ],
  "count": 5
}
```

## 🤖 AI Integration

### Mom AI Core

All financial operations are analyzed by Mom AI Core:

```typescript
const aiAnalysis = await momAICore.handleIncident({
  type: "ADMIN_DEDUCTION",
  severity: amount > 1000 ? "HIGH" : "MEDIUM",
  metadata: {
    adminId,
    userId,
    amount,
    currency,
    reason,
    userBalance,
  },
});
```

**Risk Levels:**

- `LOW` - Auto-approved, minimal risk
- `MEDIUM` - Requires review, may auto-approve
- `HIGH` - Requires supervisor approval
- `CRITICAL` - Requires Dad Console approval

### Fraud Detection Checks

- ✅ Duplicate deduction detection (1-minute window)
- ✅ Suspended account prevention
- ✅ Balance validation
- ✅ Reason quality checks (minimum length)
- ✅ AI pattern analysis

## 📡 Real-Time Notifications

All operations emit Socket.IO events to affected users:

**Event: `ledger-update`**

```javascript
socket.on("ledger-update", (data) => {
  console.log(data);
  // {
  //   type: 'DEDUCTION',
  //   amount: '100.50',
  //   currency: 'USD',
  //   status: 'PENDING',
  //   message: '⏳ Admin deduction pending approval'
  // }
});
```

**Event: `account-status`**

```javascript
socket.on("account-status", (data) => {
  // {
  //   status: 'FROZEN',
  //   message: '🔒 Your account has been frozen. Please contact support.',
  //   reason: 'Security investigation'
  // }
});
```

## 🔐 Security Features

### Access Control

- ✅ IP whitelist enforcement
- ✅ Admin role requirement
- ✅ JWT authentication
- ✅ Rate limiting (300 req/min)

### Audit Trail

Every operation creates:

1. **Ledger Entry** - Financial record
2. **Audit Log** - Who did what, when
3. **Transaction Record** - Blockchain-style immutable record
4. **Socket.IO Event** - Real-time notification

### Compliance

- ✅ Minimum reason length enforcement
- ✅ Full operation history
- ✅ Admin action tracking
- ✅ Timestamp preservation
- ✅ IP address logging (future enhancement)

## 🚀 Deployment Steps

### 1. Run Prisma Migration

```bash
cd backend
npx prisma migrate dev --name add-admin-ledger-system
```

This creates:

- `financial_ledger` table
- `user_wallets` table
- Updates `audit_logs` table (adds `adminId`, `details`)
- Updates `users` table (adds `suspended`, relations)

### 2. Verify Migration

```bash
npx prisma studio
```

Check that new tables exist and have proper indexes.

### 3. Restart Backend

```bash
npm run dev
```

Routes auto-register at:

- `/api/admin/ledger/*`

### 4. Test Endpoints

**Create Test User Wallet:**

```bash
curl -X POST http://localhost:4000/api/admin/ledger/credit \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "amount": "1000",
    "currency": "USD",
    "reason": "Initial test balance"
  }'
```

**Test Deduction:**

```bash
curl -X POST http://localhost:4000/api/admin/ledger/deduction \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "amount": "50",
    "currency": "USD",
    "reason": "Test deduction for QA verification"
  }'
```

**View History:**

```bash
curl -X GET "http://localhost:4000/api/admin/ledger/history?userId=test-user-123" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## 📊 Monitoring & Analytics

### Key Metrics to Track

- Pending approvals count
- Average approval time
- Deduction vs Credit ratio
- Suspicious activity flags
- Account freeze frequency

### Recommended Dashboards

1. **Financial Operations Dashboard**
   - Daily deduction/credit volume
   - Top admins by operation count
   - Average transaction amounts

2. **Security Dashboard**
   - Frozen accounts count
   - AI risk level distribution
   - Rejected operations by reason

3. **Audit Dashboard**
   - Operation timeline
   - Admin activity heatmap
   - Compliance report generation

## 🔧 Troubleshooting

### Issue: "User wallet not found"

**Solution:** Create wallet first using `/credit` endpoint with initial balance.

### Issue: "Insufficient balance"

**Solution:** Check user wallet balance before deduction. Use `/history` to verify.

### Issue: "Duplicate deduction detected"

**Solution:** Wait 1 minute before retrying, or use different amount/reason.

### Issue: "User account is suspended"

**Solution:** Check `users.suspended` field. Use `/unfreeze-account` if needed.

### Issue: "Ledger entry already approved/rejected"

**Solution:** Cannot re-approve/reject. Check entry status with `/history`.

## 📈 Future Enhancements

- [ ] Bulk operations (multi-user deductions)
- [ ] Scheduled deductions (recurring)
- [ ] Deduction templates (common reasons)
- [ ] Advanced fraud detection ML models
- [ ] Multi-currency conversions
- [ ] Export audit logs (CSV/PDF)
- [ ] Approval delegation
- [ ] Time-based auto-approval rules
- [ ] Blockchain verification for all ops
- [ ] Integration with external accounting systems

## 📞 Support

**API Issues:** Check logs in `backend/logs/`
**Database Issues:** Run `npx prisma studio` to inspect data
**Security Concerns:** Contact security@advanciapayledger.com

---

**Created:** December 6, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready

# 🛡️ SafePrisma Usage Guide - Quick Reference

## ✅ What SafePrisma Does

**Prevents the 348-error nightmare** by:

- ✅ Auto-adds required `id` field (crypto.randomUUID())
- ✅ Auto-adds `updatedAt` timestamp
- ✅ Better error messages with full context
- ✅ Type-safe operations

---

## 📖 Basic Usage Patterns

### 1. Simple Create (Most Common)

```typescript
import { SafePrisma } from "../ai-expansion/validators/SafePrisma";

// ✅ CORRECT - SafePrisma auto-adds id + updatedAt
await SafePrisma.create("audit_logs", {
  userId: user.id,
  action: "LOGIN",
  resourceType: "user",
  resourceId: user.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

// ❌ WRONG - Don't use raw Prisma anymore!
await prisma.audit_logs.create({
  data: { userId, action }, // Missing id! Missing resourceType! ERROR!
});
```

### 2. Create Many (Batch Operations)

```typescript
// ✅ Create multiple rewards at once
await SafePrisma.createMany("rewards", [
  { userId: "user1", amount: 100, title: "Login Bonus" },
  { userId: "user2", amount: 200, title: "Referral Bonus" },
  { userId: "user3", amount: 150, title: "Achievement Bonus" },
]);
// SafePrisma auto-adds id + updatedAt to each record
```

### 3. Upsert (Create or Update)

```typescript
// ✅ Update wallet balance or create if doesn't exist
await SafePrisma.upsert(
  "token_wallets",
  { userId: user.id }, // where clause
  { userId: user.id, balance: 0 }, // create data (auto-adds id)
  { balance: { increment: 100 } } // update data (auto-adds updatedAt)
);
```

---

## 🎯 Real-World Examples from Your Agents

### Example 1: BugFixAgent (Lines 117-129)

```typescript
// After analyzing errors, log the agent activity
await SafePrisma.create("audit_logs", {
  userId: null, // No user (system agent)
  action: "BUG_FIX_ANALYSIS",
  resourceType: "agent",
  resourceId: this.config.name, // "BugFixAgent"
  ipAddress: "127.0.0.1",
  userAgent: "BugFixAgent",
  metadata: {
    agent: this.config.name,
    errorsAnalyzed: recentErrors.length,
    patternsDetected: errorPatterns.length,
    fixesCreated,
  },
});
```

### Example 2: SecurityFraudAgent (Lines 170-180)

```typescript
// Log fraud detection analysis
await SafePrisma.create("audit_logs", {
  userId: null,
  action: "FRAUD_DETECTION_SCAN",
  resourceType: "Security",
  resourceId: user.id,
  ipAddress: "127.0.0.1",
  userAgent: "SecurityFraudAgent",
  metadata: {
    agent: this.config.name,
    usersScanned: suspiciousUsers.length,
    flaggedUsers: flagCount,
    walletsBlocked: blockCount,
  },
});
```

### Example 3: TransactionAuditAgent (Lines 92-103)

```typescript
// Log transaction monitoring activity
await SafePrisma.create("audit_logs", {
  userId: null,
  action: "TRANSACTION_AUDIT",
  resourceType: "Transaction",
  resourceId: tx.id,
  ipAddress: "127.0.0.1",
  userAgent: "TransactionAuditAgent",
  metadata: {
    agent: this.config.name,
    transactionsAudited: suspicious.length,
    transactionId: tx.id,
    txHash: tx.txHash,
    blockchain: tx.blockchain,
    status: tx.status,
  },
});
```

---

## 🔧 Advanced Features

### Check if Model is Valid

```typescript
if (SafePrisma.isValidModel("audit_logs")) {
  // Model exists in Prisma schema
}
```

### Get All Valid Models

```typescript
const models = SafePrisma.getValidModels();
console.log(models);
// ['users', 'audit_logs', 'transactions', 'rewards', ...]
```

---

## 📋 Models that REQUIRE explicit id

SafePrisma auto-adds `id` for these models:

- `audit_logs`
- `rewards`
- `user_tiers`
- `support_tickets`
- `health_readings`
- `medbeds_bookings`

For all other models, Prisma's `@default(autoincrement())` or `@default(cuid())` handles it.

---

## 📋 Models WITHOUT updatedAt

SafePrisma **skips** `updatedAt` for these models:

- `token_transactions` (append-only ledger)

---

## 🚨 Error Handling

SafePrisma provides **better error messages**:

```typescript
try {
  await SafePrisma.create("audit_logs", { userId, action });
} catch (error) {
  // Error message includes:
  // - Model name
  // - Full data object
  // - Original Prisma error
  console.error(error.message);
  // "SafePrisma.create failed for audit_logs:
  //  Field 'resourceType' is required
  //  Data: { userId: '123', action: 'LOGIN', id: '...' }"
}
```

---

## 🎓 Migration Strategy

### Replace ALL raw Prisma creates

```bash
# Find all raw prisma creates
grep -r "prisma\.\w*\.create" src/

# Replace pattern:
# OLD: await prisma.MODEL.create({ data: {...} })
# NEW: await SafePrisma.create('MODEL', {...})
```

### Already Updated (6 agents)

✅ `BugFixAgent.ts` ✅ `SuggestionAgent.ts` ✅ `TransactionAuditAgent.ts` ✅ `SecurityFraudAgent.ts` ✅
`BlockchainVerificationAgent.ts` ✅ `AIDeploymentAgent.ts`

### Still Need Updating

Find remaining agents:

```bash
cd backend
grep -r "prisma\.\w*\.create" src/agents/ | grep -v SafePrisma
```

---

## 🔥 Key Rules

1. **ALWAYS import SafePrisma** for new code:

   ```typescript
   import { SafePrisma } from "../ai-expansion/validators/SafePrisma";
   ```

2. **NEVER use raw prisma.MODEL.create()** anymore

3. **Let SafePrisma handle id + updatedAt** - don't pass them manually

4. **Use descriptive resourceType and resourceId** for audit logs:
   - `resourceType`: What kind of thing? (`"agent"`, `"user"`, `"Transaction"`, `"Security"`)
   - `resourceId`: Specific ID or name (`user.id`, `this.config.name`, `tx.id`)

---

## 🎯 Next Steps

1. **Use SafePrisma in ALL new code** going forward
2. **Gradually migrate** remaining raw prisma calls
3. **Run validation** before committing:

   ```bash
   npm run ai:validate
   npx tsc --skipLibCheck --noEmit
   ```

---

## 📞 Quick Reference

| Operation   | Old Way (❌)                                     | New Way (✅)                                        |
| ----------- | ------------------------------------------------ | --------------------------------------------------- |
| Create      | `prisma.MODEL.create({ data })`                  | `SafePrisma.create('MODEL', data)`                  |
| Create Many | `prisma.MODEL.createMany({ data })`              | `SafePrisma.createMany('MODEL', data)`              |
| Upsert      | `prisma.MODEL.upsert({ where, create, update })` | `SafePrisma.upsert('MODEL', where, create, update)` |

---

**Remember:** SafePrisma = No more 348-error nightmares! 🛡️

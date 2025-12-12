# 🔧 Manual Integration Guide - Complete Steps

## Files to Edit

### 1️⃣ `backend/src/index.ts`

#### A. Add imports (after line 39, after `activeSessions` import)

```typescript
import { waitForDatabase } from "./utils/waitForDatabase";
import rpaApprovalRouter from "./routes/rpaApproval";
import adminBonusRouter from "./routes/adminBonus";
```

#### B. Register routes (after line 107, after `app.use("/api/oal", oalRouter);`)

```typescript
app.use("/api/rpa", rpaApprovalRouter);
app.use("/api/admin/bonus", adminBonusRouter);
```

#### C. Replace server startup (lines 195-199)

**REMOVE:**

```typescript
// Start server
const PORT = config.port || process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

**REPLACE WITH:**

```typescript
// Start server with database connection retry
const PORT = config.port || process.env.PORT || 5000;

async function startServer() {
  try {
    console.log("🔌 Connecting to database...");
    await waitForDatabase();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
```

---

### 2️⃣ `render.yaml`

#### Update buildCommand (line 9)

**REMOVE:**

```yaml
buildCommand: "npm ci && npx prisma migrate resolve --rolled-back 20251022094130_add_crypto_balances_to_users || true && npx prisma migrate deploy && npm run build"
```

**REPLACE WITH:**

```yaml
buildCommand: "npm ci --production=false && npx prisma generate && npx prisma migrate deploy && npm run build"
```

---

### 3️⃣ `backend/prisma/schema.prisma` (Optional - Performance Optimization)

#### A. Update TokenWallet model

Find the `model TokenWallet` and add the relation:

```prisma
model TokenWallet {
  id        String   @id @default(uuid())
  userId    String   @unique
  balance   Decimal  @default(0) @db.Decimal(20, 8)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions TokenTransaction[] // ← ADD THIS LINE

  @@index([userId])
}
```

#### B. Update TokenTransaction model

Find `model TokenTransaction` and add:

```prisma
model TokenTransaction {
  id          String   @id @default(uuid())
  walletId    String
  userId      String
  amount      Decimal  @db.Decimal(20, 8)
  type        String
  status      String   @default("completed")
  description String?
  createdAt   DateTime @default(now())

  user   User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  wallet TokenWallet @relation(fields: [walletId], references: [id], onDelete: Cascade) // ← ADD THIS

  @@index([userId])
  @@index([walletId, createdAt(sort: Desc)]) // ← ADD THIS for performance
  @@index([status, createdAt(sort: Desc)])   // ← ADD THIS for performance
}
```

#### C. Update CryptoWithdrawal model

Add performance indexes:

```prisma
model CryptoWithdrawal {
  // ... existing fields ...

  @@index([userId])
  @@index([status, createdAt(sort: Desc)]) // ← ADD THIS
  @@index([userId, status])                // ← ADD THIS
}
```

**After schema changes, run:**

```powershell
cd backend
npx prisma migrate dev --name add_wallet_relations_and_indexes
npx prisma generate
```

---

## 🚀 Testing After Integration

### 1. Test Backend Locally

```powershell
cd backend
npm run dev
```

**Expected output:**

```
🔌 Connecting to database...
✅ Database connected successfully
🚀 Server is running on port 4000
📊 Environment: development
🌐 Frontend URL: http://localhost:3000
```

### 2. Test New API Endpoints

**RPA Auto-Approval:**

```bash
POST http://localhost:4000/api/rpa/auto-approve/withdrawal/:id
POST http://localhost:4000/api/rpa/batch-auto-approve
POST http://localhost:4000/api/rpa/auto-verify-kyc/:userId
```

**Admin Bonus:**

```bash
POST http://localhost:4000/api/admin/bonus/bulk-assign
POST http://localhost:4000/api/admin/bonus/award-single
GET  http://localhost:4000/api/admin/bonus/history
```

### 3. Run Wallet Audit

```powershell
cd backend
npx ts-node scripts/audit-ledger-fixed.ts
```

---

## 📋 Commit Changes

After making all edits:

```powershell
git add backend/src/index.ts render.yaml backend/prisma/schema.prisma
git commit -m "chore: integrate RPA routes, admin bonus, and database retry logic"
git push origin feature/rpa-ledger-optimization
```

---

## ✅ Checklist

- [ ] `backend/src/index.ts` - Added 3 imports (waitForDatabase, rpaApprovalRouter, adminBonusRouter)
- [ ] `backend/src/index.ts` - Registered 2 routes (/api/rpa, /api/admin/bonus)
- [ ] `backend/src/index.ts` - Replaced server startup with async function
- [ ] `render.yaml` - Updated buildCommand (removed `|| true`, added explicit prisma generate)
- [ ] `backend/prisma/schema.prisma` - Added TokenWallet.transactions relation (optional)
- [ ] `backend/prisma/schema.prisma` - Added performance indexes (optional)
- [ ] Ran `npx prisma migrate dev` (if schema changed)
- [ ] Tested backend startup locally
- [ ] Tested new API endpoints
- [ ] Committed and pushed changes

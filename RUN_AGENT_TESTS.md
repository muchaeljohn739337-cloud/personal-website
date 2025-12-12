# 🚀 RUN THE AGENT TESTS - Quick Command Reference

## ✅ RECOMMENDED: Complete Validation (All-in-One)

```powershell
.\scripts\validate-agents.ps1
```

This single command runs:

1. ✅ Dependency check
2. ✅ TypeScript compilation
3. ✅ Prisma schema validation
4. ✅ Database connection test
5. ✅ Agent status check
6. ✅ **ALL 9 AGENT TESTS**

---

## Alternative Options

### Option 1: Backend Only (Simple)

```powershell
cd backend
npm run agent:test
```

### Option 2: Backend with Checks (PowerShell)

```powershell
cd backend
.\scripts\run-agent-tests.ps1
```

### Option 3: Check Status Without Running

```powershell
cd backend
npm run agent:status
```

---

## What Gets Tested?

### 9 RPA Agents

1. ✅ **MonitorAgent** - System health monitoring (every 5 min)
2. ✅ **TransactionAuditAgent** - Transaction verification (every 15 min)
3. ✅ **CryptoRecoveryAgent** - Failed crypto recovery (every 30 min)
4. ✅ **UserSupportAgent** - Automated support (every 20 min)
5. ✅ **AdminInsightAgent** - Admin analytics (daily 9 AM)
6. ✅ **SecurityFraudAgent** - Fraud detection (every 10 min)
7. ✅ **CompliancePolicyAgent** - Compliance monitoring (daily 2 AM)
8. ✅ **CostOptimizationAgent** - Cost analysis (weekly Sunday 3 AM)
9. ✅ **DeployOrchestratorAgent** - Deployment health (every 6 hours)

---

## Expected Output

```
╔════════════════════════════════════════════════════════════════╗
║   Advancia Pay Ledger - Complete Agent Validation Suite      ║
╚════════════════════════════════════════════════════════════════╝

📦 Step 1: Checking dependencies...
   ✅ Dependencies installed

🔧 Step 2: Checking TypeScript compilation...
   ✅ TypeScript compilation successful

🗄️  Step 3: Checking Prisma schema...
   ✅ Prisma schema valid
   ✅ Prisma client generated

🔌 Step 4: Testing database connection...
   ✅ Database connection successful

📊 Step 5: Checking agent status...
   [Agent status output]

🤖 Step 6: Running agent tests...

🧪 Testing All Agents

▶️  Testing MonitorAgent...
   ✅ Passed (245ms) - 4 items

▶️  Testing TransactionAuditAgent...
   ✅ Passed (189ms) - 12 items

▶️  Testing CryptoRecoveryAgent...
   ✅ Passed (156ms) - 2 items

▶️  Testing UserSupportAgent...
   ✅ Passed (98ms) - 5 items

▶️  Testing AdminInsightAgent...
   ✅ Passed (234ms) - 1 items

▶️  Testing SecurityFraudAgent...
   ✅ Passed (178ms) - 3 items

▶️  Testing CompliancePolicyAgent...
   ✅ Passed (145ms) - 8 items

▶️  Testing CostOptimizationAgent...
   ✅ Passed (267ms) - 15 items

▶️  Testing DeployOrchestratorAgent...
   ✅ Passed (123ms) - 2 items

═══════════════════════════════════════════════════════════════
Test Summary
═══════════════════════════════════════════════════════════════

Total Agents: 9
✅ Passed: 9
❌ Failed: 0

═══════════════════════════════════════════════════════════════

╔════════════════════════════════════════════════════════════════╗
║                      VALIDATION COMPLETE                       ║
╚════════════════════════════════════════════════════════════════╝

✅ SUCCESS: All 9 agents passed validation!

Agent System Status:
  • BaseAgent: ✅ Implemented with metadata tracking
  • Scheduler: ✅ Properly typed and initialized
  • Agents: ✅ All 9 agents operational
  • Tests: ✅ Validation suite passing
```

---

## Troubleshooting

### "Cannot connect to database"

```powershell
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (if not running)
# Windows: net start postgresql-x64-14
# Or check Docker: docker ps

# Verify DATABASE_URL in backend/.env
```

### "Module not found" errors

```powershell
cd backend
npm install
npx prisma generate
```

### "Prisma schema invalid"

```powershell
cd backend
npx prisma migrate deploy
npx prisma generate
```

---

## Files Created

### Test Infrastructure

- ✅ `scripts/validate-agents.ps1` - Complete validation suite
- ✅ `backend/scripts/run-agent-tests.ps1` - Backend test wrapper
- ✅ `backend/scripts/test-agents.ts` - Agent test runner
- ✅ `backend/scripts/test-db-quick.ts` - DB connection test

### Documentation

- ✅ `backend/AGENT_TEST_GUIDE.md` - Comprehensive guide
- ✅ `RUN_AGENT_TESTS.md` - This quick reference

### Core System (Already Implemented)

- ✅ `backend/src/agents/BaseAgent.ts` - Base class
- ✅ `backend/src/agents/scheduler.ts` - Orchestration
- ✅ 9 Agent implementations (Monitor, Audit, Recovery, etc.)

---

## Next Actions After Tests Pass

### 1. Enable Agents in Production

Edit `backend/src/index.ts`:

```typescript
// Uncomment this section:
if (process.env.NODE_ENV === "production") {
  agentScheduler.initialize();
}
```

### 2. Monitor Agent Execution

```powershell
# Check agent status
npm run agent:status

# View logs in production
tail -f logs/agent-execution.log
```

### 3. Manual Agent Execution

```powershell
npm run agent:execute -- MonitorAgent
npm run agent:execute -- TransactionAuditAgent
# etc.
```

---

## 🎯 QUICK START: Run This Now!

```powershell
.\scripts\validate-agents.ps1
```

That's it! One command runs everything. 🚀

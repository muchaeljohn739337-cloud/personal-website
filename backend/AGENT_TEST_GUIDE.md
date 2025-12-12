# RPA Agent System - Test Execution Guide

## Quick Start

### Option 1: PowerShell Script (Recommended)

```powershell
cd backend
.\scripts\run-agent-tests.ps1
```

### Option 2: NPM Script

```powershell
cd backend
npm run agent:test
```

### Option 3: Check Agent Status Only

```powershell
cd backend
npm run agent:status
```

---

## What Gets Tested

The test suite validates all 9 RPA agents:

### 1. **MonitorAgent** (Critical Priority)

- **Schedule**: Every 5 minutes
- **Purpose**: System health monitoring
- **Checks**: Database connection, active users, pending transactions, recent errors
- **Alerts**: High pending transaction count (>100), high error rate (>10 in 5 min)

### 2. **TransactionAuditAgent** (High Priority)

- **Schedule**: Every 15 minutes
- **Purpose**: Transaction verification and fraud detection
- **Checks**: Failed transactions, suspicious patterns, high-value transactions
- **Actions**: Creates audit logs, sends alerts for suspicious activity

### 3. **CryptoRecoveryAgent** (High Priority)

- **Schedule**: Every 30 minutes
- **Purpose**: Recover failed crypto transactions
- **Checks**: Stuck crypto withdrawals/orders
- **Actions**: Retries failed transactions, updates statuses

### 4. **UserSupportAgent** (Medium Priority)

- **Schedule**: Every 20 minutes
- **Purpose**: Automated customer support
- **Checks**: Open support tickets, auto-resolvable issues
- **Actions**: Closes resolved tickets, sends notifications

### 5. **AdminInsightAgent** (Low Priority)

- **Schedule**: Daily at 9 AM
- **Purpose**: Generate admin analytics
- **Checks**: Daily user/transaction stats
- **Actions**: Sends daily reports to admins

### 6. **SecurityFraudAgent** (Critical Priority)

- **Schedule**: Every 10 minutes
- **Purpose**: Fraud detection and prevention
- **Checks**: Multiple failed login attempts, suspicious transactions
- **Actions**: Blocks suspicious accounts, sends security alerts

### 7. **CompliancePolicyAgent** (High Priority)

- **Schedule**: Daily at 2 AM
- **Purpose**: Regulatory compliance monitoring
- **Checks**: KYC verification status, transaction limits
- **Actions**: Flags compliance violations, sends reports

### 8. **CostOptimizationAgent** (Low Priority)

- **Schedule**: Weekly on Sundays at 3 AM
- **Purpose**: Cost analysis and optimization
- **Checks**: Resource utilization, inefficient processes
- **Actions**: Generates cost reports with recommendations

### 9. **DeployOrchestratorAgent** (Medium Priority)

- **Schedule**: Every 6 hours
- **Purpose**: Deployment health and orchestration
- **Checks**: Service status, deployment logs, system health
- **Actions**: Sends deployment notifications, monitors rollouts

---

## Test Output Format

```
🧪 Testing All Agents

▶️  Testing MonitorAgent...
   ✅ Passed (245ms) - 4 items

▶️  Testing TransactionAuditAgent...
   ✅ Passed (189ms) - 12 items

... (7 more agents)

═══════════════════════════════════════════════════════════════
Test Summary
═══════════════════════════════════════════════════════════════

Total Agents: 9
✅ Passed: 9
❌ Failed: 0

═══════════════════════════════════════════════════════════════
```

---

## Architecture Overview

### BaseAgent Class

- Abstract base class for all agents
- Provides standardized lifecycle: `run()` → `execute()`
- Tracks execution metadata: `lastRunResult`, `lastRunAt`
- Handles errors gracefully with try-catch
- Emits Socket.IO events for real-time monitoring

### AgentContext

Each agent receives:

- `prisma`: Database client for queries
- `io`: Socket.IO server for real-time events
- `logger`: Structured logging (info, warn, error, debug)

### AgentScheduler

- Initializes all agents with proper context
- Schedules agents using node-cron
- Provides manual execution via `executeAgent(name)`
- Reports agent status via `getAgentStatus()`

---

## Database Requirements

### Required Tables

- `User` - User accounts
- `Transaction` - Financial transactions
- `TokenTransaction` - Crypto token movements
- `CryptoWithdrawal` - Crypto withdrawal requests
- `CryptoOrder` - Crypto purchase orders
- `SupportTicket` - Customer support cases
- `AuditLog` - System audit trail
- `Notification` - User notifications

### Connection

- PostgreSQL database required
- Configure via `DATABASE_URL` in `.env`
- Default: `postgresql://postgres:postgres@localhost:5432/advancia_payledger`

---

## Troubleshooting

### Test Failures

**"Cannot connect to database"**

- Check if PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env`
- Run: `cd backend && npx prisma migrate deploy`

**"Agent execution timeout"**

- Check database query performance
- Increase timeout in agent config
- Review agent logs for bottlenecks

**"Missing table or column"**

- Run migrations: `npx prisma migrate dev`
- Regenerate client: `npx prisma generate`
- Verify schema: `npx prisma studio`

### Common Issues

1. **Node modules missing**: Run `npm install` in backend/
2. **TypeScript errors**: Run `npm run build` to check compilation
3. **Prisma client outdated**: Run `npx prisma generate`
4. **Socket.IO not initialized**: Socket.IO is optional for testing

---

## Next Steps

### Production Deployment

1. Set `NODE_ENV=production` in environment
2. Configure production DATABASE_URL
3. Enable agent scheduler in `src/index.ts`
4. Monitor agent execution via logs
5. Set up alerting for agent failures

### Adding New Agents

1. Create new file: `backend/src/agents/MyNewAgent.ts`
2. Extend `BaseAgent` class
3. Implement `execute()` method
4. Define `AgentConfig` (name, schedule, priority)
5. Add to `scheduler.ts` initialization
6. Add to test suite in `scripts/test-agents.ts`

### Performance Optimization

- Add database indexes for agent queries
- Implement caching for frequently accessed data
- Use database connection pooling
- Monitor agent execution duration
- Adjust schedules to avoid overlaps

---

## Files Modified/Created

### Core Agent System

- ✅ `backend/src/agents/BaseAgent.ts` - Base class with metadata tracking
- ✅ `backend/src/agents/scheduler.ts` - Agent orchestration
- ✅ `backend/src/agents/types.ts` - Re-export shim for backwards compatibility

### Agent Implementations (9 total)

- ✅ `backend/src/agents/MonitorAgent.ts`
- ✅ `backend/src/agents/TransactionAuditAgent.ts`
- ✅ `backend/src/agents/CryptoRecoveryAgent.ts`
- ✅ `backend/src/agents/UserSupportAgent.ts`
- ✅ `backend/src/agents/AdminInsightAgent.ts`
- ✅ `backend/src/agents/SecurityFraudAgent.ts`
- ✅ `backend/src/agents/CompliancePolicyAgent.ts`
- ✅ `backend/src/agents/CostOptimizationAgent.ts`
- ✅ `backend/src/agents/DeployOrchestratorAgent.ts`

### Scripts & Tests

- ✅ `backend/scripts/test-agents.ts` - Agent test runner
- ✅ `backend/scripts/check-agent-status.ts` - Status checker
- ✅ `backend/scripts/execute-agent.ts` - Manual execution
- ✅ `backend/scripts/run-agent-tests.ps1` - PowerShell test wrapper
- ✅ `backend/scripts/test-db-quick.ts` - Database connection test
- ✅ `backend/tests/agents/baseAgent.test.ts` - Jest unit tests

### Package.json Scripts

```json
{
  "agent:status": "tsx scripts/check-agent-status.ts",
  "agent:execute": "tsx scripts/execute-agent.ts",
  "agent:test": "tsx scripts/test-agents.ts"
}
```

---

## Test Coverage Status

### ✅ Completed

- BaseAgent lifecycle (run, execute, error handling)
- All 9 agents have description fields
- Scheduler properly types agents as BaseAgent[]
- Agent status reporting includes lastRun metadata
- Manual execution via scheduler.executeAgent()

### ⏳ Pending

- Unit tests for individual agent business logic
- Integration tests with mocked database
- Load testing for concurrent agent execution
- Edge case testing (network failures, DB timeouts)
- Performance benchmarking

---

## Monitoring & Observability

### Real-time Events (Socket.IO)

Agents emit events for real-time dashboard updates:

- `system:alert` - Critical system alerts
- `transaction:audit` - Audit findings
- `security:fraud` - Fraud detections
- `support:ticket` - Ticket updates
- `admin:insight` - Analytics reports

### Logging

All agents use structured logging:

```typescript
logger.info("Message", { metadata });
logger.warn("Warning", { details });
logger.error("Error", error);
logger.debug("Debug info"); // Only in development
```

### Metrics

Each agent execution returns:

- `success`: boolean
- `message`: string description
- `metrics.duration`: execution time in ms
- `metrics.itemsProcessed`: number of items handled
- `metrics.errors`: error count

---

**Status**: ✅ All agents implemented and ready for testing **Last Updated**: 2025-11-02 **Next Action**: Run
`npm run agent:test` to validate all agents

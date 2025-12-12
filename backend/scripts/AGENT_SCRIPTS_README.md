# Agent Management Scripts

This directory contains utility scripts for managing and testing the 9 RPA agents in the Advancia Pay Ledger platform.

## Available Scripts

### 1. Check Agent Status

View the configuration and status of all agents.

```bash
npm run agent:status
```

**Output:**

- Lists all 9 agents with their:
  - Name
  - Priority level (Critical, High, Medium, Low)
  - Cron schedule
  - Description
  - Enabled status

### 2. Execute Individual Agent

Manually run a specific agent on-demand.

```bash
npm run agent:execute <AgentName>
```

**Examples:**

```bash
npm run agent:execute MonitorAgent
npm run agent:execute TransactionAuditAgent
npm run agent:execute CryptoRecoveryAgent
```

**Output:**

- Execution success/failure
- Processing duration
- Number of items processed
- Detailed result data
- Any errors encountered

**Available Agents:**

- `MonitorAgent` - System health monitoring (every 5 min)
- `SecurityFraudAgent` - Security threat detection (every 5 min)
- `UserSupportAgent` - Customer support automation (every 10 min)
- `CryptoRecoveryAgent` - Stuck transaction recovery (every 15 min)
- `DeployOrchestratorAgent` - Deployment health checks (every 30 min)
- `TransactionAuditAgent` - Transaction anomaly detection (every 2 hrs)
- `CompliancePolicyAgent` - Regulatory compliance (every 6 hrs)
- `AdminInsightAgent` - Daily analytics (daily at 2 AM)
- `CostOptimizationAgent` - Resource optimization (daily at 3 AM)

### 3. Test All Agents

Run all agents once to verify they work correctly.

```bash
npm run agent:test
```

**Output:**

- Executes each agent sequentially
- Shows pass/fail status for each agent
- Reports execution duration
- Summarizes total passed/failed agents
- Lists any errors encountered

**Use Cases:**

- Verify agents work after deployment
- Test agents in development before pushing
- Troubleshoot agent issues
- Validate database connectivity

## Production Usage

### View Agent Logs in Production

```bash

# SSH into Render or view logs in dashboard

# Look for agent execution messages:

[INFO] [MonitorAgent] Starting execution...
[INFO] [MonitorAgent] Execution completed
```

## Manual Agent Execution via API

```bash

# Requires admin JWT token

curl -X POST https://www.advanciapayledger.com/api/agents/execute/MonitorAgent \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Get Agent Status via API

```bash

# Requires admin JWT token

curl https://www.advanciapayledger.com/api/agents/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Development Tips

### Testing Locally

1. Ensure backend is running: `npm run dev`
2. Agents auto-start with the server
3. Use `npm run agent:execute` to test individual agents
4. Check console logs for agent execution messages

### Debugging Agent Issues

1. Run `npm run agent:status` to verify configuration
2. Run `npm run agent:execute <AgentName>` to test specific agent
3. Check Prisma schema matches agent queries
4. Verify Socket.IO connection for real-time events
5. Review agent logs for error details

### Modifying Agent Schedule

Edit `backend/src/agents/<AgentName>.ts`:

```typescript
schedule: "*/5 * * * *", // Every 5 minutes
```

Cron format: `minute hour day month weekday`

### Disabling an Agent

Edit `backend/src/agents/<AgentName>.ts`:

```typescript
enabled: false, // Disable agent
```

## Monitoring

### Real-time Events (Socket.IO)

Agents emit events that admins can listen to:

- `system:alert` - Critical system issues
- `security:alert` - Security threats detected
- `audit:alert` - Transaction anomalies
- `admin:daily-report` - Daily analytics report

### Database Logs

All agent executions create audit log entries:

```sql
SELECT * FROM "AuditLog"
WHERE action LIKE '%Agent%'
ORDER BY "createdAt" DESC;
```

## Troubleshooting

### Agent Not Running

- Check agent is enabled in configuration
- Verify cron schedule is valid
- Check database connectivity
- Review server logs for errors

### Agent Execution Fails

- Run `npm run agent:test` to identify issue
- Verify Prisma schema matches queries
- Check database has required data
- Review error messages in logs

### No Socket.IO Events

- Verify Socket.IO is initialized in `index.ts`
- Check `agentScheduler.setSocketIO(io)` is called
- Ensure admin is connected to Socket.IO
- Review browser console for connection errors

## Architecture

### Agent Flow

1. Scheduler initializes all agents on server start
2. Node-cron schedules agent execution
3. Agent runs `execute()` method
4. Results logged and emitted via Socket.IO
5. Errors captured and reported

### Base Agent Class

All agents extend `BaseAgent` from `types.ts`:

- Standardized configuration
- Execution wrapper with error handling
- Metrics collection
- Socket.IO event emission

### Context Injection

Agents receive:

- `prisma` - Database client
- `logger` - Logging interface
- `io` - Socket.IO server (optional)
- `config` - Agent configuration

## Scripts Source Code

- `execute-agent.ts` - Manual agent execution
- `check-agent-status.ts` - Agent status viewer
- `test-agents.ts` - Agent test suite

All scripts use the same `AgentScheduler` instance as production.

# 🤖 AI System Architecture - Complete Documentation

## Overview

The Advancia Pay Ledger platform now features a comprehensive, self-monitoring AI system that ensures perfect execution, data integrity, security, and autonomous operation.

## 🎯 AI System Components

```
┌────────────────────────────────────────────────────┐
│         UNIFIED INSTRUCTION SET                    │
│  (Central configuration for all AI modules)        │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│     📦 RECORD CLEANUP AI                           │
│  - Remove old jobs, logs, notifications            │
│  - Archive before delete                           │
│  - Scheduled daily at 2 AM                         │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│     🗺️  MAPPER AI                                  │
│  - Validate workflow → connector mappings          │
│  - Check API endpoint flows                        │
│  - Detect orphaned data and stuck tasks            │
│  - Auto-fix common issues                          │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│     🎯 TASK ORCHESTRATOR AI                        │
│  - Manage worker pool (12 workers)                 │
│  - Priority-based task queue                       │
│  - Auto-retry on failure                           │
│  - Resource-aware scheduling                       │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│     👁️  SURVEILLANCE AI                            │
│  - Continuous system monitoring (5s interval)      │
│  - Detect security anomalies                       │
│  - Alert admins via Socket.IO                      │
│  - Real-time dashboard generation                  │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│     🛡️  GUARDIAN AI + ANTIMODULES                  │
│  - Block malicious activity in real-time           │
│  - Audit logging and compliance                    │
│  - Integration with all AI systems                 │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│     ⚡ AUTO-PRECISION CORE                          │
│  - Perfect execution guarantee                     │
│  - Zero-error promise                              │
│  - Rollback on failure                             │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│     💾 AUTO-REMEMBER                                │
│  - Log everything for audit trail                  │
│  - Compliance tracking                             │
│  - Historical analysis                             │
└────────────────────────────────────────────────────┘
```

---

## 📦 Record Cleanup AI

**Location:** `backend/src/ai/recordCleanupAI.ts`

### Purpose

Automated data maintenance system that removes old and obsolete records to keep the database clean and performant.

### Features

- **Scheduled Cleanup**: Runs daily at 2 AM (configurable via cron)
- **Configurable Retention**: Customize retention periods per data type
- **Dry-run Mode**: Test cleanup without deleting anything
- **Archive Before Delete**: Optional archiving of deleted records
- **Guardian AI Integration**: All cleanup actions are audited

### Default Retention Periods

```typescript
{
  jobRetentionDays: 30,        // Jobs older than 30 days
  auditLogRetentionDays: 365,  // Audit logs older than 1 year (compliance)
  notificationRetentionDays: 30, // Read notifications older than 30 days
  sessionRetentionDays: 7,     // Inactive sessions older than 7 days
}
```

### API Endpoints

#### Get Cleanup Statistics

```http
GET /api/admin/ai/cleanup/stats
Authorization: Bearer {admin_token}
```

Response:

```json
{
  "success": true,
  "stats": {
    "totalCleaned": 1250,
    "lastRun": "2024-01-15T02:00:00.000Z",
    "jobsCleaned": 450,
    "auditLogsCleaned": 600,
    "notificationsCleaned": 150,
    "sessionsCleaned": 50
  }
}
```

#### Manually Trigger Cleanup

```http
POST /api/admin/ai/cleanup/run
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "dryRun": false,
  "targets": ["jobs", "notifications", "sessions"]
}
```

Response:

```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "result": {
    "total": 150,
    "jobs": 100,
    "notifications": 30,
    "sessions": 20
  }
}
```

---

## 🎯 Task Orchestrator AI

**Location:** `backend/src/ai/taskOrchestratorAI.ts`

### Purpose

Intelligent task management system with worker pool, priority queue, and resource-aware scheduling.

### Worker Pool Configuration

```typescript
Workers:
  - Stripe: 2 workers × 5 concurrent = 10 max
  - Crypto: 2 workers × 3 concurrent = 6 max
  - Email: 3 workers × 10 concurrent = 30 max
  - Social: 1 worker × 3 concurrent = 3 max
  - AI: 4 workers × 10 concurrent = 40 max

Total: 12 workers, 50 max concurrent tasks
```

### Priority Levels

1. **Critical** - Execute immediately
2. **High** - Execute as soon as worker available
3. **Medium** - Normal priority (default)
4. **Low** - Execute during off-peak hours

### Features

- **Auto-retry**: 3 attempts (configurable) on failure
- **Timeout Protection**: 5-minute default timeout
- **Worker Health Monitoring**: Heartbeat every 30 seconds
- **Resource-aware**: Integration with AI Rate Limiter for CPU/memory checks

### API Endpoints

#### Get Task Statistics

```http
GET /api/admin/ai/tasks/stats
Authorization: Bearer {admin_token}
```

Response:

```json
{
  "success": true,
  "stats": {
    "pendingTasks": 5,
    "runningTasks": 8,
    "completedTasks": 1542,
    "failedTasks": 23,
    "totalWorkers": 12,
    "availableWorkers": 4
  }
}
```

#### Submit a Task

```http
POST /api/admin/ai/tasks/submit
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "type": "send_email",
  "payload": {
    "to": "user@example.com",
    "subject": "Test Email"
  },
  "priority": "high"
}
```

Response:

```json
{
  "success": true,
  "message": "Task submitted successfully",
  "taskId": "task-1705334400000-abc123"
}
```

---

## 🗺️ Mapper AI

**Location:** `backend/src/ai/mapperAI.ts`

### Purpose

Data and workflow validation system that ensures all mappings are correct and data flows properly.

### Valid Connectors

- `stripe` - Payment processing
- `crypto` - Cryptocurrency operations
- `email` - Email notifications
- `social` - Social media integration
- `ai` - AI/ML tasks
- `database` - Database operations
- `blockchain` - Blockchain interactions
- `notification` - Push notifications

### Validation Checks

1. **Workflow Mappings**: Ensure all workflows have valid connectors
2. **Data Flow**: Check API endpoint → handler → database flow
3. **Task Assignments**: Detect stuck or unassigned tasks
4. **Database Schema**: Find orphaned records
5. **Input Validation**: Ensure all endpoints have validation middleware

### API Endpoints

#### Run Validation

```http
GET /api/admin/ai/mapper/validate
Authorization: Bearer {admin_token}
```

Response:

```json
{
  "success": true,
  "report": {
    "valid": 45,
    "invalid": 2,
    "warnings": 3,
    "details": {
      "invalidWorkflows": [
        {
          "id": "wf-123",
          "name": "payment_flow",
          "connector": "invalid_connector",
          "suggestedFix": "Use 'stripe' connector"
        }
      ],
      "warnings": [
        "50 unassigned tasks detected",
        "15 orphaned notifications found"
      ]
    }
  }
}
```

#### Auto-fix Issues

```http
POST /api/admin/ai/mapper/autofix
Authorization: Bearer {admin_token}
```

Response:

```json
{
  "success": true,
  "message": "Fixed 8 issues, 2 failed",
  "result": {
    "fixed": 8,
    "failed": 2,
    "details": ["Updated 5 workflow connectors", "Reassigned 3 stuck tasks"]
  }
}
```

---

## 👁️ Surveillance AI

**Location:** `backend/src/ai/surveillanceAI.ts`

### Purpose

Continuous system monitoring with real-time alerting and security event detection.

### Monitoring Cycle

- **Interval**: Every 5 seconds
- **Components Monitored**:
  - System health (CPU, memory, database)
  - Worker activity
  - Connector usage
  - Job execution
  - Security events
  - Anomaly detection

### Security Event Types

1. **intrusion** - Unauthorized access attempts
2. **anomaly** - Unusual system behavior
3. **suspicious_activity** - Potential security threat
4. **performance_degradation** - System overload
5. **unauthorized_access** - Failed permission checks

### Alert Levels

- **info** - General information
- **warning** - Attention required
- **error** - Problem detected
- **critical** - Immediate action required

### API Endpoints

#### Get Surveillance Dashboard

```http
GET /api/admin/ai/surveillance/dashboard
Authorization: Bearer {admin_token}
```

Response:

```json
{
  "success": true,
  "dashboard": {
    "health": {
      "overall": "healthy",
      "cpu": { "usage": 45.2, "status": "normal" },
      "memory": { "usage": 62.8, "status": "normal" },
      "database": { "connected": true, "status": "connected" },
      "workers": { "active": 8, "total": 12, "status": "normal" },
      "tasks": { "pending": 5, "running": 8, "status": "normal" }
    },
    "recentEvents": [
      {
        "id": "evt-1705334400000-xyz",
        "type": "suspicious_activity",
        "severity": "high",
        "description": "15 failed login attempts in last 15 minutes",
        "timestamp": "2024-01-15T14:30:00.000Z"
      }
    ],
    "activeAlerts": [
      {
        "id": "alert-1705334400000-abc",
        "level": "warning",
        "component": "workers",
        "message": "High task queue: 105 pending tasks",
        "timestamp": "2024-01-15T14:25:00.000Z",
        "acknowledged": false
      }
    ],
    "stats": {
      "totalEvents": 450,
      "criticalEvents": 12,
      "totalAlerts": 230,
      "unacknowledged": 3
    }
  }
}
```

#### Acknowledge Alert

```http
POST /api/admin/ai/surveillance/alerts/{alertId}/acknowledge
Authorization: Bearer {admin_token}
```

Response:

```json
{
  "success": true,
  "message": "Alert acknowledged"
}
```

---

## 🛡️ Integration with Guardian AI

All AI systems integrate with Guardian AI for:

- **Audit Logging**: All actions are logged
- **Admin Alerts**: Critical events trigger admin notifications
- **Compliance**: Maintains audit trail for regulatory requirements
- **Security**: Blocks malicious activity detected by Surveillance AI

Example Guardian AI log entry:

```json
{
  "category": "security",
  "action": "suspicious_activity",
  "details": "15 failed login attempts detected",
  "metadata": {
    "failedAttempts": 15,
    "timeWindow": "15 minutes"
  },
  "timestamp": "2024-01-15T14:30:00.000Z"
}
```

---

## 🚀 Unified AI System Status

Get overall status of all AI systems:

```http
GET /api/admin/ai/status
Authorization: Bearer {admin_token}
```

Response:

```json
{
  "success": true,
  "status": {
    "overall": "healthy",
    "cleanup": {
      "lastRun": "2024-01-15T02:00:00.000Z",
      "totalCleaned": 1250
    },
    "tasks": {
      "pending": 5,
      "running": 8,
      "workers": {
        "available": 4,
        "total": 12
      }
    },
    "mapper": {
      "totalWorkflows": 47,
      "validWorkflows": 45,
      "invalidWorkflows": 2
    },
    "surveillance": {
      "health": { "overall": "healthy" },
      "activeAlerts": 3,
      "recentEvents": 5
    }
  }
}
```

---

## 🔄 Real-time Updates via Socket.IO

Admins receive real-time updates via Socket.IO:

```javascript
// Join admin room
socket.join("admins");

// Listen for events
socket.on("monitoring:health", (health) => {
  console.log("System health:", health);
});

socket.on("monitoring:alert", (alert) => {
  console.log("New alert:", alert);
});

socket.on("security:event", (event) => {
  console.log("Security event:", event);
});
```

---

## 🛠️ Configuration

### Environment Variables

```env
# AI System Configuration
AI_CLEANUP_ENABLED=true
AI_CLEANUP_CRON=0 2 * * *  # Daily at 2 AM
AI_SURVEILLANCE_INTERVAL=5000  # 5 seconds
AI_TASK_TIMEOUT=300000  # 5 minutes
AI_MAX_CONCURRENT_TASKS=50
```

### Customizing Cleanup Schedule

```typescript
// In recordCleanupAI.ts
scheduleAutomaticCleanup(): void {
  // Change cron pattern here
  cron.schedule('0 3 * * *', async () => {  // 3 AM instead of 2 AM
    await this.cleanAllOldRecords();
  });
}
```

### Adjusting Surveillance Interval

```typescript
// In surveillanceAI.ts
private readonly MONITOR_INTERVAL_MS = 10000; // 10 seconds instead of 5
```

---

## 📊 Monitoring Best Practices

1. **Daily Cleanup Verification**

   - Check cleanup stats daily
   - Ensure old records are being removed
   - Monitor for orphaned data

2. **Task Queue Monitoring**

   - Keep pending tasks < 50
   - Ensure workers are available
   - Monitor failure rate (< 5% acceptable)

3. **Mapper Validation**

   - Run validation weekly
   - Fix invalid workflows immediately
   - Keep mappings up-to-date

4. **Surveillance Alerts**
   - Acknowledge alerts promptly
   - Investigate critical events
   - Review security logs daily

---

## 🔧 Troubleshooting

### High Task Queue

**Problem:** More than 100 pending tasks

**Solution:**

1. Check worker availability
2. Increase worker pool size
3. Reduce task submission rate

### Cleanup Not Running

**Problem:** Cleanup cron job not executing

**Solution:**

1. Check if `scheduleAutomaticCleanup()` is called in `index.ts`
2. Verify cron pattern is correct
3. Check server logs for errors

### Surveillance Offline

**Problem:** No health updates received

**Solution:**

1. Verify Socket.IO connection
2. Check if `surveillanceAI.initialize(io)` was called
3. Ensure monitoring interval is set

---

## 📚 Integration Example

Complete example of integrating all AI systems:

```typescript
// backend/src/index.ts

import { recordCleanupAI } from "./ai/recordCleanupAI";
import { taskOrchestratorAI } from "./ai/taskOrchestratorAI";
import { mapperAI } from "./ai/mapperAI";
import { surveillanceAI } from "./ai/surveillanceAI";

// Initialize all AI systems
surveillanceAI.initialize(io);
recordCleanupAI.scheduleAutomaticCleanup();

// Submit a task
await taskOrchestratorAI.submitTask(
  "send_email",
  {
    to: "user@example.com",
    subject: "Welcome!",
  },
  { priority: "high" }
);

// Run validation
const report = await mapperAI.validateAllMappings();
console.log("Mapper report:", report);

// Get surveillance dashboard
const dashboard = await surveillanceAI.getDashboardData();
console.log("System health:", dashboard.health);
```

---

## 🎓 Learning Resources

- [Guardian AI Documentation](./guardian_integration.ts)
- [Auto-Precision Core](./auto_precision_integration.ts)
- [AI Rate Limiter](../middleware/aiRateLimiter.ts)
- [Deployment Guide](../../.github/copilot-deployment-instructions.md)

---

## 🆘 Support

For issues or questions:

1. Check server logs: `backend/logs/`
2. Review surveillance dashboard: `/api/admin/ai/surveillance/dashboard`
3. Run AI system status check: `/api/admin/ai/status`
4. Contact support: support@advanciapayledger.com

---

**Last Updated:** January 15, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

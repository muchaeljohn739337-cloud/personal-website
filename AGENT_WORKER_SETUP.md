# Agent Worker - Setup & Usage Guide

## ✅ System Status

The agent worker system is **fully implemented and ready to use**. All components are in place:

- ✅ Worker system (`lib/agents/worker.ts`)
- ✅ Checkpoint manager (`lib/agents/checkpoint-manager.ts`)
- ✅ Job handlers (`lib/agents/job-handlers.ts`)
- ✅ API endpoints (all routes created)
- ✅ Admin UI (`/admin/agent-checkpoints`)
- ✅ Prometheus metrics (`/api/metrics`)
- ✅ Tests (15/15 passing)

## 🚀 Starting the Worker

### Option 1: Standalone Process (Recommended for Production)

Run the worker as a separate process:

```bash
npm run worker:start
```

This will:
- Start the worker in the foreground
- Process jobs continuously
- Log all activity to console
- Handle graceful shutdown (Ctrl+C)

### Option 2: Via API Endpoint

Start/stop the worker via HTTP API:

```bash
# Start worker
curl -X POST http://localhost:3000/api/admin/agent-worker \
  -H "Cookie: your-session-cookie"

# Check status
curl http://localhost:3000/api/admin/agent-worker

# Stop worker
curl -X DELETE http://localhost:3000/api/admin/agent-worker
```

### Option 3: Auto-Start (Development)

Set environment variable to auto-start:

```bash
# In .env file
ENABLE_AGENT_WORKER=true
AGENT_WORKER_POLL_INTERVAL=5000
AGENT_WORKER_MAX_JOBS=3
```

Then import in your app initialization:
```typescript
import '@/lib/agents/init-worker';
```

## 📋 Prerequisites

Before starting the worker, ensure:

1. **Database is running and accessible**
   ```bash
   # Check database connection
   npm run prisma:studio
   ```

2. **Migrations are applied**
   ```bash
   npm run prisma:migrate
   ```

3. **Environment variables are set**
   - `DATABASE_URL` - Database connection string
   - `NEXT_PUBLIC_SENTRY_DSN` - (Optional) Sentry DSN for error tracking

## 🧪 Testing the System

### 1. Start the Worker

```bash
# Terminal 1: Start worker
npm run worker:start
```

### 2. Enqueue a Test Job

```bash
# Terminal 2: Create a job
curl -X POST http://localhost:3000/api/agent-jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "jobType": "simple-task",
    "taskDescription": "Test agent job",
    "inputData": {"test": "data"},
    "priority": 5
  }'
```

### 3. Monitor Job Progress

```bash
# Check job status
curl http://localhost:3000/api/agent-jobs?status=PENDING

# View job details
curl http://localhost:3000/api/agent-jobs/[jobId]
```

### 4. Review Checkpoints (Admin)

1. Navigate to `/admin/agent-checkpoints` in browser
2. View pending checkpoints
3. Approve or reject as needed

### 5. Check Metrics

```bash
curl http://localhost:3000/api/metrics
```

## 📊 Worker Configuration

### Environment Variables

```bash
# Worker settings
ENABLE_AGENT_WORKER=true              # Auto-start worker
AGENT_WORKER_POLL_INTERVAL=5000       # Poll every 5 seconds
AGENT_WORKER_MAX_JOBS=3               # Max concurrent jobs
```

### Programmatic Configuration

```typescript
import { startWorker } from '@/lib/agents/worker';

startWorker({
  pollInterval: 5000,        // milliseconds
  maxConcurrentJobs: 3,      // concurrent jobs
  enableSentry: true,        // Sentry integration
});
```

## 🔍 Monitoring

### Worker Status

```bash
# Get worker stats
curl http://localhost:3000/api/admin/agent-worker
```

Response:
```json
{
  "success": true,
  "worker": {
    "isRunning": true,
    "activeJobs": 1,
    "maxConcurrentJobs": 3,
    "pollInterval": 5000
  },
  "jobs": {
    "pending": 5,
    "running": 1,
    "completed": 42,
    "failed": 2
  }
}
```

### Prometheus Metrics

Available at `/api/metrics`:
- `agent_jobs_total{status="..."}` - Job counts by status
- `agent_jobs_duration_seconds` - Job duration histogram
- `agent_checkpoints_total{status="..."}` - Checkpoint counts
- `agent_checkpoints_pending` - Pending checkpoints
- `agent_worker_active_jobs` - Currently active jobs

## 🎯 Available Job Types

### 1. `simple-task`
Simple task with info checkpoint (non-blocking)

```json
{
  "jobType": "simple-task",
  "taskDescription": "Simple task",
  "inputData": {}
}
```

### 2. `code-generation`
Code generation with approval checkpoint

```json
{
  "jobType": "code-generation",
  "taskDescription": "Generate code",
  "inputData": {
    "files": [
      {
        "path": "lib/auth.ts",
        "content": "export function auth() {}"
      }
    ]
  }
}
```

### 3. `data-processing`
Data processing with multiple checkpoints

```json
{
  "jobType": "data-processing",
  "taskDescription": "Process data",
  "inputData": {
    "operation": "transform",
    "data": [1, 2, 3]
  }
}
```

## 🔧 Troubleshooting

### Worker Not Processing Jobs

1. **Check worker is running:**
   ```bash
   curl http://localhost:3000/api/admin/agent-worker
   ```

2. **Check database connection:**
   ```bash
   npm run prisma:studio
   ```

3. **Check job status:**
   ```bash
   curl http://localhost:3000/api/agent-jobs?status=PENDING
   ```

### Jobs Stuck in PENDING

- Check if there's a blocking checkpoint
- Verify worker is running
- Check job logs: `GET /api/agent-jobs/[jobId]`

### Checkpoints Not Appearing

- Verify job created checkpoint: `GET /api/agent-jobs/[jobId]/checkpoints`
- Check checkpoint status is PENDING
- Verify admin access to `/admin/agent-checkpoints`

## 📝 Next Steps

1. **Start the worker:**
   ```bash
   npm run worker:start
   ```

2. **Create your first job:**
   Use the API or create a custom job handler

3. **Monitor activity:**
   - Watch worker logs
   - Check admin UI
   - View Prometheus metrics

4. **Add custom job handlers:**
   Edit `lib/agents/job-handlers.ts` to add your handlers

## 🎉 Success!

Your agent worker system is ready to process jobs with checkpoint approval workflows!

---

**Need Help?** Check:
- `AGENT_WORKER_SYSTEM_COMPLETE.md` - Full implementation details
- `lib/agents/worker.ts` - Worker implementation
- `__tests__/agents/` - Test examples


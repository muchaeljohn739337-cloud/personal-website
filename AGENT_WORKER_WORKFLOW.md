# 🔄 Agent Worker - Complete Workflow Guide

## Step-by-Step Execution Guide

This guide walks you through the complete workflow from starting the worker to monitoring jobs.

---

## Step 1: Ensure Database is Running

### Check Database Connection

```bash
npm run worker:check-db
```

**Expected Output (when connected):**

```
✅ Database connection successful!
✅ agent_checkpoints table exists
✅ ai_jobs table exists
✅ Database is ready for agent worker!
```

**If connection fails:**

1. Verify `DATABASE_URL` in `.env` file
2. Ensure database server is running
3. Check network connectivity
4. Run migrations: `npm run prisma:migrate`

---

## Step 2: Start the Worker

### Option A: Standalone Process (Recommended)

```bash
npm run worker:start
```

**Output:**

```
🚀 Starting Agent Worker...

[AgentWorker] Starting worker...
✅ Worker started successfully!

📊 Worker Stats:
{
  "isRunning": true,
  "activeJobs": 0,
  "maxConcurrentJobs": 3,
  "pollInterval": 5000
}

💡 Worker is now processing jobs...
   Press Ctrl+C to stop
```

### Option B: Via API (After Starting Dev Server)

**Terminal 1:**

```bash
npm run dev
```

**Terminal 2:**

```bash
# Start worker via API
curl -X POST http://localhost:3000/api/admin/agent-worker \
  -H "Cookie: your-session-cookie"

# Check status
curl http://localhost:3000/api/admin/agent-worker
```

---

## Step 3: Create Jobs via API

### Example 1: Simple Task (Non-blocking)

```bash
curl -X POST http://localhost:3000/api/agent-jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "jobType": "simple-task",
    "taskDescription": "Process user data",
    "inputData": {
      "userId": "user-123",
      "action": "update-profile"
    },
    "priority": 5
  }'
```

**Response:**

```json
{
  "success": true,
  "job": {
    "id": "clx1234567890",
    "jobType": "simple-task",
    "status": "PENDING",
    "taskDescription": "Process user data",
    "priority": 5,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Example 2: Code Generation (Requires Approval)

```bash
curl -X POST http://localhost:3000/api/agent-jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "jobType": "code-generation",
    "taskDescription": "Generate authentication module",
    "inputData": {
      "files": [
        {
          "path": "lib/auth.ts",
          "content": "export function authenticate() { return true; }"
        },
        {
          "path": "lib/auth.test.ts",
          "content": "describe(\"auth\", () => { ... })"
        }
      ],
      "description": "User authentication module"
    },
    "priority": 8
  }'
```

### Example 3: Data Processing (Multiple Checkpoints)

```bash
curl -X POST http://localhost:3000/api/agent-jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "jobType": "data-processing",
    "taskDescription": "Transform customer data",
    "inputData": {
      "operation": "transform",
      "data": [
        {"id": 1, "name": "John", "email": "john@example.com"},
        {"id": 2, "name": "Jane", "email": "jane@example.com"}
      ],
      "transform": "normalize"
    },
    "priority": 7
  }'
```

---

## Step 4: Monitor Job Status

### List All Jobs

```bash
# Get all jobs
curl http://localhost:3000/api/agent-jobs \
  -H "Cookie: your-session-cookie"

# Filter by status
curl "http://localhost:3000/api/agent-jobs?status=PENDING" \
  -H "Cookie: your-session-cookie"

# Filter by job type
curl "http://localhost:3000/api/agent-jobs?jobType=code-generation" \
  -H "Cookie: your-session-cookie"

# Pagination
curl "http://localhost:3000/api/agent-jobs?limit=10&offset=0" \
  -H "Cookie: your-session-cookie"
```

### Get Job Details

```bash
curl http://localhost:3000/api/agent-jobs/[jobId] \
  -H "Cookie: your-session-cookie"
```

**Response includes:**

- Job status and metadata
- All checkpoints
- All logs
- Execution timeline

### Get Job Checkpoints

```bash
curl http://localhost:3000/api/agent-jobs/[jobId]/checkpoints \
  -H "Cookie: your-session-cookie"
```

---

## Step 5: Review Checkpoints in Admin UI

### Access Admin UI

1. **Navigate to:** `http://localhost:3000/admin/agent-checkpoints`
2. **Login as admin** (if not already logged in)
3. **View pending checkpoints**

### UI Features

- ✅ List of all pending checkpoints
- ✅ Expandable checkpoint details
- ✅ Associated job logs
- ✅ Checkpoint data preview
- ✅ Approve/Reject buttons
- ✅ Real-time updates (auto-refresh every 10s)

### Approve Checkpoint (Via API)

```bash
curl -X POST http://localhost:3000/api/admin/agent-checkpoints/[checkpointId] \
  -H "Cookie: your-session-cookie"
```

**Response:**

```json
{
  "success": true,
  "checkpoint": {
    "id": "checkpoint-123",
    "status": "APPROVED",
    "approvedBy": "admin-user-id",
    "approvedAt": "2024-01-15T10:35:00Z"
  },
  "message": "Checkpoint approved successfully"
}
```

### Reject Checkpoint (Via API)

```bash
curl -X DELETE http://localhost:3000/api/admin/agent-checkpoints/[checkpointId] \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "reason": "Code doesn't meet security standards"
  }'
```

**Response:**

```json
{
  "success": true,
  "checkpoint": {
    "id": "checkpoint-123",
    "status": "REJECTED",
    "rejectionReason": "Code doesn't meet security standards"
  },
  "message": "Checkpoint rejected successfully"
}
```

---

## Step 6: Monitor via Prometheus Metrics

### Access Metrics Endpoint

```bash
curl http://localhost:3000/api/metrics
```

### Example Metrics Output

```
# HELP agent_jobs_total Total number of agent jobs by status
# TYPE agent_jobs_total counter
agent_jobs_total{status="PENDING"} 5
agent_jobs_total{status="RUNNING"} 1
agent_jobs_total{status="COMPLETED"} 42
agent_jobs_total{status="FAILED"} 2

# HELP agent_jobs_duration_seconds Duration of agent jobs in seconds
# TYPE agent_jobs_duration_seconds histogram
agent_jobs_duration_seconds_bucket{status="COMPLETED",le="1"} 10
agent_jobs_duration_seconds_bucket{status="COMPLETED",le="5"} 25
agent_jobs_duration_seconds_bucket{status="COMPLETED",le="10"} 35
agent_jobs_duration_seconds_bucket{status="COMPLETED",le="+Inf"} 42
agent_jobs_duration_seconds_count{status="COMPLETED"} 42
agent_jobs_duration_seconds_sum{status="COMPLETED"} 156.78

# HELP agent_checkpoints_total Total number of agent checkpoints by status
# TYPE agent_checkpoints_total counter
agent_checkpoints_total{status="PENDING"} 3
agent_checkpoints_total{status="APPROVED"} 28
agent_checkpoints_total{status="REJECTED"} 2

# HELP agent_checkpoints_pending Number of pending agent checkpoints
# TYPE agent_checkpoints_pending gauge
agent_checkpoints_pending 3

# HELP agent_worker_active_jobs Number of currently active agent jobs
# TYPE agent_worker_active_jobs gauge
agent_worker_active_jobs 1
```

### Configure Prometheus Scraping

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'agent-worker'
    scrape_interval: 15s
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['localhost:3000']
```

---

## Step 7: Worker Status & Management

### Get Worker Status

```bash
curl http://localhost:3000/api/admin/agent-worker \
  -H "Cookie: your-session-cookie"
```

**Response:**

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

### Stop Worker

```bash
curl -X DELETE http://localhost:3000/api/admin/agent-worker \
  -H "Cookie: your-session-cookie"
```

### Restart Worker

```bash
# Stop first
curl -X DELETE http://localhost:3000/api/admin/agent-worker

# Then start
curl -X POST http://localhost:3000/api/admin/agent-worker
```

---

## Complete Workflow Example

### 1. Start Worker

```bash
npm run worker:start
```

### 2. Create Job

```bash
JOB_ID=$(curl -X POST http://localhost:3000/api/agent-jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "jobType": "code-generation",
    "taskDescription": "Generate auth code",
    "inputData": {"files": [{"path": "lib/auth.ts", "content": "..."}]}
  }' | jq -r '.job.id')

echo "Job ID: $JOB_ID"
```

### 3. Monitor Job

```bash
# Check job status
curl http://localhost:3000/api/agent-jobs/$JOB_ID \
  -H "Cookie: your-session-cookie" | jq '.job.status'

# Wait for checkpoint
sleep 5

# Get checkpoints
CHECKPOINT_ID=$(curl http://localhost:3000/api/agent-jobs/$JOB_ID/checkpoints \
  -H "Cookie: your-session-cookie" | jq -r '.checkpoints[0].id')

echo "Checkpoint ID: $CHECKPOINT_ID"
```

### 4. Approve Checkpoint

```bash
curl -X POST http://localhost:3000/api/admin/agent-checkpoints/$CHECKPOINT_ID \
  -H "Cookie: your-session-cookie"
```

### 5. Verify Completion

```bash
# Check final status
curl http://localhost:3000/api/agent-jobs/$JOB_ID \
  -H "Cookie: your-session-cookie" | jq '.job.status'
# Should be "COMPLETED"
```

### 6. Check Metrics

```bash
curl http://localhost:3000/api/metrics | grep agent_jobs_total
```

---

## Troubleshooting

### Worker Not Processing Jobs

1. **Check worker is running:**

   ```bash
   curl http://localhost:3000/api/admin/agent-worker
   ```

2. **Check for blocking checkpoints:**

   ```bash
   curl http://localhost:3000/api/admin/agent-checkpoints
   ```

3. **Check job status:**
   ```bash
   curl http://localhost:3000/api/agent-jobs?status=PENDING
   ```

### Jobs Stuck in PENDING

- Verify worker is running
- Check for blocking checkpoints
- Review job logs: `GET /api/agent-jobs/[jobId]`
- Check worker logs for errors

### Checkpoints Not Appearing

- Verify job created checkpoint
- Check checkpoint status is PENDING
- Ensure admin access to `/admin/agent-checkpoints`
- Check checkpoint expiration (24h default)

---

## Quick Reference

| Action           | Endpoint                            | Method |
| ---------------- | ----------------------------------- | ------ |
| Create Job       | `/api/agent-jobs`                   | POST   |
| List Jobs        | `/api/agent-jobs`                   | GET    |
| Job Details      | `/api/agent-jobs/[id]`              | GET    |
| List Checkpoints | `/api/admin/agent-checkpoints`      | GET    |
| Approve          | `/api/admin/agent-checkpoints/[id]` | POST   |
| Reject           | `/api/admin/agent-checkpoints/[id]` | DELETE |
| Worker Status    | `/api/admin/agent-worker`           | GET    |
| Start Worker     | `/api/admin/agent-worker`           | POST   |
| Stop Worker      | `/api/admin/agent-worker`           | DELETE |
| Metrics          | `/api/metrics`                      | GET    |

---

**Ready to use!** Once your database is connected, follow these steps to start processing jobs with checkpoint approval workflows.

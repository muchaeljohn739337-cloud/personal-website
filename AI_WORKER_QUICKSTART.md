# 🚀 AI Worker Management System - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Admin account with JWT token
- Backend server running on port 4000
- Frontend running on port 3000

---

## Step 1: Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

**Expected Output:**

```
✅ Database connection successful
✅ AI Worker Registry initialized with all workers
🚀 Server is running on port 4000
   Environment: development
   Frontend URL: http://localhost:3000
```

---

## Step 2: Verify AI Workers Registered

Check server logs for:

```
✅ AI Worker Registry initialized with all workers
```

This confirms all 11 workers are registered:

- guardian-ai
- surveillance-ai
- prisma-solver
- auto-remember
- multi-brain-agent
- typescript-fixer
- task-orchestrator
- mapper-ai
- notification-service
- auto-precision
- governance-ai

---

## Step 3: Get Admin Token

### Option 1: Login via API

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@advanciapayledger.com",
    "password": "your_admin_password"
  }'
```

### Option 2: Use Existing Token

Check `localStorage.getItem("token")` in browser console after logging in as admin.

### Save Token

```bash
# Linux/Mac
export ADMIN_TOKEN="your_jwt_token_here"

# Windows PowerShell
$env:ADMIN_TOKEN = "your_jwt_token_here"
```

---

## Step 4: Test API Endpoints

### 4.1 System Status

```bash
curl http://localhost:4000/api/ai-workers/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Expected Response:**

```json
{
  "systemHealth": {
    "totalWorkers": 11,
    "operational": 11,
    "degraded": 0,
    "failed": 0,
    "healthScore": 100,
    "color": "blue"
  },
  "workers": [...],
  "loadBalancer": {
    "activeUsers": 0,
    "activeRequests": 0,
    "queuedRequests": 0,
    "maxConcurrentRequests": 100,
    "utilizationPercent": 0,
    "preventShutdown": false
  }
}
```

### 4.2 Specific Worker Details

```bash
curl http://localhost:4000/api/ai-workers/guardian-ai \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 4.3 System Metrics

```bash
curl http://localhost:4000/api/ai-workers/metrics/system \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 4.4 Filter by Category

```bash
# Security workers
curl http://localhost:4000/api/ai-workers/categories/security \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Database workers
curl http://localhost:4000/api/ai-workers/categories/database \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

---

## Step 5: Test TypeScript Error Fixer

### 5.1 Check Status

```bash
curl http://localhost:4000/api/ai-workers/typescript-fixer/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 5.2 Run Fixer

```bash
curl -X POST http://localhost:4000/api/ai-workers/typescript-fixer/run \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Expected Response:**

```json
{
  "success": true,
  "result": {
    "totalErrors": 0,
    "fixesApplied": 0,
    "errors": []
  },
  "message": "TypeScript error scan completed"
}
```

---

## Step 6: Test Load Balancer

### 6.1 Set Active Users Below Threshold

```bash
curl -X PUT http://localhost:4000/api/ai-workers/load-balancer/active-users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"activeUsers": 15}' | jq
```

**Expected:** `preventShutdown: false`

### 6.2 Set Active Users Above Threshold

```bash
curl -X PUT http://localhost:4000/api/ai-workers/load-balancer/active-users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"activeUsers": 25}' | jq
```

**Expected:** `preventShutdown: true`

### 6.3 Verify Load Balancer Status

```bash
curl http://localhost:4000/api/ai-workers/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.loadBalancer'
```

---

## Step 7: Test Worker Restart

```bash
# Restart guardian-ai
curl -X POST http://localhost:4000/api/ai-workers/guardian-ai/restart \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Check status after restart
curl http://localhost:4000/api/ai-workers/guardian-ai \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.health.status'
```

---

## Step 8: Test Frontend Dashboard

### 8.1 Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 8.2 Access Dashboard

```
URL: http://localhost:3000/admin/ai-workers
```

### 8.3 Login as Admin

1. Navigate to login page
2. Enter admin credentials
3. Get redirected to dashboard

### 8.4 Verify Dashboard Features

✅ **System Health Overview**

- Large blue/yellow/red circle
- Health score percentage
- Worker counts

✅ **Load Balancer Stats**

- Active users
- Active requests
- Queued requests
- Utilization percentage

✅ **Worker Grid**

- 11 worker cards
- Color-coded status
- Real-time metrics
- Restart buttons

✅ **Recent Alerts**

- Alert feed (if any)

✅ **Category Filter**

- All/Security/Database/etc.

---

## Step 9: Test Real-time Updates

### 9.1 Open Browser Console

```javascript
// Connect to Socket.IO
const socket = io("http://localhost:4000", {
  transports: ["websocket"],
  auth: {
    token: localStorage.getItem("token"),
  },
});

// Listen for worker status changes
socket.on("ai-worker:status-change", (data) => {
  console.log("Worker status changed:", data);
});

// Listen for alerts
socket.on("ai-worker:alert", (alert) => {
  console.log("Alert:", alert);
});
```

### 9.2 Trigger Status Change

```bash
# Restart a worker to trigger status change event
curl -X POST http://localhost:4000/api/ai-workers/prisma-solver/restart \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected:** Console log showing status change event

---

## Step 10: Test External Worker Heartbeat

```bash
# Send heartbeat without authentication
curl -X POST http://localhost:4000/api/ai-workers/guardian-ai/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": {
      "memoryUsage": 512,
      "cpuUsage": 45,
      "activeConnections": 12
    }
  }' | jq
```

---

## Common Issues & Solutions

### Issue 1: "Authentication token required"

**Solution:**

```bash
# Verify token is set
echo $ADMIN_TOKEN

# Re-login if expired
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@...", "password": "..."}'
```

### Issue 2: "Worker not found"

**Solution:**

```bash
# Check registered workers
curl http://localhost:4000/api/ai-workers/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.workers[].id'
```

### Issue 3: Socket.IO not connecting

**Solution:**

1. Check CORS settings in `backend/src/config/index.ts`
2. Verify frontend URL matches `allowedOrigins`
3. Check browser console for errors

### Issue 4: Dashboard shows "Loading..."

**Solution:**

1. Verify backend is running on port 4000
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Verify admin authentication token

### Issue 5: TypeScript fixer rate limited

**Solution:**

```bash
# Wait 60 seconds between runs (10 max per minute)
sleep 60
curl -X POST http://localhost:4000/api/ai-workers/typescript-fixer/run \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Verification Checklist

- [ ] Backend server starts successfully
- [ ] All 11 AI workers registered
- [ ] Socket.IO initialized
- [ ] API endpoints respond with 200 OK
- [ ] System health shows "blue" color
- [ ] Load balancer threshold works (20 users)
- [ ] TypeScript fixer runs without errors
- [ ] Frontend dashboard loads
- [ ] Worker cards display correctly
- [ ] Real-time updates work via Socket.IO
- [ ] Manual restart works
- [ ] Category filter works
- [ ] Alerts appear in feed
- [ ] External heartbeat accepted

---

## Next Steps

1. **Read Full Documentation**: [AI_WORKER_MANAGEMENT_SYSTEM.md](AI_WORKER_MANAGEMENT_SYSTEM.md)
2. **Configure Workers**: Edit `backend/src/ai/aiWorkerRegistry.ts`
3. **Customize Dashboard**: Edit `frontend/src/app/admin/ai-workers/page.tsx`
4. **Add New Workers**: Follow contributing guide in main README
5. **Deploy to Production**: Follow deployment instructions

---

## Support

- **Documentation**: `AI_WORKER_MANAGEMENT_SYSTEM.md`
- **Backend README**: `backend/README.md`
- **Frontend README**: `frontend/README.md`
- **Issues**: Check Guardian AI logs at `/api/admin/ai`

---

**Ready to go! 🚀** Your AI Worker Management System is now fully operational.

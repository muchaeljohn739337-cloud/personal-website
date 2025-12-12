# 🤖 AI Worker Management System

## Overview

Comprehensive AI orchestration system with **real-time monitoring**, **auto-healing**, **load balancing**, and **visual dashboard** for managing 11+ AI workers across 6 categories.

---

## 🎯 Key Features

### ✅ Implemented Features

1. **TypeScript Error Auto-Fixer**

   - Automatically detects TypeScript compilation errors
   - Pattern matching for 7 common error codes
   - Auto-fixes missing modules with `npm install`
   - Rate limited: 10 fixes per minute

2. **AI Worker Registry**

   - Centralized tracking of all 11 AI workers
   - Health monitoring with heartbeat (30s interval, 60s timeout)
   - Circuit breaker pattern (5 failure threshold)
   - Auto-restart with exponential backoff (max 3 attempts)
   - System health scoring (blue ≥90%, yellow ≥70%, red <70%)

3. **Load Balancer**

   - Prevents shutdown when 20+ active users
   - Request queue with priority sorting (max 100 concurrent)
   - Graceful degradation (pauses non-critical workers under load)
   - Critical workers never pause: guardian-ai, surveillance-ai, prisma-solver

4. **Real-time Dashboard**

   - Color-coded health indicators (blue/yellow/red)
   - Live status updates via Socket.IO
   - Admin alerts for malfunctions
   - Per-worker restart controls
   - Load balancer statistics
   - Recent alerts feed

5. **REST API**
   - 9 endpoints for worker management
   - Admin authentication required
   - Real-time event broadcasting
   - Worker-specific metrics

---

## 📦 Architecture

### Backend Components

```
backend/src/
├── ai/
│   ├── typescriptErrorFixer.ts      # Auto-fixes TypeScript errors
│   ├── aiWorkerRegistry.ts          # Central worker tracking & health
│   ├── aiLoadBalancer.ts            # Load management & queue
│   └── [other AI workers]           # 11+ AI workers
├── routes/
│   └── aiWorkers.ts                 # REST API + Socket.IO
└── index.ts                         # Server startup + integration
```

### Frontend Components

```
frontend/src/app/
└── admin/
    └── ai-workers/
        └── page.tsx                 # Visual dashboard
```

---

## 🔧 API Endpoints

### System Overview

```http
GET /api/ai-workers/status
Authorization: Bearer <admin_token>

Response:
{
  "systemHealth": {
    "totalWorkers": 11,
    "operational": 10,
    "degraded": 1,
    "failed": 0,
    "healthScore": 95.5,
    "color": "blue"
  },
  "workers": [...],
  "loadBalancer": {
    "activeUsers": 25,
    "activeRequests": 45,
    "queuedRequests": 2,
    "maxConcurrentRequests": 100,
    "utilizationPercent": 45.0,
    "preventShutdown": true
  }
}
```

### Specific Worker Details

```http
GET /api/ai-workers/:id
Authorization: Bearer <admin_token>

Example: GET /api/ai-workers/guardian-ai
```

### Manual Worker Restart

```http
POST /api/ai-workers/:id/restart
Authorization: Bearer <admin_token>

Example: POST /api/ai-workers/prisma-solver/restart
```

### System Metrics

```http
GET /api/ai-workers/metrics/system
Authorization: Bearer <admin_token>

Response:
{
  "totalRequests": 15847,
  "totalSuccessful": 15720,
  "totalFailed": 127,
  "overallSuccessRate": 99.2,
  "avgResponseTime": 142
}
```

### Filter by Category

```http
GET /api/ai-workers/categories/:category
Authorization: Bearer <admin_token>

Categories:
- security
- database
- code-generation
- monitoring
- communication
- optimization
```

### TypeScript Error Fixer

```http
POST /api/ai-workers/typescript-fixer/run
Authorization: Bearer <admin_token>

Response:
{
  "result": {
    "totalErrors": 3,
    "fixesApplied": 2,
    "errors": [...]
  }
}

GET /api/ai-workers/typescript-fixer/status
```

### Load Balancer Control

```http
PUT /api/ai-workers/load-balancer/active-users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "activeUsers": 25
}
```

### External Worker Heartbeat

```http
POST /api/ai-workers/:id/heartbeat
Content-Type: application/json

{
  "metrics": {
    "memoryUsage": 512,
    "cpuUsage": 45,
    "activeConnections": 12
  }
}
```

---

## 📡 Socket.IO Events

### Client → Server

```javascript
// Join admin room
socket.emit("join-room", userId);
```

### Server → Client

```javascript
// Worker status changed
socket.on("ai-worker:status-change", (data) => {
  // data: { workerId, status, worker: {...} }
});

// Admin alert
socket.on("ai-worker:alert", (alert) => {
  // alert: { severity, message, workerId?, timestamp }
});
```

---

## 🎨 Frontend Dashboard

### Features

1. **System Health Overview**

   - Large circular indicator (blue/yellow/red)
   - Health score percentage
   - Worker counts (operational/degraded/failed)

2. **Load Balancer Stats**

   - Active users with threshold indicator
   - Active requests vs max concurrent
   - Queued requests
   - System utilization percentage

3. **Worker Grid**

   - Color-coded cards per worker
   - Category icons
   - Status badges
   - Real-time metrics (requests, success rate, response time)
   - Rate limit usage
   - Circuit breaker state
   - Restart button
   - Logs button

4. **Recent Alerts**

   - Severity-based coloring (info/warning/critical)
   - Timestamp display
   - Auto-scroll to latest

5. **Category Filter**
   - Filter workers by category
   - All/Security/Database/Code-Gen/Monitoring/Communication/Optimization

### Access

```
URL: http://localhost:3000/admin/ai-workers
Auth: Admin token required
```

---

## 🔐 Security

### Authentication

All endpoints require:

1. JWT token in `Authorization: Bearer <token>` header
2. Admin role (`role: "ADMIN"`)

Exception:

- `POST /api/ai-workers/:id/heartbeat` - No auth (for external workers)

### Rate Limiting

Global rate limit: 300 requests/minute per IP

Per-worker rate limits:

- guardian-ai: 200/min
- surveillance-ai: 150/min
- prisma-solver: 50/min
- auto-remember: 100/min
- multi-brain-agent: 30/min
- typescript-fixer: 10/min
- task-orchestrator: 500/min
- mapper-ai: 100/min
- notification-service: 300/min
- auto-precision: 200/min
- governance-ai: 100/min

---

## 🛠️ Configuration

### Worker Registration

Edit `backend/src/ai/aiWorkerRegistry.ts`:

```typescript
export function registerAllWorkers() {
  aiWorkerRegistry.registerWorker({
    id: "my-new-worker",
    name: "My New Worker",
    description: "Description",
    category: "optimization",
    health: {
      status: "operational",
      lastHeartbeat: new Date(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
    },
    rateLimit: {
      maxRequestsPerMinute: 100,
      currentRequests: 0,
    },
    circuitBreaker: {
      state: "closed",
      currentFailures: 0,
      failureThreshold: 5,
    },
    metrics: {
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0,
    },
  });
}
```

### Load Balancer Tuning

Edit `backend/src/ai/aiLoadBalancer.ts`:

```typescript
private config = {
  minActiveUsers: 20,          // Shutdown protection threshold
  maxConcurrentRequests: 100,  // Max parallel requests
  queueTimeout: 30000,         // Queue timeout (ms)
  enableGracefulDegradation: true,
};
```

### TypeScript Fixer

Edit `backend/src/ai/typescriptErrorFixer.ts`:

```typescript
private rateLimit = {
  maxPerMinute: 10,    // Max fixes per minute
  windowMs: 60000,     // Time window
  requests: [],
};
```

---

## 📊 Worker Categories

### 1. **Security** 🛡️

- guardian-ai (200/min)
- surveillance-ai (150/min)
- governance-ai (100/min)

### 2. **Database** 🗄️

- prisma-solver (50/min)
- auto-remember (100/min)

### 3. **Code Generation** 🤖

- multi-brain-agent (30/min)
- typescript-fixer (10/min)

### 4. **Monitoring** 👁️

- task-orchestrator (500/min)
- mapper-ai (100/min)

### 5. **Communication** 📢

- notification-service (300/min)

### 6. **Optimization** ⚡

- auto-precision (200/min)

---

## 🚀 Deployment

### Local Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

### Environment Variables

```env
# Backend (.env)
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=your_jwt_secret
NODE_ENV=production
PORT=4000

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 🧪 Testing

### Manual Testing

```bash
# Get admin token
TOKEN="your_admin_jwt_token"

# Check system status
curl http://localhost:4000/api/ai-workers/status \
  -H "Authorization: Bearer $TOKEN"

# Restart a worker
curl -X POST http://localhost:4000/api/ai-workers/guardian-ai/restart \
  -H "Authorization: Bearer $TOKEN"

# Run TypeScript fixer
curl -X POST http://localhost:4000/api/ai-workers/typescript-fixer/run \
  -H "Authorization: Bearer $TOKEN"
```

### Load Testing

```bash
# Simulate 25 active users
curl -X PUT http://localhost:4000/api/ai-workers/load-balancer/active-users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"activeUsers": 25}'

# Check if shutdown is prevented
curl http://localhost:4000/api/ai-workers/status \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.loadBalancer.preventShutdown'
```

---

## 📈 Monitoring

### Health Scoring

- **Blue (≥90%)**: All systems operational
- **Yellow (≥70%)**: Some degraded workers
- **Red (<70%)**: Critical failures

### Circuit Breaker States

- **Closed**: Normal operation
- **Half-Open**: Testing recovery
- **Open**: Too many failures, blocking requests

### Auto-Restart

Max 3 attempts with exponential backoff:

- Attempt 1: 1 second
- Attempt 2: 2 seconds
- Attempt 3: 4 seconds

---

## 🐛 Troubleshooting

### Worker Not Responding

1. Check heartbeat timeout (60s)
2. View worker logs in dashboard
3. Manual restart via API or dashboard
4. Check circuit breaker state

### High Load

1. Check active user count
2. Verify graceful degradation enabled
3. Review queue size and timeout
4. Consider increasing `maxConcurrentRequests`

### TypeScript Fixer Failing

1. Check rate limit (10/min)
2. Verify npm install permissions
3. Review error patterns in logs
4. Check Guardian AI audit logs

### Socket.IO Connection Issues

1. Verify CORS settings match frontend URL
2. Check JWT token validity
3. Ensure admin role assigned
4. Review Socket.IO transports

---

## 🔮 Future Enhancements

### Planned Features

- [ ] Interactive network diagram showing worker relationships
- [ ] Per-worker FAQ documentation pages
- [ ] Troubleshooting wizard for common issues
- [ ] Performance tuning recommendations
- [ ] Historical metrics and charts
- [ ] Alerting rules configuration
- [ ] Multi-tenancy isolation
- [ ] Disaster recovery snapshots
- [ ] AI training feedback loop
- [ ] Monetization strategy (usage-based billing)

### Advanced Monitoring

- [ ] APM integration (Datadog, New Relic)
- [ ] Custom metric dashboards
- [ ] Anomaly detection
- [ ] Predictive scaling
- [ ] Cost optimization analytics

---

## 📚 Documentation

### Internal

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Copilot Instructions](.github/copilot-instructions.md)
- [Deployment Guide](AZURE_DEPLOYMENT_CHECKLIST.md)

### External Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

---

## 🤝 Contributing

### Adding New Workers

1. Create worker implementation in `backend/src/ai/`
2. Register in `aiWorkerRegistry.ts` → `registerAllWorkers()`
3. Add category icon in frontend `page.tsx` → `getCategoryIcon()`
4. Update this README with worker details

### Adding New Metrics

1. Update `AIWorker` interface in `aiWorkerRegistry.ts`
2. Update frontend `AIWorker` interface in `page.tsx`
3. Add UI display in worker cards

### Adding New Endpoints

1. Add route in `backend/src/routes/aiWorkers.ts`
2. Add authentication middleware
3. Add Guardian AI logging
4. Update API documentation section above

---

## 📞 Support

For issues or questions:

- Backend logs: `backend/logs/`
- Guardian AI audit: Check `/api/admin/ai` endpoint
- System health: Check `/api/ai-workers/status` endpoint
- Support email: `support@advanciapayledger.com`

---

## 📄 License

Proprietary - Advancia Pay Ledger © 2025

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Authors**: Advancia Development Team

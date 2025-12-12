# 🤖 AI Core System - Setup Checklist

## Pre-Setup Requirements

- [ ] Node.js installed (v16+)
- [ ] PostgreSQL database running
- [ ] Access to OpenAI or Anthropic API

## Installation Steps

### 1. Install Dependencies

```bash
npm install bullmq node-cron
```

- [ ] Dependencies installed successfully

### 2. Start Redis

```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

- [ ] Redis container running
- [ ] Test with: `redis-cli ping` (should return "PONG")

### 3. Configure Environment

Add to your `.env` file:

```env
# AI Core System
AI_ENABLED=true
AI_PROVIDER=openai

# OpenAI (GPT-4)
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# OR Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (if not already configured)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
```

- [ ] Environment variables added
- [ ] API keys valid and working
- [ ] Email settings configured (optional)

### 4. Database Setup

```bash
npx prisma generate
npx prisma migrate dev --name add-ai-core
```

- [ ] Prisma client generated
- [ ] Migrations applied successfully
- [ ] Database tables created

### 5. Start the Server

```bash
npm run dev
```

- [ ] Server starts without errors
- [ ] See "✅ AI Core (Half Brain Cell) system initialized" in logs
- [ ] All 5 components initialized (Brain, TaskQueue, WorkflowEngine, Monitoring, Scheduler)

## Verification

### Test System Health

```bash
curl http://localhost:5000/api/ai-workflows/monitoring/health \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

- [ ] Returns healthy status
- [ ] All components listed

### Test Dashboard

```bash
curl http://localhost:5000/api/ai-workflows/dashboard/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

- [ ] Returns statistics
- [ ] Shows workflows and tasks count

### Run Test Script

```bash
$env:TEST_ADMIN_TOKEN = "YOUR_ADMIN_JWT"
.\test-ai-core.ps1
```

- [ ] All 6 tests pass
- [ ] No errors in output

## Post-Setup Tasks

### Create Your First Task

```bash
POST /api/ai-workflows/tasks
{
  "type": "monitoring",
  "data": {
    "type": "error-detection",
    "timeRange": "1h"
  },
  "priority": 7,
  "requiresApproval": false
}
```

- [ ] Task created successfully
- [ ] Task executes and completes

### Schedule a Daily Report

```bash
POST /api/ai-workflows/workflows
{
  "name": "Daily Performance Report",
  "type": "report",
  "config": {
    "reportType": "performance",
    "recipients": ["admin@yourdomain.com"]
  },
  "trigger": {
    "type": "scheduled",
    "schedule": "0 8 * * *"
  },
  "requiresApproval": false
}
```

- [ ] Workflow created
- [ ] Workflow scheduled (check logs)

### Verify Automatic Monitoring

Wait 15-30 minutes, then check:

```bash
GET /api/ai-workflows/monitoring/alerts
GET /api/ai-workflows/tasks?type=monitoring
```

- [ ] Monitoring tasks are running automatically
- [ ] Alerts are being generated if issues found

## Optional Enhancements

### Frontend Integration

- [ ] Add AI workflows dashboard to admin panel
- [ ] Display alerts in real-time
- [ ] Show pending approvals
- [ ] Task history view

### Custom Handlers

- [ ] Create custom task handler for your use case
- [ ] Register in `src/ai-core/handlers/index.ts`
- [ ] Test custom handler

### Additional Workflows

- [ ] Welcome email for new users
- [ ] Weekly business report
- [ ] Automated code review on commits
- [ ] Daily security scan

### Production Readiness

- [ ] Set `AI_AUTO_APPROVE=false` (already default)
- [ ] Configure Redis persistence
- [ ] Set up Redis Cluster (for HA)
- [ ] Monitor AI API costs
- [ ] Set up log aggregation
- [ ] Configure alert notifications (email/Slack)

## Troubleshooting

### Redis Issues

- [ ] Check Redis is running: `redis-cli ping`
- [ ] Verify REDIS_HOST and REDIS_PORT
- [ ] Check firewall rules

### AI API Issues

- [ ] Verify API key is correct
- [ ] Check API quotas/billing
- [ ] Try alternative provider (OpenAI ↔ Anthropic)
- [ ] Check network connectivity

### Tasks Not Executing

- [ ] Check Redis connection
- [ ] Verify AI_ENABLED=true
- [ ] Check task queue: `GET /api/ai-workflows/tasks`
- [ ] Review logs for errors

### Database Issues

- [ ] Run `npx prisma generate`
- [ ] Check DATABASE_URL is correct
- [ ] Verify migrations applied
- [ ] Check database permissions

## Success Criteria

✅ All setup steps completed ✅ Server starts without errors ✅ Health check returns healthy ✅ Test script passes all
tests ✅ Automatic monitoring running ✅ Can create and execute tasks ✅ Can schedule workflows ✅ Alerts are being
generated

## 🎉 Ready

Once all items are checked, your AI Core "Half Brain Cell" system is fully operational!

## 📚 Next Steps

1. Read [AI_CORE_README.md](./AI_CORE_README.md) for quick reference
2. Review [AI_CORE_SETUP.md](./AI_CORE_SETUP.md) for detailed documentation
3. Create custom workflows for your specific needs
4. Integrate with your frontend dashboard
5. Monitor system performance and costs

---

**Need Help?**

- Check logs: Server console output
- Review tasks: `GET /api/ai-workflows/tasks/:id`
- Check health: `GET /api/ai-workflows/monitoring/health`
- Read docs: AI_CORE_SETUP.md

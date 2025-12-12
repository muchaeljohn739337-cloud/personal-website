# 🤖 AI Core - Half Brain Cell System

A semi-autonomous AI assistant integrated into your SaaS platform with human-in-the-loop approval.

## ⚡ Quick Start

```bash
# 1. Run setup script
.\setup-ai-core.ps1

# 2. Start Redis (if not running)
docker run -d --name redis -p 6379:6379 redis:alpine

# 3. Configure .env
AI_ENABLED=true
OPENAI_API_KEY=your_key_here
REDIS_HOST=localhost

# 4. Start server
npm run dev
```

## 🎯 What It Does

- **✅ Task Automation** - Emails, reports, code fixes
- **✅ Monitoring** - Errors, performance, security
- **✅ AI Workflows** - Custom automation with approval
- **✅ Code Intelligence** - Linting, review, generation

## 📁 File Structure

```
src/ai-core/
├── index.ts              # Main AI Core class
├── brain.ts              # GPT-4/Claude integration
├── task-queue.ts         # BullMQ task management
├── workflow-engine.ts    # Workflow orchestration
├── monitoring.ts         # System monitoring
├── scheduler.ts          # Cron job scheduling
└── handlers/
    ├── email-handler.ts      # Email automation
    ├── code-handler.ts       # Code intelligence
    ├── monitoring-handler.ts # System monitoring
    └── report-handler.ts     # Report generation

src/routes/
└── ai-workflows.ts       # REST API endpoints
```

## 🔑 Key Features

### 1. Human-in-the-Loop

```typescript
{
  "requiresApproval": true  // Waits for admin approval
}
```

### 2. Auto-Scheduling

- Error detection: Every 15 minutes
- Performance check: Every 30 minutes
- Security scan: Every hour
- Usage analysis: Every 6 hours

### 3. AI-Powered

- GPT-4 for reasoning & code
- Claude for complex analysis
- Auto-switching based on task type

### 4. Task Handlers

- **Email**: AI-generated emails
- **Code**: Linting, review, fixes
- **Monitoring**: Error/perf/security
- **Report**: Daily/weekly reports

## 📊 API Examples

### Create Email Task

```bash
POST /api/ai-workflows/tasks
{
  "type": "email",
  "data": {
    "to": "user@example.com",
    "aiGenerate": true,
    "prompt": "Welcome email for new user"
  }
}
```

### Schedule Report

```bash
POST /api/ai-workflows/workflows
{
  "name": "Daily Report",
  "type": "report",
  "trigger": {
    "type": "scheduled",
    "schedule": "0 8 * * *"
  }
}
```

### Code Review

```bash
POST /api/ai-workflows/tasks
{
  "type": "code",
  "data": {
    "type": "review",
    "code": "...",
    "language": "typescript"
  }
}
```

## 🔍 Monitoring

```bash
# System health
GET /api/ai-workflows/monitoring/health

# Dashboard stats
GET /api/ai-workflows/dashboard/stats

# Active alerts
GET /api/ai-workflows/monitoring/alerts

# Metrics
GET /api/ai-workflows/monitoring/metrics?timeRange=24h
```

## ⚙️ Configuration

### Required Environment Variables

```env
AI_ENABLED=true
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Optional Settings

```env
AI_AUTO_APPROVE=false
AI_MAX_RETRIES=3
AI_CONCURRENT_TASKS=5
AI_MONITORING_ENABLED=true
```

## 🗄️ Database Models

```prisma
AIWorkflow     # Workflow definitions
AITask         # Individual tasks
AITaskLog      # Task execution logs
AIAlert        # System alerts
AISuggestion   # AI-generated suggestions
AIMetrics      # Performance metrics
```

## 🧪 Testing

```bash
# Set admin token
$env:TEST_ADMIN_TOKEN = "your_admin_jwt"

# Run tests
.\test-ai-core.ps1
```

## 🚀 Production Tips

1. **Security**: Keep `AI_AUTO_APPROVE=false`
2. **Scaling**: Increase `AI_CONCURRENT_TASKS`
3. **Monitoring**: Set up alerts for CRITICAL severity
4. **Costs**: Monitor AI API usage
5. **Redis**: Use Redis Cluster for HA

## 📚 Full Documentation

See [AI_CORE_SETUP.md](./AI_CORE_SETUP.md) for complete guide:

- Detailed API reference
- Custom handler creation
- Workflow patterns
- Troubleshooting
- Best practices

## 🔧 Troubleshooting

**Redis not connecting?**

```bash
redis-cli ping  # Should return PONG
```

**Tasks not executing?**

- Check Redis is running
- Verify `AI_ENABLED=true`
- Check logs for errors

**No alerts appearing?**

- Wait 15+ minutes for first monitoring cycle
- Check `AI_MONITORING_ENABLED=true`

## 🎯 Use Cases

1. **Welcome Emails** - AI-generated for new users
2. **Error Monitoring** - Auto-detect & alert
3. **Code Review** - AI reviews PRs
4. **Daily Reports** - Automated insights
5. **Performance Tracking** - Real-time metrics
6. **Security Scanning** - Suspicious activity detection

## 🤝 Integration

The AI Core integrates seamlessly with your existing:

- ✅ Authentication system
- ✅ Admin dashboard
- ✅ Email service
- ✅ Database (Prisma)
- ✅ Monitoring (Sentry)

## 🆘 Support

1. Check system health: `GET /api/ai-workflows/monitoring/health`
2. Review logs: `GET /api/ai-workflows/tasks/:id`
3. Check alerts: `GET /api/ai-workflows/monitoring/alerts`
4. Read full docs: [AI_CORE_SETUP.md](./AI_CORE_SETUP.md)

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: December 2025

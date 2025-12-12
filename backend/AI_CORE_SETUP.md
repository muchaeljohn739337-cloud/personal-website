# AI Core - Half Brain Cell System Setup Guide

## Overview

The AI Core system provides a "half brain cell" AI assistant that's:

- **Partially autonomous** - performs routine tasks and suggests actions
- **Human-in-the-loop** - requires approval for critical operations
- **Lightweight** - lower risk of errors or abuse
- **Integrated** - deeply integrated into your SaaS workflow

## Features

✅ **Task Automation**

- Email generation and sending
- Report generation (daily/weekly/monthly)
- Code analysis and suggestions
- System monitoring and alerts

✅ **Monitoring & Notifications**

- Error detection and analysis
- Performance monitoring
- Security scanning
- Usage analytics

✅ **AI-Powered Workflows**

- Custom workflow creation
- Scheduled task execution
- Event-driven automation
- Human approval system

✅ **Code Intelligence**

- Code linting and analysis
- Auto-fix suggestions
- Code review and refactoring
- Code generation

## Installation

### 1. Install Dependencies

```bash
npm install bullmq node-cron
```

All other dependencies (OpenAI, Anthropic, Redis, nodemailer) are already installed.

### 2. Configure Environment Variables

Copy `.env.ai-core.example` to your `.env` file or create new entries:

```bash
# AI Core Configuration
AI_ENABLED=true
AI_PROVIDER=openai  # or anthropic

# OpenAI (GPT-4)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# Redis (for task queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (if not already configured)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Database Migration

The Prisma schema has been extended with AI Core models. Run:

```bash
npx prisma generate
npx prisma migrate dev --name add-ai-core
```

### 4. Start Redis

**Docker:**

```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

**Or native:**

```bash
redis-server
```

### 5. Start the Server

```bash
npm run dev
```

You should see:

```
✅ AI Core (Half Brain Cell) system initialized
  ✓ Initializing AI Brain...
  ✓ Initializing Task Queue...
  ✓ Initializing Workflow Engine...
  ✓ Initializing Monitoring...
  ✓ Initializing Scheduler...
```

## API Endpoints

All endpoints are protected and require admin authentication.

### Workflows

- `GET /api/ai-workflows/workflows` - List all workflows
- `GET /api/ai-workflows/workflows/:id` - Get workflow details
- `POST /api/ai-workflows/workflows` - Create workflow
- `POST /api/ai-workflows/workflows/:id/execute` - Execute workflow
- `POST /api/ai-workflows/workflows/:id/approve` - Approve/reject workflow

### Tasks

- `GET /api/ai-workflows/tasks` - List all tasks
- `GET /api/ai-workflows/tasks/:id` - Get task details
- `POST /api/ai-workflows/tasks` - Create task
- `POST /api/ai-workflows/tasks/:id/retry` - Retry failed task

### Monitoring

- `GET /api/ai-workflows/monitoring/metrics` - Get system metrics
- `GET /api/ai-workflows/monitoring/health` - System health check
- `GET /api/ai-workflows/monitoring/alerts` - Active alerts
- `POST /api/ai-workflows/monitoring/alerts/:id/resolve` - Resolve alert

### Dashboard

- `GET /api/ai-workflows/dashboard/stats` - Dashboard statistics

## Usage Examples

### 1. Create an Email Workflow

```bash
POST /api/ai-workflows/tasks
{
  "type": "email",
  "data": {
    "to": "user@example.com",
    "aiGenerate": true,
    "prompt": "Generate a welcome email for a new user"
  },
  "priority": 5,
  "requiresApproval": true
}
```

### 2. Schedule Daily Performance Report

```bash
POST /api/ai-workflows/workflows
{
  "name": "Daily Performance Report",
  "type": "report",
  "config": {
    "reportType": "performance",
    "recipients": ["admin@example.com"]
  },
  "trigger": {
    "type": "scheduled",
    "schedule": "0 8 * * *"
  },
  "requiresApproval": false
}
```

### 3. AI Code Review

```bash
POST /api/ai-workflows/tasks
{
  "type": "code",
  "data": {
    "type": "review",
    "code": "... your code here ...",
    "language": "typescript"
  },
  "requiresApproval": false
}
```

### 4. Monitor Errors

This runs automatically every 15 minutes, but you can trigger manually:

```bash
POST /api/ai-workflows/tasks
{
  "type": "monitoring",
  "data": {
    "type": "error-detection",
    "timeRange": "1h"
  },
  "requiresApproval": false
}
```

## Automated Monitoring

The system automatically runs these tasks:

| Task              | Frequency     | Description                         |
| ----------------- | ------------- | ----------------------------------- |
| Error Detection   | Every 15 min  | Scans for errors and creates alerts |
| Performance Check | Every 30 min  | Monitors task execution times       |
| Security Scan     | Every 1 hour  | Checks for suspicious activity      |
| Usage Analysis    | Every 6 hours | Analyzes system usage patterns      |
| Failed Task Retry | Every 1 hour  | Retries failed tasks                |

## Human-in-the-Loop Approval

Tasks marked with `requiresApproval: true` will:

1. Be created with status `PENDING_APPROVAL`
2. Generate a notification/alert
3. Wait for admin approval
4. Execute only after approval

To approve:

```bash
POST /api/ai-workflows/workflows/:id/approve
{
  "approved": true,
  "feedback": "Looks good!"
}
```

## Task Handlers

### Email Handler

- AI-generated emails
- Template-based emails
- Bulk sending
- Delivery tracking

### Code Handler

- Linting and analysis
- Auto-fix suggestions
- Code review
- Code generation
- Refactoring suggestions

### Monitoring Handler

- Error detection
- Performance analysis
- Security scanning
- Usage analytics

### Report Handler

- Daily/weekly/monthly reports
- Multiple report types
- AI-generated summaries
- HTML/PDF/JSON formats

## Customization

### Create Custom Task Handler

```typescript
// src/ai-core/handlers/custom-handler.ts
export class CustomHandler {
  async handle(taskData: any): Promise<any> {
    // Your custom logic here
    return { success: true, data: ... };
  }
}

// Register in src/ai-core/handlers/index.ts
export const taskHandlers = {
  email: emailHandler,
  code: codeHandler,
  monitoring: monitoringHandler,
  report: reportHandler,
  custom: new CustomHandler()  // Add your handler
};
```

### Create Custom Workflow

```bash
POST /api/ai-workflows/workflows
{
  "name": "My Custom Workflow",
  "type": "custom",
  "config": {
    "steps": [
      { "handler": "monitoring", "data": {...} },
      { "handler": "email", "data": {...} },
      { "handler": "custom", "data": {...} }
    ]
  },
  "trigger": {
    "type": "event",
    "event": "user.signup"
  }
}
```

## Monitoring & Alerts

### Alert Severity Levels

- `LOW` - Informational
- `MEDIUM` - Requires attention
- `HIGH` - Urgent action needed
- `CRITICAL` - Immediate action required

### Alert Types

- `error-spike` - High number of errors detected
- `performance-degradation` - Slow task execution
- `security-concern` - Suspicious activity
- `workflow-approval-pending` - Workflows waiting for approval
- `system-info` - System notifications

## Best Practices

1. **Start Conservative**: Set `requiresApproval: true` for new workflows
2. **Monitor Alerts**: Check `/api/ai-workflows/monitoring/alerts` regularly
3. **Review Suggestions**: AI suggestions are stored for review before applying
4. **Set Priorities**: Higher priority tasks (8-10) execute first
5. **Use Scheduling**: Automate routine tasks with cron schedules
6. **Test Workflows**: Execute manually before scheduling
7. **Provide Feedback**: Approve/reject with feedback to improve AI

## Troubleshooting

### Redis Connection Failed

- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`

### AI API Errors

- Verify `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- Check API quotas and billing
- Try switching providers in `AI_PROVIDER`

### Tasks Not Executing

- Check task queue: `GET /api/ai-workflows/tasks?status=PENDING`
- Verify Redis is running
- Check logs for errors

### No Monitoring Alerts

- Ensure `AI_MONITORING_ENABLED=true`
- Wait for scheduled tasks to run (15+ minutes)
- Check scheduler: Look for "Scheduled monitoring tasks" in logs

## Database Optimization

The `.env.ai-core.example` includes PostgreSQL optimization settings:

```bash
# PostgreSQL Optimization
max_connections=50
shared_buffers=256MB
work_mem=16MB
```

For Docker PostgreSQL:

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=yourdb \
  -p 5432:5432 \
  postgres:15 \
  -c max_connections=50 \
  -c shared_buffers=256MB \
  -c work_mem=16MB
```

## Production Deployment

### Environment Variables

Ensure these are set in production:

```bash
AI_ENABLED=true
AI_AUTO_APPROVE=false  # Keep false for safety
NODE_ENV=production
REDIS_URL=redis://your-redis-url:6379
OPENAI_API_KEY=sk-...
SMTP_HOST=smtp.yourdomain.com
```

### Scaling

- Use Redis Cluster for high availability
- Increase `AI_CONCURRENT_TASKS` based on server capacity
- Consider separate worker processes for task execution

### Monitoring

- Set up alerts for `CRITICAL` severity alerts
- Monitor Redis memory usage
- Track AI API costs and usage
- Review failed tasks regularly

## Support

For issues or questions:

1. Check logs in console
2. Review task logs: `GET /api/ai-workflows/tasks/:id`
3. Check system health: `GET /api/ai-workflows/monitoring/health`
4. Review alerts: `GET /api/ai-workflows/monitoring/alerts`

## Next Steps

1. ✅ Set up environment variables
2. ✅ Run database migrations
3. ✅ Start Redis
4. ✅ Test with a simple email task
5. ✅ Create your first workflow
6. ✅ Schedule automated monitoring
7. ✅ Integrate with your existing features

Your SaaS now has a semi-autonomous AI co-pilot! 🤖✨

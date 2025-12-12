# Cloudflare AI Integration Setup Guide

## Overview

This guide configures Cloudflare Workers to integrate with the Advancia AI system, including email routing and AI agent coordination.

## Infrastructure Details

### Cloudflare Configuration

- **Account ID**: `74ecde4d46d4b399c7295cf599d2886b`
- **Zone ID**: `0bff66558872c58ed5b8b7942acc34d9`
- **Domain**: `advanciapayledger.com`
- **KV Namespace**: `ADVANCIA_DATA` (ID: `3bdece1ca0824daeaaecaccfd220895c`)

## Components Created

### 1. AI Connector Worker (`functions/ai-connector.js`)

**Purpose**: Main AI system integration point on Cloudflare

**Endpoints**:

- `GET /health` - Health check and system status
- `GET /status` - AI agents status
- `POST /execute` - Execute AI task
- `POST /email-routing` - Handle email routing
- `POST /guardian` - Guardian AI actions
- `POST /surveillance` - Surveillance AI monitoring
- `POST /orchestrator` - Task orchestration

**Features**:

- ✅ Connects to all AI agents (Guardian, Surveillance, Orchestrator, etc.)
- ✅ KV storage for task queuing and logging
- ✅ Forwards tasks to backend API
- ✅ CORS enabled for frontend integration
- ✅ Priority-based task execution

### 2. Email Worker (`functions/email-worker.js`)

**Purpose**: Handle incoming emails and route to AI agents

**Email Routing**:

- `support@advanciapayledger.com` → UserSupportAgent
- `admin@advanciapayledger.com` → GuardianAI
- `ai@advanciapayledger.com` → OrchestratorAI
- `*@advanciapayledger.com` → General processing

**Features**:

- ✅ Automatic ticket creation for support emails
- ✅ High-priority alerts for admin emails
- ✅ AI task creation for ai@ emails
- ✅ KV storage for email logs (7-day retention)
- ✅ Backend forwarding with retry logic

### 3. Updated Wrangler Configuration

**File**: `frontend/wrangler.toml`

**New Sections**:

```toml
# Zone Configuration
zone_id = "0bff66558872c58ed5b8b7942acc34d9"

# Email Routing Configuration
[email]
name = "advanciapayledger.com"
routes = [
  { pattern = "support@advanciapayledger.com", destination = "email-worker" },
  { pattern = "admin@advanciapayledger.com", destination = "email-worker" },
  { pattern = "ai@advanciapayledger.com", destination = "email-worker" },
  { pattern = "*@advanciapayledger.com", destination = "email-worker" }
]

# Durable Objects for AI state management
[[durable_objects.bindings]]
name = "AI_STATE"
class_name = "AIStateManager"
script_name = "ai-connector"
```

## Deployment Steps

### 1. Deploy AI Connector Worker

```bash
cd frontend
npx wrangler pages deploy . --project-name modular-saas-platform
```

### 2. Configure Email Routing in Cloudflare Dashboard

1. Navigate to **Email** → **Email Routing**
2. Enable Email Routing for `advanciapayledger.com`
3. Add catch-all route to `email-worker`
4. Verify DNS records:
   - MX records point to Cloudflare
   - SPF record includes Cloudflare

### 3. Set Up Email Destinations

```bash
# Add support email destination
npx wrangler email routing destinations create support@advanciapayledger.com

# Add admin email destination
npx wrangler email routing destinations create admin@advanciapayledger.com

# Add AI email destination
npx wrangler email routing destinations create ai@advanciapayledger.com
```

### 4. Configure KV Namespace

```bash
# Verify KV namespace
npx wrangler kv:namespace list

# Test KV write
npx wrangler kv:key put --namespace-id=3bdece1ca0824daeaaecaccfd220895c "test-key" "test-value"

# Test KV read
npx wrangler kv:key get --namespace-id=3bdece1ca0824daeaaecaccfd220895c "test-key"
```

## Testing

### Test AI Connector

```bash
# Health check
curl https://advanciapayledger.com/functions/ai-connector/health

# AI status
curl https://advanciapayledger.com/functions/ai-connector/status

# Execute AI task
curl -X POST https://advanciapayledger.com/functions/ai-connector/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "GuardianAI",
    "task": "security_check",
    "priority": "high",
    "data": {"userId": "test-user"}
  }'

# Email routing test
curl -X POST https://advanciapayledger.com/functions/ai-connector/email-routing \
  -H "Content-Type: application/json" \
  -d '{
    "to": "support@advanciapayledger.com",
    "subject": "Test Support Request",
    "message": "This is a test message",
    "priority": "normal"
  }'
```

### Test Email Worker

```bash
# Send test email to trigger worker
echo "Test email body" | mail -s "Test Subject" support@advanciapayledger.com
```

### Verify KV Storage

```bash
# Check AI system status in KV
npx wrangler kv:key get --namespace-id=3bdece1ca0824daeaaecaccfd220895c "ai-system-status"

# List recent email logs
npx wrangler kv:key list --namespace-id=3bdece1ca0824daeaaecaccfd220895c --prefix="email-received:"
```

## AI Agent Integration

### Guardian AI

**Cloudflare Endpoint**: `/functions/ai-connector/guardian`

**Actions Monitored**:

- Security events logging
- Entity state changes
- Critical alerts

**Example Request**:

```json
{
  "action": "log",
  "entity": "user",
  "event": "security_alert",
  "details": {
    "userId": "123",
    "reason": "Multiple failed logins"
  }
}
```

### Surveillance AI

**Cloudflare Endpoint**: `/functions/ai-connector/surveillance`

**Monitoring Types**:

- System health monitoring
- Anomaly detection
- Performance tracking

**Example Request**:

```json
{
  "monitoringType": "anomaly_detection",
  "threshold": 85,
  "data": {
    "metric": "cpu_usage",
    "value": 92
  }
}
```

### Orchestrator AI

**Cloudflare Endpoint**: `/functions/ai-connector/orchestrator`

**Workflow Orchestration**:

- Multi-step task coordination
- Priority-based scheduling
- State management

**Example Request**:

```json
{
  "workflow": "user_verification",
  "steps": ["verify_email", "check_kyc", "activate_account"],
  "priority": "high"
}
```

## Backend Integration

### Backend API Endpoints to Update

1. **Add Cloudflare webhook receiver**:

   ```typescript
   // backend/src/routes/cloudflare.ts
   router.post("/webhook/ai-task", async (req, res) => {
     const { execution } = req.body;
     // Process AI task from Cloudflare
     await aiWorkerService.processTask(execution);
     res.json({ success: true });
   });
   ```

2. **Add email processing endpoint**:
   ```typescript
   // backend/src/routes/email.ts
   router.post("/process", async (req, res) => {
     const emailLog = req.body;
     // Process email from Cloudflare
     await emailService.processIncoming(emailLog);
     res.json({ success: true });
   });
   ```

## Monitoring & Logs

### View Worker Logs

```bash
# Real-time logs
npx wrangler tail

# Filter by worker name
npx wrangler tail --filter ai-connector
```

### Check KV Usage

```bash
# Get KV namespace info
npx wrangler kv:namespace list

# View storage usage in Cloudflare Dashboard:
# Workers & Pages → KV → ADVANCIA_DATA
```

### Email Routing Analytics

- Navigate to **Email** → **Email Routing** in Cloudflare Dashboard
- View delivery stats, bounces, and rejections
- Check routing logs for email flow

## Security Configuration

### Environment Variables (Secrets)

```bash
# Set backend API key
npx wrangler secret put BACKEND_API_KEY

# Set email signing key
npx wrangler secret put EMAIL_SIGNING_KEY

# Set AI system key
npx wrangler secret put AI_SYSTEM_KEY
```

### Access Control

1. Enable Cloudflare Access for worker routes
2. Configure IP allow/deny lists
3. Set up rate limiting rules

## Troubleshooting

### Issue: Workers Not Receiving Emails

**Solution**:

1. Verify DNS MX records point to Cloudflare
2. Check email routing rules in dashboard
3. Ensure worker is deployed and active

### Issue: KV Storage Not Accessible

**Solution**:

1. Verify KV namespace binding in wrangler.toml
2. Check namespace ID matches
3. Ensure KV namespace exists in account

### Issue: Backend API Not Receiving Tasks

**Solution**:

1. Check backend URL in worker code
2. Verify backend endpoints are accessible
3. Check CORS configuration
4. Review worker logs for fetch errors

## Next Steps

1. ✅ **Deploy Workers**: `cd frontend && npx wrangler pages deploy`
2. ✅ **Configure Email Routing**: Enable in Cloudflare Dashboard
3. ✅ **Test All Endpoints**: Use curl commands above
4. ✅ **Monitor Logs**: `npx wrangler tail`
5. ✅ **Update Backend**: Add webhook receivers
6. ✅ **Set Secrets**: Configure environment variables
7. ✅ **Enable Monitoring**: Set up alerts for errors

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Email Routing Docs](https://developers.cloudflare.com/email-routing/)
- [KV Storage Docs](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Durable Objects Docs](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)

---

**Status**: ✅ Ready for deployment
**Last Updated**: November 30, 2025

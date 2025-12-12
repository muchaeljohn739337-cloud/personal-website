# 🛡️ 150% Security Implementation Guide

> **Complete security setup for production deployment with auto-correction, IP filtering, and secret protection**

---

## 🚨 CRITICAL: Immediate Actions Required

### 1. Rotate Exposed OpenAI API Key (DO THIS NOW)

Your OpenAI API key is currently exposed in the `.env` file and MUST be rotated immediately:

```powershell
# 1. Go to OpenAI Platform
Start-Process "https://platform.openai.com/api-keys"

# 2. Delete the exposed key (starts with: sk-proj-XLilYBZ7OeEp16URtEnZrQ8m_)

# 3. Create a new key and copy it

# 4. Update your .env file
# Replace both:
# OPENAI_API_KEY=<new_key>
# COPILOT_OPENAI_API_KEY=<new_key>

# 5. Restart the server
npm run dev
```

### 2. Generate Production Secrets

```powershell
# Generate all production-ready secrets
npm run generate-secrets

# Copy the output to your .env file immediately
# Never share these secrets or commit them to git
```

### 3. Test Secret Protection

```powershell
# Start the server
npm run dev

# In another terminal, test that secrets are auto-redacted
curl -X POST http://localhost:4000/api/admin/security-management/test-secret-protection `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" `
  -H "Content-Type: application/json"

# You should see [REDACTED_***] instead of actual secrets
```

---

## 🔒 Security Features Implemented

### ✅ Secret Auto-Correction System

**What it does:**

- Automatically detects and redacts API keys, tokens, and passwords in ALL responses
- Prevents accidental exposure of secrets in logs, errors, and API responses
- Logs all secret exposure attempts to audit trail
- Works for: OpenAI keys, Stripe keys, JWT tokens, database URLs, webhook URLs, etc.

**How it works:**

1. **Pattern matching:** Detects common secret formats (API keys, tokens, private keys)
2. **Known secrets:** Loads all secrets from environment at startup
3. **Response interception:** Scans ALL JSON and text responses before sending
4. **Auto-redaction:** Replaces secrets with `[REDACTED_sk-p***]` format
5. **Audit logging:** Records every secret exposure attempt with IP, path, and timestamp

**Example:**

```json
// Before secret protection:
{
  "api_key": "sk-proj-abc123xyz789",
  "error": "Failed: sk-proj-abc123xyz789 is invalid"
}

// After auto-correction:
{
  "api_key": "[REDACTED_sk-p***]",
  "error": "Failed: [REDACTED_sk-p***] is invalid"
}
```

### ✅ IP Whitelist/Blacklist System

**What it does:**

- Database-backed IP filtering with automatic blocking
- Manual whitelist/blacklist management via admin panel
- Auto-blocks IPs after repeated violations (configurable thresholds)
- Temporary and permanent blocks supported
- In-memory cache for high performance (5-minute TTL)

**Auto-block thresholds:**

- Rate limit violations: 10 in 1 hour → 24h block
- Failed auth attempts: 5 in 1 hour → 24h block
- Secret exposure attempts: 3 in 1 hour → 24h block
- SQL injection attempts: 1 attempt → 24h block
- Suspicious activity: 7 in 1 hour → 24h block

**Admin API Endpoints:**

```bash
# List whitelisted IPs
GET /api/admin/security-management/ip/whitelist

# List blacklisted IPs
GET /api/admin/security-management/ip/blacklist

# Add IP to whitelist
POST /api/admin/security-management/ip/whitelist
{
  "ip_address": "203.0.113.42",
  "description": "Office network",
  "expires_in_hours": 720  // 30 days
}

# Block IP manually
POST /api/admin/security-management/ip/blacklist
{
  "ip_address": "198.51.100.23",
  "reason": "MANUAL_BLOCK",
  "expires_in_hours": 24
}

# Unblock IP
DELETE /api/admin/security-management/ip/blacklist/198.51.100.23

# Get IP statistics
GET /api/admin/security-management/ip/stats/203.0.113.42

# Security dashboard
GET /api/admin/security-management/dashboard
```

### ✅ Console Log Protection

**What it does:**

- Intercepts all `console.log()`, `console.error()`, `console.warn()`, `console.info()`
- Auto-redacts secrets before writing to console/logs
- Prevents accidental logging of sensitive data

**Example:**

```javascript
// Your code:
console.log("OpenAI key:", process.env.OPENAI_API_KEY);

// Console output:
// OpenAI key: [REDACTED_sk-p***]
```

### ✅ Vault Secret Migration

**What it does:**

- Migrates sensitive secrets from `.env` to HashiCorp Vault
- Generates updated `.env.vault` with Vault references
- Backs up original `.env` to `.env.backup`
- Supports verification of stored secrets

**Secrets migrated:**

- OpenAI API keys
- Stripe keys and webhook secrets
- JWT secrets
- Database URLs
- Email service credentials (SendGrid, SMTP)
- Alert webhooks (Discord, Slack)
- GitHub tokens

---

## 📦 Installation & Setup

### Step 1: Install Dependencies (Already Done ✅)

The security middleware is already integrated into your application.

### Step 2: Initialize IP Tables

```powershell
# The IP tables are auto-created on first server start
npm run dev

# You should see:
# ✅ IP access control system initialized
# 🛡️  150% Security Mode: ACTIVE
```

### Step 3: Configure Vault (Optional but Recommended)

```powershell
# Start Vault in Docker
docker run --cap-add=IPC_LOCK -d --name=vault -p 8200:8200 -e 'VAULT_DEV_ROOT_TOKEN_ID=myroot' vault:latest

# Update .env
echo "VAULT_ENABLED=true" >> .env
echo "VAULT_ADDR=http://localhost:8200" >> .env
echo "VAULT_TOKEN=myroot" >> .env

# Migrate secrets to Vault
npm run migrate-to-vault

# Verify secrets in Vault
npm run migrate-to-vault verify

# Replace .env with .env.vault
mv .env .env.backup
mv .env.vault .env

# Restart server
npm run dev
```

### Step 4: Set Up Alert Webhooks

#### Discord Webhook

```powershell
# 1. Go to your Discord server settings
# 2. Integrations → Webhooks → New Webhook
# 3. Copy the webhook URL
# 4. Add to .env:
echo "DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/..." >> .env
```

#### Slack Webhook

```powershell
# 1. Go to https://api.slack.com/apps
# 2. Create New App → From scratch
# 3. Add Incoming Webhooks feature
# 4. Copy the webhook URL
# 5. Add to .env:
echo "SLACK_WEBHOOK_URL=https://hooks.slack.com/services/..." >> .env
```

---

## 🧪 Testing Your Security Setup

### Test 1: Secret Protection

```powershell
# Start server
npm run dev

# Test secret redaction (replace with your admin token)
$token = "your_admin_jwt_token"

Invoke-RestMethod -Uri "http://localhost:4000/api/admin/security-management/test-secret-protection" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  }

# Expected: All secrets should be [REDACTED_***]
```

### Test 2: IP Blocking

```powershell
# Block your own IP (for testing)
$body = @{
  ip_address = "127.0.0.1"
  reason = "MANUAL_BLOCK"
  expires_in_hours = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/admin/security-management/ip/blacklist" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body

# Try to access any endpoint - should get 403 Forbidden

# Unblock
Invoke-RestMethod -Uri "http://localhost:4000/api/admin/security-management/ip/blacklist/127.0.0.1" `
  -Method DELETE `
  -Headers @{ "Authorization" = "Bearer $token" }
```

### Test 3: View Security Dashboard

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/admin/security-management/dashboard" `
  -Headers @{ "Authorization" = "Bearer $token" }

# Shows:
# - Whitelisted IP count
# - Blacklisted IP count
# - Recent blocks (24h)
# - Secret exposure attempts (24h)
# - Critical events (24h)
# - Top blocked IPs
```

### Test 4: View Secret Exposure Logs

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/admin/security-management/secret-exposures" `
  -Headers @{ "Authorization" = "Bearer $token" }

# Shows all prevented secret exposures with:
# - IP address
# - Endpoint path
# - Timestamp
# - Preview of exposed content (redacted)
```

---

## 🐳 Docker Production Setup

### Update docker-compose.yml

Add Docker secrets for production:

```yaml
version: "3.8"

services:
  api:
    build: .
    secrets:
      - jwt_secret
      - openai_api_key
      - stripe_secret
      - database_url
    environment:
      - JWT_SECRET_FILE=/run/secrets/jwt_secret
      - OPENAI_API_KEY_FILE=/run/secrets/openai_api_key
      - STRIPE_SECRET_KEY_FILE=/run/secrets/stripe_secret
      - DATABASE_URL_FILE=/run/secrets/database_url

secrets:
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  openai_api_key:
    file: ./secrets/openai_api_key.txt
  stripe_secret:
    file: ./secrets/stripe_secret.txt
  database_url:
    file: ./secrets/database_url.txt
```

### Create secrets directory

```powershell
# Create secrets folder (add to .gitignore!)
mkdir secrets

# Generate and save secrets
npm run generate-secrets jwt | Out-File secrets/jwt_secret.txt
# Copy your OpenAI key
"sk-proj-YOUR_NEW_KEY" | Out-File secrets/openai_api_key.txt

# Update .gitignore
echo "secrets/" >> .gitignore
```

### Deploy with Docker

```powershell
# Build and start with secrets
docker-compose up -d --build

# Check logs
docker-compose logs -f api

# Verify security is active
docker-compose logs api | Select-String "150% Security Mode"
```

---

## 📊 Monitoring & Alerts

### Real-time Security Monitoring

The system automatically logs all security events:

1. **Secret Exposure Attempts** - Logged as `SECRET_EXPOSURE_PREVENTED`
2. **IP Blocks** - Logged as `IP_BLOCKED` (auto or manual)
3. **Failed Auth** - Logged as `FAILED_AUTH`
4. **Suspicious Activity** - Logged as `SUSPICIOUS_ACTIVITY`

### View Audit Logs

```powershell
# Get all security events (last 100)
Invoke-RestMethod -Uri "http://localhost:4000/api/admin/security-management/audit-logs" `
  -Headers @{ "Authorization" = "Bearer $token" }

# Filter by severity
Invoke-RestMethod -Uri "http://localhost:4000/api/admin/security-management/audit-logs?severity=CRITICAL" `
  -Headers @{ "Authorization" = "Bearer $token" }

# Filter by action
Invoke-RestMethod -Uri "http://localhost:4000/api/admin/security-management/audit-logs?action=IP_BLOCKED&limit=50" `
  -Headers @{ "Authorization" = "Bearer $token" }
```

### Discord/Slack Alerts

When configured, you'll automatically receive alerts for:

- **Critical events** - Secret exposures, SQL injection attempts
- **Auto-blocks** - IPs blocked automatically
- **Deployment issues** - Auto-rollback triggers
- **System errors** - 500 errors, database failures

---

## 🔧 Configuration Options

### Environment Variables

```bash
# Secret Protection
SECRET_PROTECTION_ENABLED=true  # Enable/disable secret auto-correction

# IP Filtering
IP_FILTER_ENABLED=true          # Enable/disable IP filtering
IP_CACHE_TTL=300000             # Cache refresh interval (ms)

# Auto-blocking Thresholds (in 1 hour window)
AUTO_BLOCK_RATE_LIMIT=10        # Rate limit violations
AUTO_BLOCK_FAILED_AUTH=5        # Failed login attempts
AUTO_BLOCK_SECRET_EXPOSE=3      # Secret exposure attempts
AUTO_BLOCK_SQL_INJECT=1         # SQL injection attempts
AUTO_BLOCK_SUSPICIOUS=7         # Other suspicious activity

# Vault
VAULT_ENABLED=true              # Use Vault for secrets
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=your_vault_token

# Alerts
DISCORD_WEBHOOK_URL=            # Discord webhook for alerts
SLACK_WEBHOOK_URL=              # Slack webhook for alerts
ALERT_ON_SECRET_EXPOSURE=true  # Send alert on secret exposure
ALERT_ON_AUTO_BLOCK=true       # Send alert on auto-block
```

---

## 🎯 Production Checklist

### Pre-Deployment

- [ ] Rotate all exposed secrets (OpenAI, JWT, etc.)
- [ ] Generate new production secrets with `npm run generate-secrets`
- [ ] Set up HashiCorp Vault and migrate secrets
- [ ] Configure Discord/Slack webhooks for alerts
- [ ] Test secret protection with test endpoint
- [ ] Test IP blocking functionality
- [ ] Review security dashboard
- [ ] Set up Docker secrets (if using Docker)
- [ ] Enable HTTPS/SSL (Cloudflare or Let's Encrypt)
- [ ] Configure domain and DNS
- [ ] Set `NODE_ENV=production` in production environment
- [ ] Review and update `.gitignore` to exclude secrets

### Post-Deployment

- [ ] Verify 150% Security Mode is active in logs
- [ ] Test secret protection in production
- [ ] Monitor secret exposure logs (should be 0)
- [ ] Review IP blacklist for auto-blocks
- [ ] Set up monitoring alerts (Discord/Slack)
- [ ] Schedule regular secret rotation (90 days)
- [ ] Review audit logs weekly
- [ ] Test failover/rollback mechanisms

---

## 🆘 Troubleshooting

### Issue: Secrets still exposed in responses

**Solution:**

```powershell
# 1. Check if secret protection is initialized
# Look for this in logs:
# 🔒 Secret protection initialized with X known secrets
# 🔒 Console log protection enabled

# 2. Restart server to reload environment variables
npm run dev

# 3. Test with the test endpoint
curl -X POST http://localhost:4000/api/admin/security-management/test-secret-protection
```

### Issue: IP tables not created

**Solution:**

```powershell
# Manually create tables (run in database)
psql -U postgres -d your_database -f scripts/create-ip-tables.sql

# Or restart server (auto-creates on startup)
npm run dev
```

### Issue: Vault connection failed

**Solution:**

```powershell
# Check Vault is running
docker ps | Select-String vault

# Start Vault if not running
docker run --cap-add=IPC_LOCK -d --name=vault -p 8200:8200 vault:latest

# Test connection
curl http://localhost:8200/v1/sys/health
```

### Issue: Discord/Slack alerts not working

**Solution:**

```powershell
# Test webhook URL manually
$webhook = "YOUR_DISCORD_WEBHOOK_URL"
$body = @{ content = "Test alert from Advancia Pay" } | ConvertTo-Json
Invoke-RestMethod -Uri $webhook -Method POST -Body $body -ContentType "application/json"

# Check .env has correct webhook URL
cat .env | Select-String "WEBHOOK"
```

---

## 📚 Additional Resources

- **Vault Migration Script:** `src/scripts/migrate-to-vault.ts`
- **Secret Generation:** `src/scripts/generate-secrets.ts`
- **Secret Protection Middleware:** `src/middleware/secretProtection.ts`
- **IP Filter Middleware:** `src/middleware/ipFilter.ts`
- **Admin Security Routes:** `src/routes/adminSecurityManagement.ts`

---

## 🎉 You're 150% Secured

Your application now has:

- ✅ Auto-correction of secret exposures
- ✅ Automatic IP blocking on violations
- ✅ Database-backed whitelist/blacklist
- ✅ Comprehensive audit logging
- ✅ Real-time security monitoring
- ✅ Admin security dashboard
- ✅ Vault integration for secret management
- ✅ Discord/Slack alert integration

**Remember:**

1. Rotate secrets regularly (every 90 days)
2. Review audit logs weekly
3. Monitor security dashboard daily
4. Keep dependencies updated
5. Never commit secrets to git

---

🔐 **Stay Secure!**

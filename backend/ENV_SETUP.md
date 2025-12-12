# 🚀 Environment Variables Setup Guide

This guide explains all required and optional environment variables for the SaaS Platform backend.

## 📋 Quick Start Checklist

### ✅ Required for Basic Operation

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Secret key for JWT tokens
- [ ] `SESSION_SECRET` - Secret key for sessions

### ⚡ Required for Full Functionality

- [ ] `SENDGRID_API_KEY` or SMTP credentials - Email service
- [ ] `STRIPE_SECRET_KEY` - Payment processing
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification
- [ ] `FRONTEND_URL` - Frontend application URL

### 🎯 Optional (Recommended)

- [ ] `REDIS_URL` - For queue features (BullMQ)
- [ ] `VAULT_ADDR` - For secure secret management
- [ ] API keys (OpenAI, Anthropic) - For AI features

---

## 📧 Email Service Configuration

### Option 1: SendGrid (Recommended for Production)

**Get Your API Key:**

1. Sign up at https://sendgrid.com
2. Go to Settings → API Keys
3. Create new API key with "Full Access"
4. Copy the key (you won't see it again!)

```env
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
```

**Benefits:**

- 100 emails/day free tier
- High deliverability rates
- Detailed analytics
- No SMTP server needed

### Option 2: SMTP (Gmail, Outlook, etc.)

**For Gmail:**

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password (remove spaces)

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
EMAIL_FROM="noreply@yourdomain.com"
```

**For Outlook/Hotmail:**

```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
EMAIL_FROM="noreply@yourdomain.com"
```

### Development Mode

If no email service is configured, emails are logged to console in development:

```typescript
[EmailService] 📧 [DEV MODE] Email would be sent:
To: user@example.com
Template: welcome
Subject: Welcome to Our SaaS Platform!
```

---

## 💳 Stripe Payment Configuration

### Get Your Keys

1. Sign up at https://stripe.com
2. Go to Developers → API Keys
3. Copy both Publishable and Secret keys
4. For webhooks: Developers → Webhooks → Add endpoint

**Test Mode (Development):**

```env
STRIPE_SECRET_KEY="sk_test_51xxxxxxxxxxxxxxxxxxxxx"
STRIPE_PUBLISHABLE_KEY="pk_test_51xxxxxxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxx"
```

**Live Mode (Production):**

```env
STRIPE_SECRET_KEY="sk_live_51xxxxxxxxxxxxxxxxxxxxx"
STRIPE_PUBLISHABLE_KEY="pk_live_51xxxxxxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxx"
```

### Webhook Setup

1. In Stripe Dashboard: Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/payments/webhook`
4. Events to listen: `payment_intent.succeeded`, `payment_intent.failed`, `charge.refunded`
5. Copy the webhook secret

---

## 🗄️ Database Configuration

### Local PostgreSQL

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saas_platform?schema=public"
```

### Render.com (Production)

Automatically provided by Render:

```env
DATABASE_URL="postgresql://user:password@hostname.render.com:5432/database"
```

### Supabase (Alternative)

1. Create project at https://supabase.com
2. Go to Project Settings → Database
3. Copy Connection String (URI format)

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
```

---

## 🔐 Security Secrets

### Generate Strong Secrets

Use this command to generate secure random strings:

**PowerShell:**

```powershell
# Generate JWT Secret
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})

# Or use openssl if installed
openssl rand -base64 32
```

**Linux/Mac:**

```bash
openssl rand -base64 32
```

**Configuration:**

```env
JWT_SECRET="your-64-character-random-string-here"
SESSION_SECRET="another-64-character-random-string"
JWT_EXPIRES_IN="24h"
```

---

## 🧠 AI Service Configuration (Optional)

### OpenAI

```env
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxx"
OPENAI_MODEL="gpt-4"
```

### Anthropic (Claude)

```env
ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxxxxxxx"
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"
```

### Local LLaMA (Fallback)

```env
LLAMA_MODEL_PATH="./models/llama-2-7b"
LLAMA_ENABLED="true"
```

**Note:** AI features gracefully degrade if keys not provided. System uses local fallbacks.

---

## 📱 Web Push Notifications (Optional)

Generate VAPID keys:

```bash
node generate-vapid.js
```

Add to `.env`:

```env
VAPID_PUBLIC_KEY="Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_PRIVATE_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_SUBJECT="mailto:support@yourdomain.com"
```

---

## 🔴 Redis Configuration (Optional)

### Local Redis

```env
REDIS_URL="redis://localhost:6379"
```

### Render Redis (Production)

```env
REDIS_URL="redis://red-xxxxx:6379"
```

### Upstash (Serverless Alternative)

```env
REDIS_URL="rediss://:password@endpoint.upstash.io:6379"
```

**Note:** Redis is optional. Without it, queue features (BullMQ) are disabled but system works normally.

---

## 🛡️ HashiCorp Vault (Optional, Advanced)

For production-grade secret management:

```env
VAULT_ADDR="http://localhost:8200"
VAULT_TOKEN="your-vault-token"
```

**Benefits:**

- Encrypted secret storage
- Automatic secret rotation
- Audit logging
- Access control

---

## 🌐 CORS & Frontend

```env
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:4000"
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

For production:

```env
FRONTEND_URL="https://app.yourdomain.com"
BACKEND_URL="https://api.yourdomain.com"
ALLOWED_ORIGINS="https://app.yourdomain.com,https://yourdomain.com"
```

---

## 🚀 Complete Production .env Example

```env
# Database
DATABASE_URL="postgresql://user:password@hostname:5432/database"

# Server
PORT=4000
NODE_ENV="production"
FRONTEND_URL="https://app.yourdomain.com"
BACKEND_URL="https://api.yourdomain.com"

# Security
JWT_SECRET="your-generated-secret-here"
SESSION_SECRET="your-generated-secret-here"
JWT_EXPIRES_IN="7d"

# Email (SendGrid)
SENDGRID_API_KEY="SG.your-api-key"
EMAIL_FROM="noreply@yourdomain.com"

# Payments (Stripe)
STRIPE_SECRET_KEY="sk_live_your-key"
STRIPE_PUBLISHABLE_KEY="pk_live_your-key"
STRIPE_WEBHOOK_SECRET="whsec_your-secret"

# Redis (Optional)
REDIS_URL="redis://red-xxxxx:6379"

# AI Services (Optional)
OPENAI_API_KEY="sk-your-key"
ANTHROPIC_API_KEY="sk-ant-your-key"

# CORS
ALLOWED_ORIGINS="https://app.yourdomain.com,https://yourdomain.com"
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="900000"
```

---

## ✅ Validation & Testing

### Test Email Service

```bash
npm run ts-node src/scripts/test-email-service.ts -- --to=your@email.com
```

### Test All Configuration

```bash
npm run ts-node src/scripts/check-env.ts
```

### Verify Backend Health

```bash
curl http://localhost:4000/api/health
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` file to Git**
   - Already in `.gitignore`
   - Use `.env.example` as template

2. **Use different secrets for dev/prod**
   - Different JWT secrets
   - Different Stripe keys (test vs live)
   - Different database credentials

3. **Rotate secrets regularly**
   - Change JWT secrets every 90 days
   - Rotate API keys quarterly
   - Update database passwords annually

4. **Use Vault for production**
   - Store secrets encrypted
   - Enable automatic rotation
   - Audit secret access

5. **Limit API key permissions**
   - SendGrid: Only send emails
   - Stripe: Only necessary operations
   - AI services: Usage limits set

---

## 📞 Troubleshooting

### Email not sending

```bash
# Check configuration
npm run ts-node src/scripts/test-email-service.ts

# Verify SendGrid key
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"test@example.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'
```

### Database connection failed

```bash
# Test PostgreSQL connection
psql "$DATABASE_URL" -c "SELECT 1"

# Check Prisma connection
npx prisma db pull
```

### Stripe webhook not working

1. Check webhook URL is correct
2. Verify webhook secret matches
3. Test with Stripe CLI:

   ```bash
   stripe listen --forward-to localhost:4000/api/payments/webhook
   ```

---

## 📚 Additional Resources

- **SendGrid Docs:** https://docs.sendgrid.com
- **Stripe Docs:** https://stripe.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs
- **Redis Docs:** https://redis.io/documentation
- **Vault Docs:** https://www.vaultproject.io/docs

---

## 🎯 Next Steps

After configuring environment variables:

1. ✅ Copy `.env.example` to `.env`
2. ✅ Fill in all required variables
3. ✅ Run `npm run ts-node src/scripts/check-env.ts` to validate
4. ✅ Test email service: `npm run ts-node src/scripts/test-email-service.ts`
5. ✅ Start backend: `npm run dev`
6. ✅ Check health: `curl http://localhost:4000/api/health`

**Ready to deploy? See `DEPLOYMENT.md` for production setup guide.**

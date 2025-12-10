# Production Deployment Guide

Complete guide for deploying the SaaS platform to production.

## 🚀 Pre-Deployment Checklist

### ✅ Environment & Secrets

- [ ] All required environment variables set in production
- [ ] Production secrets generated (JWT, Session, NextAuth)
- [ ] Database connection string configured
- [ ] Payment providers configured with **LIVE** keys
- [ ] Webhook endpoints verified and accessible
- [ ] Email service configured
- [ ] Redis/Cache configured
- [ ] Storage (S3/R2) configured

### ✅ Payment Providers (Switch to Live Mode)

- [ ] **Stripe**: Use `sk_live_...` and `pk_live_...` keys
- [ ] **LemonSqueezy**: Use production API keys
- [ ] **NOWPayments**: Use production API keys
- [ ] **Alchemy Pay**: Use production credentials
- [ ] All webhook secrets configured
- [ ] Test webhook delivery

### ✅ Database

- [ ] Production database created
- [ ] Database migrations run: `npm run prisma:migrate deploy`
- [ ] Seed data loaded (if needed)
- [ ] Database backups configured
- [ ] Connection pooling configured
- [ ] SSL/TLS enabled

### ✅ Security

- [ ] All secrets stored securely (not in code)
- [ ] HTTPS/SSL certificates configured
- [ ] Security headers verified
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] DDoS protection enabled (Cloudflare)
- [ ] Firewall rules configured

### ✅ Monitoring & Logging

- [ ] Sentry error tracking configured
- [ ] Logging service configured
- [ ] Health check endpoints working
- [ ] Uptime monitoring configured
- [ ] Alert notifications set up

### ✅ Testing

- [ ] All tests passing: `npm test`
- [ ] E2E tests passing: `npm run test:e2e`
- [ ] Production build successful: `npm run build`
- [ ] Manual smoke tests completed

---

## 📋 Production Environment Variables

### Required Variables

```bash
# Core
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com

# Secrets (Generate new ones for production!)
JWT_SECRET=<64-char-random-secret>
SESSION_SECRET=<32-char-random-secret>
NEXTAUTH_SECRET=<32-char-random-secret>

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Payment - Stripe (LIVE)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Payment - LemonSqueezy
LEMONSQUEEZY_API_KEY=live_api_key
LEMONSQUEEZY_STORE_ID=live_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=live_webhook_secret

# Payment - NOWPayments (Production)
NOWPAYMENTS_API_KEY=production_api_key
NOWPAYMENTS_IPN_SECRET=production_ipn_secret

# Payment - Alchemy Pay (Production)
ALCHEMY_PAY_API_URL=https://openapi.alchemypay.org
ALCHEMY_PAY_APP_ID=production_app_id
ALCHEMY_PAY_APP_SECRET=production_app_secret

# Email
RESEND_API_KEY=re_live_...
SMTP_FROM=noreply@yourdomain.com

# Redis
REDIS_URL=redis://production-redis:6379

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# OAuth (Production)
GOOGLE_CLIENT_ID=production_client_id
GOOGLE_CLIENT_SECRET=production_client_secret
GITHUB_CLIENT_ID=production_client_id
GITHUB_CLIENT_SECRET=production_client_secret
```

---

## 🎯 Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### Initial Setup

1. **Install Vercel CLI:**

```bash
npm i -g vercel
```

2. **Login to Vercel:**

```bash
vercel login
```

3. **Link Project:**

```bash
vercel link
```

#### Set Production Environment Variables

```bash
# Set all secrets via Vercel Dashboard or CLI
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add JWT_SECRET production
vercel env add SESSION_SECRET production

# Payment providers
vercel env add STRIPE_SECRET_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production

# Continue for all environment variables...
```

#### Deploy

```bash
# Deploy to production
vercel --prod

# Or use GitHub Actions (already configured)
git push origin main
```

---

### Option 2: Cloudflare Workers (via OpenNext)

#### Prerequisites

1. **Install Wrangler:**

```bash
npm install -g wrangler
```

2. **Login to Cloudflare:**

```bash
npx wrangler login
```

#### Build for Cloudflare

```bash
# Build Next.js for Cloudflare
npm run build:worker
```

#### Set Secrets

```bash
# Core secrets
npx wrangler secret put DATABASE_URL --env production
npx wrangler secret put NEXTAUTH_SECRET --env production
npx wrangler secret put JWT_SECRET --env production
npx wrangler secret put SESSION_SECRET --env production

# Payment providers
npx wrangler secret put STRIPE_SECRET_KEY --env production
npx wrangler secret put NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY --env production
npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production

npx wrangler secret put LEMONSQUEEZY_API_KEY --env production
npx wrangler secret put LEMONSQUEEZY_STORE_ID --env production
npx wrangler secret put LEMONSQUEEZY_WEBHOOK_SECRET --env production

npx wrangler secret put NOWPAYMENTS_API_KEY --env production
npx wrangler secret put NOWPAYMENTS_IPN_SECRET --env production

npx wrangler secret put ALCHEMY_PAY_APP_ID --env production
npx wrangler secret put ALCHEMY_PAY_APP_SECRET --env production

# Email
npx wrangler secret put RESEND_API_KEY --env production

# Continue for all secrets...
```

#### Deploy

```bash
# Deploy to production
npm run deploy:worker -- --env production

# Or
npx wrangler pages deploy .vercel/output/static --env production
```

---

### Option 3: Self-Hosted (Docker)

#### Build Docker Image

```bash
docker build -t saas-platform:latest .
```

#### Run with Docker Compose

```bash
# Update docker-compose.yml with production values
docker-compose -f docker-compose.prod.yml up -d
```

#### Environment Variables

Create `.env.production`:

```bash
# Copy from .env.local and update for production
cp .env.local .env.production
# Edit .env.production with production values
```

---

## 🔧 Post-Deployment Steps

### 1. Verify Deployment

```bash
# Health check
curl https://yourdomain.com/api/health

# System tests
curl https://yourdomain.com/api/admin/tests?action=full
```

### 2. Database Migrations

```bash
# Run migrations
npm run prisma:migrate deploy

# Verify schema
npm run prisma:studio
```

### 3. Verify Payment Providers

- [ ] Test Stripe checkout flow
- [ ] Verify Stripe webhook delivery
- [ ] Test other payment providers

### 4. Verify Webhooks

Set webhook URLs in payment provider dashboards:

- **Stripe**: `https://yourdomain.com/api/stripe/webhook`
- **LemonSqueezy**: `https://yourdomain.com/api/payments/lemonsqueezy/webhook`
- **NOWPayments**: `https://yourdomain.com/api/payments/nowpayments/webhook`
- **Alchemy Pay**: `https://yourdomain.com/api/payments/alchemypay/webhook`

### 5. Configure DNS

- [ ] Domain points to deployment
- [ ] SSL certificate active
- [ ] CNAME/A records configured
- [ ] Email records (SPF, DKIM, DMARC) configured

### 6. Enable Monitoring

- [ ] Sentry capturing errors
- [ ] Logs streaming to monitoring service
- [ ] Uptime monitoring active
- [ ] Alert notifications working

### 7. Performance Optimization

- [ ] CDN configured
- [ ] Image optimization enabled
- [ ] Caching configured
- [ ] Database indexes optimized
- [ ] API response times acceptable

---

## 🛡️ Security Hardening

### 1. Secrets Management

✅ **Never commit secrets to git**
✅ **Use environment variables only**
✅ **Rotate secrets regularly (every 90 days)**
✅ **Use different secrets for each environment**

### 2. SSL/TLS

- [ ] HTTPS enforced (no HTTP)
- [ ] TLS 1.3 enabled
- [ ] Certificate auto-renewal configured
- [ ] HSTS headers enabled

### 3. Firewall & DDoS

- [ ] Cloudflare DDoS protection enabled
- [ ] Rate limiting configured
- [ ] IP whitelisting for admin endpoints
- [ ] Geo-blocking if needed

### 4. Database Security

- [ ] SSL/TLS required for connections
- [ ] Strong passwords
- [ ] Regular backups
- [ ] Access restricted to app servers only

---

## 📊 Monitoring & Alerts

### Health Checks

Monitor these endpoints:

- `/api/health` - Basic health
- `/api/admin/tests?action=health` - Full system health
- `/api/admin/tests?action=tests` - System tests

### Key Metrics to Monitor

- **Application**: Response times, error rates, uptime
- **Database**: Connection pool, query performance, storage
- **Payment**: Transaction success rates, webhook delivery
- **Infrastructure**: CPU, memory, network usage

### Alert Thresholds

Set alerts for:

- Error rate > 1%
- Response time > 2s
- Database connections > 80%
- Payment failure rate > 5%
- Uptime < 99.9%

---

## 🔄 Rollback Procedure

If deployment fails:

### Vercel

```bash
# List deployments
vercel list

# Rollback to previous
vercel rollback <deployment-url>
```

### Cloudflare

```bash
# List deployments
npx wrangler deployments list

# Rollback
npx wrangler rollback
```

### Database

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## 📝 Production Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "deploy:prod": "npm run build && vercel --prod",
    "deploy:worker": "npm run build:worker && npm run deploy:worker -- --env production",
    "migrate:prod": "prisma migrate deploy",
    "verify:prod": "curl https://yourdomain.com/api/health"
  }
}
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Environment variables not loading**

- ✅ Verify secrets are set in deployment platform
- ✅ Check variable names match exactly
- ✅ Ensure `NEXT_PUBLIC_` prefix for client-side vars
- ✅ Restart deployment after adding secrets

**Issue: Database connection failed**

- ✅ Verify DATABASE_URL is correct
- ✅ Check firewall allows connections
- ✅ Ensure SSL mode is configured
- ✅ Test connection from deployment environment

**Issue: Payment webhooks not working**

- ✅ Verify webhook URL is publicly accessible
- ✅ Check webhook secret matches
- ✅ Ensure HTTPS is used
- ✅ Test webhook delivery in provider dashboard

**Issue: Build fails**

- ✅ Check Node.js version (20.x)
- ✅ Clear `.next` folder: `rm -rf .next`
- ✅ Reinstall dependencies: `rm -rf node_modules && npm install`
- ✅ Check for TypeScript errors

---

## ✅ Final Verification Checklist

Before going live:

- [ ] All tests passing
- [ ] Production build successful
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Payment providers working (test transaction)
- [ ] Webhooks receiving events
- [ ] SSL certificate active
- [ ] Domain resolving correctly
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Rollback plan documented

---

## 🎉 You're Live!

Once all checks pass:

1. ✅ Announce to team
2. ✅ Monitor closely for 24 hours
3. ✅ Watch error logs
4. ✅ Verify all payment flows
5. ✅ Test user registration/login

**Need help?** Check logs and monitoring dashboards first.

---

## 📚 Additional Resources

- **Environment Setup**: See `ENV_SETUP.md`
- **Payment Setup**: See `PAYMENT_SETUP.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Local Development**: See `LOCAL_DEVELOPMENT.md`

# 🚀 Quick Deploy Guide

Fast track to production deployment.

## Quick Start

### Option 1: Vercel (Easiest)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Set environment variables (via Dashboard or CLI)
# See PRODUCTION_DEPLOYMENT.md for complete list

# 4. Deploy
npm run deploy:prod
```

### Option 2: Cloudflare Workers

```bash
# 1. Build for Cloudflare
npm run build:worker

# 2. Set secrets
npx wrangler secret put DATABASE_URL --env production
# ... (see wrangler.toml for all secrets)

# 3. Deploy
npm run deploy:worker:prod
```

### Option 3: Full Automated Check + Deploy

```bash
npm run deploy:full
```

This runs pre-production checks and deploys automatically.

---

## Essential Commands

```bash
# Pre-deployment validation
npm run preprod:check

# Deploy to production (Vercel)
npm run deploy:prod

# Deploy to Cloudflare
npm run deploy:worker:prod

# Run database migrations
npm run migrate:prod

# Verify deployment
npm run verify:prod
```

---

## Critical Steps

1. **Set Production Environment Variables**
   - Use LIVE payment keys (not test!)
   - Generate new secrets for production
   - See `ENV_SETUP.md` for complete list

2. **Update Payment Provider Webhooks**
   - Stripe: `https://yourdomain.com/api/stripe/webhook`
   - LemonSqueezy: `https://yourdomain.com/api/payments/lemonsqueezy/webhook`
   - etc.

3. **Run Database Migrations**

   ```bash
   npm run migrate:prod
   ```

4. **Test Payment Flow**
   - Complete a small test transaction
   - Verify webhook received
   - Check database record

---

## Documentation

- **Full Guide**: `PRODUCTION_DEPLOYMENT.md`
- **Quick Checklist**: `PRODUCTION_CHECKLIST.md`
- **Environment Setup**: `ENV_SETUP.md`
- **Payment Setup**: `PAYMENT_SETUP.md`

---

## Need Help?

1. Run pre-production check: `npm run preprod:check`
2. Check deployment logs
3. Verify environment variables
4. Test health endpoint: `/api/health`
5. Review `PRODUCTION_DEPLOYMENT.md`

---

**Ready?** → `npm run deploy:full`

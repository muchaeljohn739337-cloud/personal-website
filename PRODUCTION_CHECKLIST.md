# 🚀 Production Deployment Checklist

Quick reference checklist before going live.

## Pre-Deployment

- [ ] **Code Quality**
  - [ ] All tests passing: `npm test`
  - [ ] E2E tests passing: `npm run test:e2e`
  - [ ] Linter passes: `npm run lint`
  - [ ] TypeScript compiles: `npm run build`
  - [ ] Pre-production check: `npm run preprod:check`

- [ ] **Environment Variables** (Set in Vercel/Cloudflare/Docker)
  - [ ] `NODE_ENV=production`
  - [ ] `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
  - [ ] `NEXTAUTH_URL=https://yourdomain.com`
  - [ ] `DATABASE_URL` (Production database)
  - [ ] `JWT_SECRET` (New, random, 64+ chars)
  - [ ] `SESSION_SECRET` (New, random, 32+ chars)
  - [ ] `NEXTAUTH_SECRET` (New, random, 32+ chars)

- [ ] **Payment Providers** (LIVE keys, not test!)
  - [ ] Stripe: `sk_live_...` and `pk_live_...`
  - [ ] LemonSqueezy: Production API key
  - [ ] NOWPayments: Production API key
  - [ ] Alchemy Pay: Production credentials
  - [ ] All webhook secrets configured

- [ ] **Database**
  - [ ] Production database created
  - [ ] Migrations ready: `npm run prisma:migrate deploy`
  - [ ] Backups configured
  - [ ] SSL/TLS enabled

- [ ] **Security**
  - [ ] All secrets in platform (not in code)
  - [ ] HTTPS/SSL configured
  - [ ] Security headers enabled
  - [ ] Rate limiting enabled
  - [ ] DDoS protection (Cloudflare) enabled

## Deployment

- [ ] **Deploy Application**
  - [ ] Vercel: `npm run deploy:prod`
  - [ ] Cloudflare: `npm run deploy:worker:prod`
  - [ ] Docker: `docker-compose -f docker-compose.prod.yml up -d`

- [ ] **Run Migrations**
  - [ ] `npm run migrate:prod`

- [ ] **Verify Deployment**
  - [ ] Health check: `npm run verify:prod`
  - [ ] Site loads: https://yourdomain.com
  - [ ] Admin tests: `/api/admin/tests?action=full`

## Post-Deployment

- [ ] **Webhooks** (Update URLs in provider dashboards)
  - [ ] Stripe: `https://yourdomain.com/api/stripe/webhook`
  - [ ] LemonSqueezy: `https://yourdomain.com/api/payments/lemonsqueezy/webhook`
  - [ ] NOWPayments: `https://yourdomain.com/api/payments/nowpayments/webhook`
  - [ ] Alchemy Pay: `https://yourdomain.com/api/payments/alchemypay/webhook`

- [ ] **Test Payment Flows**
  - [ ] Stripe checkout (small test transaction)
  - [ ] Verify webhook events received
  - [ ] Check transaction in database

- [ ] **DNS & SSL**
  - [ ] Domain points to deployment
  - [ ] SSL certificate active
  - [ ] HTTPS redirects working
  - [ ] Email records (SPF, DKIM, DMARC)

- [ ] **Monitoring**
  - [ ] Sentry capturing errors
  - [ ] Logs streaming
  - [ ] Uptime monitoring active
  - [ ] Alerts configured

- [ ] **Functionality Tests**
  - [ ] User registration works
  - [ ] User login works
  - [ ] Dashboard accessible
  - [ ] Admin panel accessible
  - [ ] Payment checkout works
  - [ ] Webhooks processing correctly

## Final Verification

- [ ] All critical features working
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] Security measures active
- [ ] Team notified
- [ ] Rollback plan ready

---

**Ready to go live?** Run: `npm run deploy:full`

**Full guide:** See `PRODUCTION_DEPLOYMENT.md`

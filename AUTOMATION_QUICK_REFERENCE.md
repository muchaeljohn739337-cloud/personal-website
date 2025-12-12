# ⚡ Advancia SaaS Automation - Quick Reference

**One-page cheat sheet for solo operators**  
**Last Updated:** December 2025

---

## 💳 Payment Methods at a Glance

| Method        | Activation Time | Automation | Command                   |
| ------------- | --------------- | ---------- | ------------------------- |
| Stripe (Card) | Instant         | ✅ Full    | Auto via webhook          |
| Bitcoin       | ~30 min         | ✅ Full    | `pm2 logs crypto-monitor` |
| Ethereum/USDC | ~5 min          | ✅ Full    | `pm2 logs crypto-monitor` |
| Bank Transfer | 1-3 days        | ✅ Semi    | `npm run plaid:sync`      |
| Wire Transfer | 1-2 days        | ✅ Semi    | Admin Dashboard → Match   |
| ACH           | 3-5 days        | 🟡 Dev     | Coming soon               |
| Cash/Check    | Manual          | ✅ Manual  | Admin → Record Payment    |

---

## 🔄 Cron Job Schedule

| Time        | Task                     | Check Status                      |
| ----------- | ------------------------ | --------------------------------- |
| Every 30s   | Crypto monitoring        | `pm2 logs crypto-monitor`         |
| Every 2 min | Status page watchdog     | `pm2 logs advancia-watchdog`      |
| Every hour  | Bank reconciliation      | `tail -f logs/plaid-sync.log`     |
| Daily 2 AM  | Subscription renewals    | Check Slack/Email                 |
| Daily 3 AM  | Trial expiration cleanup | `psql -c "SELECT * FROM trials;"` |
| Daily 8 AM  | Daily revenue report     | Check email                       |
| Daily 9 AM  | Failed payment retry     | Check Slack                       |
| Daily 10 AM | Invoice auto-send        | Check email logs                  |
| Daily 11 PM | QuickBooks sync          | Check QuickBooks dashboard        |
| Weekly Mon  | Churn analysis           | Check email                       |

---

## 🚨 Emergency Commands

### All Services Down

```bash
pm2 kill && npm run start:all && pm2 save
```

### Crypto Payment Stuck

```bash
# 1. Check blockchain
# Bitcoin: https://blockstream.info/address/{address}
# Ethereum: https://etherscan.io/address/{address}

# 2. Manual confirm (if on blockchain)
npm run crypto:manual-confirm -- --invoice-id={id} --tx-hash={hash}

# 3. Restart monitoring
pm2 restart crypto-monitor
```

### Bank Transfer Lost

```bash
# Search for amount in recent transactions
npm run bank:search -- --amount={amount} --date={YYYY-MM-DD}

# Manual record via admin dashboard
open http://localhost:3000/admin/payments/manual
```

### Webhook Not Received

```bash
# Test Stripe webhook
stripe listen --forward-to localhost:4000/api/webhooks/stripe

# Check webhook logs
tail -f logs/webhooks.log

# Re-send from Stripe Dashboard
# https://dashboard.stripe.com/webhooks → Select webhook → Resend
```

---

## 📊 Key Dashboards

| Dashboard            | URL                                      | Purpose                  |
| -------------------- | ---------------------------------------- | ------------------------ |
| Status Page          | `http://localhost/status`                | System health            |
| Admin Dashboard      | `http://localhost:3000/admin`            | All operations           |
| Payment Management   | `http://localhost:3000/admin/payments`   | Manual payment recording |
| Automation Analytics | `http://localhost:3000/admin/automation` | Automation performance   |
| Stripe Dashboard     | `https://dashboard.stripe.com`           | Card payments & webhooks |
| QuickBooks           | `https://quickbooks.intuit.com`          | Accounting               |
| Plaid Dashboard      | `https://dashboard.plaid.com`            | Bank connection status   |
| PM2 Monitor          | `pm2 monit`                              | Process CPU/memory       |

---

## 🔍 Health Checks

### Quick Status Check

```bash
npm run health:check-all
# Or manually:
curl http://localhost:4000/api/health
curl http://localhost:3000/api/healthcheck
curl http://localhost:4000/api/crypto/health
curl http://localhost:4000/api/plaid/health
```

### Check All Logs

```bash
pm2 logs --lines 50
# Or specific:
pm2 logs advancia-backend
pm2 logs crypto-monitor
pm2 logs advancia-watchdog
```

### Database Status

```bash
# Quick check
psql -U postgres -d advancia -c "SELECT COUNT(*) FROM users;"

# Pending invoices
psql -U postgres -d advancia -c "SELECT * FROM invoices WHERE status='pending';"

# Today's revenue
psql -U postgres -d advancia -c "SELECT SUM(amount) FROM payments WHERE created_at >= CURRENT_DATE;"
```

---

## 💰 Manual Payment Recording (Admin)

### Via Admin Dashboard

1. Go to `http://localhost:3000/admin/payments/manual`
2. Select user
3. Enter amount, method, reference
4. Upload proof (optional)
5. Click "Record Payment"
6. Customer receives receipt email automatically

### Via API (cURL)

```bash
curl -X POST http://localhost:4000/api/payments/manual/record \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id_here",
    "amount": 99.99,
    "method": "bank_transfer",
    "reference": "Wire confirmation #12345",
    "notes": "Annual subscription payment"
  }'
```

---

## 🔧 Configuration Files

| File                                    | Purpose                | Edit When                    |
| --------------------------------------- | ---------------------- | ---------------------------- |
| `backend/.env`                          | All environment vars   | Adding API keys              |
| `ecosystem.config.js`                   | PM2 process management | Changing ports/memory limits |
| `status-page/config/notifications.json` | Alert thresholds       | Adjusting sensitivity        |
| `backend/src/config/index.ts`           | CORS origins, domains  | Adding new frontend URLs     |
| `backend/prisma/schema.prisma`          | Database schema        | Adding new models/fields     |
| `frontend/next.config.js`               | Next.js build config   | Adding env vars to frontend  |

---

## 📞 Support Contacts

| Service    | Support URL                           | Notes             |
| ---------- | ------------------------------------- | ----------------- |
| Stripe     | `https://support.stripe.com`          | 24/7 chat         |
| Plaid      | `https://dashboard.plaid.com/support` | Email support     |
| Vercel     | `https://vercel.com/support`          | Live chat         |
| Render     | `https://render.com/support`          | Email + community |
| Cloudflare | `https://dash.cloudflare.com/support` | Email (free tier) |
| PostgreSQL | `https://www.postgresql.org/support/` | Community forums  |

---

## 📈 Performance Targets

| Metric                | Target     | Command to Check                                              |
| --------------------- | ---------- | ------------------------------------------------------------- |
| API Response Time     | <200ms p95 | `curl -w "@curl-format.txt" http://localhost:4000/api/health` |
| Uptime                | >99.9%     | Status page                                                   |
| Error Rate            | <0.1%      | `pm2 logs \| grep ERROR \| wc -l`                             |
| Crypto Confirmation   | <30 min    | Check crypto-monitor logs                                     |
| Bank Reconciliation   | <24 hours  | Check Plaid sync logs                                         |
| Support Response      | <2 min     | AI chatbot (when implemented)                                 |
| Manual Task Time/Week | <10 hours  | Track in spreadsheet                                          |

---

## 🚀 Deployment Checklist

Before deploying new features:

- [ ] Run tests: `npm test` (backend) and `npx playwright test` (frontend)
- [ ] Type check: `npm run type-check` (both)
- [ ] Check errors: `npm run lint`
- [ ] Database migration: `npx prisma migrate dev` → `prisma migrate deploy`
- [ ] Update `.env` on production server
- [ ] Build frontend: `npm run build`
- [ ] Restart services: `pm2 restart all`
- [ ] Check health endpoints
- [ ] Monitor logs for 5 minutes: `pm2 logs`
- [ ] Test payment flows (Stripe, crypto, bank)
- [ ] Verify email sending works
- [ ] Check status page: `http://advanciapayledger.com/status`

---

## 🎯 Quick Wins

### This Week

1. Set up Slack alerts for failed payments
2. Test all payment methods with small amounts
3. Configure QuickBooks OAuth connection
4. Review daily revenue reports

### This Month

1. Optimize crypto monitoring for cost savings
2. Complete ACH payment integration
3. Build cash flow forecasting dashboard
4. Set up referral program tracking

### This Quarter

1. Implement AI chatbot for support
2. Add fraud detection (Stripe Radar)
3. Build customer success automation
4. Create mobile app MVP

---

**🎉 Keep this file bookmarked for instant access to critical commands and workflows!**

**Time to focus on growth, not operations.** 🚀

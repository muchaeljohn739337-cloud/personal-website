# 🚀 Deployment Action Plan - Step by Step

**Project:** Advancia PayLedger  
**Domain:** advanciapayledger.com  
**Vercel Project ID:** prj_HQeqbbLNwAvvT5vdL3krVh9vndDH

---

## ⚠️ **CRITICAL: Complete These Steps in Order**

### 🔴 **STEP 1: Security - Rotate Supabase Service Role Key** (5 minutes)

**Status:** ⚠️ **REQUIRED** - Key was exposed in git history

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api

2. **Rotate the Service Role Key:**
   - Find `service_role` key section
   - Click **"Reset"** or **"Regenerate"**
   - **Copy the new key immediately** (it won't be shown again)
   - Save it securely (password manager)

3. **Update in all locations:**
   - ✅ `.env.local` (local development)
   - ✅ Vercel environment variables (production)
   - ✅ Cloudflare Workers secrets (if using)
   - ✅ Any other deployment platforms

**⚠️ DO NOT proceed until this is done!**

---

### 🟠 **STEP 2: Set Vercel Environment Variables** (15 minutes)

**Status:** ⚠️ **REQUIRED** - All deployments are failing without these

#### 2.1 Generate Secrets (Already Done)

Secrets have been generated. Use these values:

```bash
JWT_SECRET=O8GK90C/4OTkv9LIdGD/1w3ecr6Rg9D7ReBVSjvimzo=
SESSION_SECRET=bifpAT0dkstelnqiF2ODAymOhY6ywIQntGB22Li8ABM=
NEXTAUTH_SECRET=+hJjoM/7w8IPwIbk6wpCasjS0S9edHITRwm99VCDaHo=
CRON_SECRET=RfbURq7b8yKsHPbVp1vj3u5v9yuFbzW28mPyWgGij/E=
```

#### 2.2 Set Variables in Vercel Dashboard

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select project: `personal-website`

2. **Navigate to Environment Variables:**
   - Settings → Environment Variables

3. **Add Each Variable (Select "Production" environment):**

**Core Secrets:**

```
JWT_SECRET=O8GK90C/4OTkv9LIdGD/1w3ecr6Rg9D7ReBVSjvimzo=
SESSION_SECRET=bifpAT0dkstelnqiF2ODAymOhY6ywIQntGB22Li8ABM=
NEXTAUTH_SECRET=+hJjoM/7w8IPwIbk6wpCasjS0S9edHITRwm99VCDaHo=
CRON_SECRET=RfbURq7b8yKsHPbVp1vj3u5v9yuFbzW28mPyWgGij/E=
```

**Application URLs:**

```
NEXT_PUBLIC_APP_URL=https://advanciapayledger.com
NEXTAUTH_URL=https://advanciapayledger.com
```

**Database:**

```
DATABASE_URL=<your_production_database_url>
DIRECT_URL=<your_production_direct_database_url>  # Optional
```

**Supabase:**

```
NEXT_PUBLIC_SUPABASE_URL=https://xesecqcqzykvmrtxrzqi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your_publishable_key>
SUPABASE_SERVICE_ROLE_KEY=<new_rotated_key_from_step_1>
```

**Optional but Recommended:**

```
REDIS_URL=<your_redis_url>  # If using Redis
SMTP_HOST=<your_smtp_host>  # If sending emails
SMTP_FROM=noreply@advanciapayledger.com
```

#### 2.3 Verify Variables Are Set

```bash
npm run verify:vercel:env
```

**Expected:** All required variables should show ✅

---

### 🟡 **STEP 3: Pre-Deployment Verification** (10 minutes)

#### 3.1 Run Deployment Checklist

```bash
npm run deploy:checklist
```

This will verify:

- ✅ Security checks
- ✅ Environment variables
- ✅ Build process
- ✅ Database connection
- ✅ Supabase connection

#### 3.2 Run Pre-Production Checks

```bash
npm run preprod:check
```

#### 3.3 Test Local Build

```bash
npm run build
```

**Expected:** Build should complete successfully

---

### 🟢 **STEP 4: Database Preparation** (5 minutes)

#### 4.1 Verify Database Connection

1. Test `DATABASE_URL` is accessible
2. Ensure database allows connections from Vercel IPs
3. Check SSL is enabled if required

#### 4.2 Prepare Migrations

```bash
npx prisma migrate status
```

**Expected:** All migrations should be ready

---

### 🔵 **STEP 5: Deploy to Vercel** (10 minutes)

#### 5.1 Deploy Application

**Option A: Via Vercel Dashboard**

1. Go to: https://vercel.com/dashboard
2. Select project: `personal-website`
3. Go to **Deployments**
4. Click **"Redeploy"** on latest deployment
5. Wait for deployment to complete

**Option B: Via CLI**

```bash
npm run deploy:prod
```

#### 5.2 Monitor Deployment

- Watch deployment logs in Vercel Dashboard
- Check for any build errors
- Verify deployment completes successfully

#### 5.3 Run Database Migrations

```bash
npm run migrate:prod
```

**Or via Vercel:**

- Go to Vercel Dashboard → Project Settings → Environment Variables
- Add `DATABASE_URL` if not already set
- Run migrations manually or via CI/CD

---

### ⚪ **STEP 6: Post-Deployment Verification** (15 minutes)

#### 6.1 Verify Deployment Health

```bash
npm run verify:prod
```

**Or manually:**

```bash
curl https://advanciapayledger.com/api/health
```

**Expected:** Should return `{"status":"healthy"}`

#### 6.2 Test Critical Features

**Manual Testing Checklist:**

- [ ] **Homepage loads:**
  - Visit: https://advanciapayledger.com
  - Should load without errors

- [ ] **User Registration:**
  - Go to: https://advanciapayledger.com/auth/register
  - Create a test account
  - Verify email verification (if enabled)

- [ ] **User Login:**
  - Go to: https://advanciapayledger.com/auth/login
  - Login with test account
  - Verify session persists

- [ ] **Dashboard Access:**
  - After login, verify dashboard loads
  - Check for any errors in console

- [ ] **Admin Panel:**
  - If you have admin account, test admin panel
  - Verify admin features work

- [ ] **API Endpoints:**
  - Test: https://advanciapayledger.com/api/health
  - Test: https://advanciapayledger.com/api/system/status

#### 6.3 Check Logs

1. **Vercel Logs:**
   - Go to Vercel Dashboard → Deployments → Latest
   - Check "Functions" tab for any errors

2. **Supabase Logs:**
   - Go to Supabase Dashboard → Logs
   - Check for any connection errors

3. **Error Tracking:**
   - Check Sentry (if configured) for errors
   - Review any error notifications

---

### 🟣 **STEP 7: Payment Providers Setup** (If Using Payments)

#### 7.1 Configure Webhooks

Update webhook URLs in payment provider dashboards:

**Stripe:**

- URL: `https://advanciapayledger.com/api/stripe/webhook`
- Dashboard: https://dashboard.stripe.com/webhooks

**LemonSqueezy:**

- URL: `https://advanciapayledger.com/api/payments/lemonsqueezy/webhook`
- Dashboard: https://app.lemonsqueezy.com/settings/webhooks

**NOWPayments:**

- URL: `https://advanciapayledger.com/api/payments/nowpayments/webhook`
- Dashboard: https://nowpayments.io/dashboard

**Alchemy Pay:**

- URL: `https://advanciapayledger.com/api/payments/alchemypay/webhook`
- Dashboard: https://dashboard.alchemypay.org

#### 7.2 Test Payment Flow

1. Use test mode first
2. Complete a small test transaction
3. Verify webhook is received
4. Check transaction in database

---

### 🔵 **STEP 8: Monitoring & Alerts** (10 minutes)

#### 8.1 Set Up Monitoring

- [ ] **Sentry Error Tracking:**
  - Verify Sentry is capturing errors
  - Set up alert notifications

- [ ] **Uptime Monitoring:**
  - Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
  - Configure alerts for downtime

- [ ] **Health Checks:**
  - Verify: https://advanciapayledger.com/api/health
  - Set up automated health check monitoring

#### 8.2 Configure Alerts

- Email alerts for errors
- Slack/Discord notifications (if using)
- SMS alerts for critical issues

---

## ✅ **Final Verification Checklist**

Before announcing launch:

- [ ] ✅ Supabase Service Role Key rotated
- [ ] ✅ All Vercel environment variables set
- [ ] ✅ Deployment successful
- [ ] ✅ Database migrations applied
- [ ] ✅ Health check passes
- [ ] ✅ Homepage loads correctly
- [ ] ✅ User registration works
- [ ] ✅ User login works
- [ ] ✅ Dashboard accessible
- [ ] ✅ Admin panel works (if applicable)
- [ ] ✅ Payment flow works (if applicable)
- [ ] ✅ Webhooks configured
- [ ] ✅ Monitoring active
- [ ] ✅ No critical errors in logs
- [ ] ✅ SSL certificate active
- [ ] ✅ Domain resolves correctly

---

## 🆘 **Troubleshooting**

### Deployment Fails

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Deployments → Latest
   - Review build logs for errors

2. **Verify Environment Variables:**

   ```bash
   npm run verify:vercel:env
   ```

3. **Check Build Locally:**
   ```bash
   npm run build
   ```

### Health Check Fails

1. **Check Database Connection:**
   - Verify `DATABASE_URL` is correct
   - Test connection from Vercel environment

2. **Check Supabase Connection:**
   - Verify Supabase keys are correct
   - Test API access

3. **Review Function Logs:**
   - Check Vercel function logs for errors

### Features Not Working

1. **Check Environment Variables:**
   - Ensure all required variables are set
   - Verify variable names match exactly

2. **Check Database:**
   - Verify migrations are applied
   - Check database is accessible

3. **Review Error Logs:**
   - Check Sentry for errors
   - Review Vercel function logs

---

## 📚 **Quick Reference**

**Commands:**

```bash
# Generate secrets
npm run generate:prod:secrets

# Verify environment variables
npm run verify:vercel:env

# Run deployment checklist
npm run deploy:checklist

# Pre-production checks
npm run preprod:check

# Deploy to production
npm run deploy:prod

# Run migrations
npm run migrate:prod

# Verify deployment
npm run verify:prod
```

**Links:**

- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi
- Project URL: https://advanciapayledger.com

---

## 🎯 **Next Steps After Launch**

1. **Monitor Closely:**
   - Watch logs for first 24 hours
   - Monitor error rates
   - Check performance metrics

2. **User Testing:**
   - Test with real users
   - Gather feedback
   - Fix any issues quickly

3. **Optimization:**
   - Monitor performance
   - Optimize slow queries
   - Improve user experience

---

**Last Updated:** 2025-01-27  
**Status:** Ready for deployment - Follow steps in order

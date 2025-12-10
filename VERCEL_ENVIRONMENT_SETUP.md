# 🚀 Vercel Environment Variables Setup Guide

**Project ID:** `prj_HQeqbbLNwAvvT5vdL3krVh9vndDH`  
**Project Name:** `personal-website`  
**Domain:** `advanciapayledger.com`

---

## ⚠️ **CRITICAL: All Deployments Are Failing**

All recent deployments are failing due to missing environment variables. Follow this guide to fix them.

---

## 📋 Required Environment Variables

### 🔴 **CRITICAL - Must Set Immediately**

These are **REQUIRED** for the application to build and run:

```bash
# Core Secrets (Generate new ones for production!)
JWT_SECRET=<generate_with_openssl_rand_base64_32>
SESSION_SECRET=<generate_with_openssl_rand_base64_32>
NEXTAUTH_SECRET=<generate_with_openssl_rand_base64_32>

# Database Connection
DATABASE_URL=<your_production_database_url>
DIRECT_URL=<your_production_direct_database_url>  # Optional but recommended

# Application URLs
NEXT_PUBLIC_APP_URL=https://advanciapayledger.com
NEXTAUTH_URL=https://advanciapayledger.com

# Supabase (Required for Supabase features)
NEXT_PUBLIC_SUPABASE_URL=https://xesecqcqzykvmrtxrzqi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your_publishable_key>
# OR
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>

# Supabase Service Role Key (Server-side only - NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

### ⚠️ **IMPORTANT - Should Set**

These are recommended for full functionality:

```bash
# Cron Jobs
CRON_SECRET=<generate_with_openssl_rand_base64_32>

# Redis (Optional - for caching and rate limiting)
REDIS_URL=<your_redis_url>

# Email (Optional - for sending emails)
SMTP_HOST=<your_smtp_host>
SMTP_PORT=587
SMTP_USER=<your_smtp_user>
SMTP_PASSWORD=<your_smtp_password>
SMTP_FROM=noreply@advanciapayledger.com
```

### 💳 **Payment Providers (Optional)**

Set these if you're using payment providers:

```bash
# Stripe
STRIPE_SECRET_KEY=<your_stripe_secret_key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
STRIPE_WEBHOOK_SECRET=<your_stripe_webhook_secret>

# LemonSqueezy
LEMONSQUEEZY_API_KEY=<your_lemonsqueezy_api_key>
LEMONSQUEEZY_STORE_ID=<your_store_id>
LEMONSQUEEZY_WEBHOOK_SECRET=<your_webhook_secret>

# NOWPayments
NOWPAYMENTS_API_KEY=<your_nowpayments_api_key>
NOWPAYMENTS_IPN_SECRET=<your_ipn_secret>

# Alchemy Pay
ALCHEMY_PAY_API_URL=<api_url>
ALCHEMY_PAY_APP_ID=<app_id>
ALCHEMY_PAY_APP_SECRET=<app_secret>
```

### 📊 **Monitoring (Optional)**

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=<your_sentry_dsn>
SENTRY_ORG=<your_org>
SENTRY_PROJECT=<your_project>
SENTRY_AUTH_TOKEN=<your_auth_token>

# LogRocket
NEXT_PUBLIC_LOGROCKET_APP_ID=<your_logrocket_app_id>
```

---

## 🛠️ **How to Set Environment Variables in Vercel**

### Method 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select project: `personal-website`

2. **Navigate to Settings:**
   - Click on your project
   - Go to **Settings** → **Environment Variables**

3. **Add Each Variable:**
   - Click **Add New**
   - Enter variable name (e.g., `JWT_SECRET`)
   - Enter variable value
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

4. **Repeat for all required variables**

5. **Redeploy:**
   - Go to **Deployments**
   - Click **...** on latest deployment
   - Click **Redeploy**

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Add environment variables
vercel env add JWT_SECRET production
vercel env add SESSION_SECRET production
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXTAUTH_URL production

# Pull environment variables to verify
vercel env pull .env.local
```

---

## 🔑 **Generate Secrets**

### Using OpenSSL (Recommended)

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate SESSION_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 32
```

### Using Node.js

```bash
# Generate all secrets at once
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('CRON_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
```

### Using Online Generator

- https://generate-secret.vercel.app/32 (for 32-byte secrets)

---

## 📝 **Step-by-Step Setup**

### Step 1: Generate Secrets

```bash
# Run these commands and save the output
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # SESSION_SECRET
openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -base64 32  # CRON_SECRET
```

### Step 2: Get Supabase Keys

1. Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### Step 3: Get Database URL

1. Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/database
2. Under **Connection string**, select **Connection pooling**
3. Copy connection string → `DATABASE_URL`
4. Replace `[YOUR-PASSWORD]` with your database password

### Step 4: Set All Variables in Vercel

1. Go to: https://vercel.com/dashboard
2. Select project: `personal-website`
3. Go to **Settings** → **Environment Variables**
4. Add each variable from the list above
5. **Important:** Select **Production** environment for all variables

### Step 5: Redeploy

1. Go to **Deployments**
2. Click **...** on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete
5. Check deployment logs for errors

---

## ✅ **Verification Checklist**

After setting all variables, verify:

- [ ] All required variables are set in Vercel
- [ ] Variables are set for **Production** environment
- [ ] No typos in variable names
- [ ] All secrets are properly generated (32+ characters)
- [ ] Database URL is correct and accessible
- [ ] Supabase keys are correct
- [ ] Application URLs point to `https://advanciapayledger.com`
- [ ] Deployment succeeds after setting variables

---

## 🔍 **Verify Environment Variables**

### Check via Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select project: `personal-website`
3. Go to **Settings** → **Environment Variables**
4. Verify all required variables are listed

### Check via Vercel CLI

```bash
# List all environment variables
vercel env ls

# Pull environment variables to verify
vercel env pull .env.local
```

### Check via API Route

After deployment, you can check if variables are set (without exposing values):

```bash
# This will show which variables are set (not their values)
curl https://advanciapayledger.com/api/health
```

---

## 🚨 **Common Issues**

### Issue 1: Variables Not Applied

**Problem:** Set variables but deployment still fails

**Solution:**
- Ensure variables are set for **Production** environment
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

### Issue 2: Build Fails

**Problem:** Build fails even with variables set

**Solution:**
- Check build logs in Vercel dashboard
- Verify `DATABASE_URL` is accessible from Vercel
- Check for TypeScript errors (even if ignored in build)
- Ensure `prisma generate` runs before build

### Issue 3: Runtime Errors

**Problem:** Deployment succeeds but app crashes at runtime

**Solution:**
- Check function logs in Vercel dashboard
- Verify all required variables are set
- Check database connection
- Review API route error handling

---

## 📊 **Quick Reference: All Required Variables**

Copy this list and check off as you add each one:

```bash
# Core Secrets
[ ] JWT_SECRET
[ ] SESSION_SECRET
[ ] NEXTAUTH_SECRET

# Database
[ ] DATABASE_URL
[ ] DIRECT_URL (optional)

# URLs
[ ] NEXT_PUBLIC_APP_URL
[ ] NEXTAUTH_URL

# Supabase
[ ] NEXT_PUBLIC_SUPABASE_URL
[ ] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
[ ] SUPABASE_SERVICE_ROLE_KEY

# Optional but Recommended
[ ] CRON_SECRET
[ ] REDIS_URL
[ ] SMTP_HOST
[ ] SMTP_FROM
```

---

## 🔗 **Quick Links**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Project Settings:** https://vercel.com/dashboard/[your-team]/personal-website/settings
- **Environment Variables:** https://vercel.com/dashboard/[your-team]/personal-website/settings/environment-variables
- **Supabase Dashboard:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi
- **Supabase API Settings:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api

---

## 📞 **Need Help?**

If deployments still fail after setting all variables:

1. Check deployment logs in Vercel dashboard
2. Review error messages carefully
3. Verify all variable names match exactly
4. Ensure variables are set for **Production** environment
5. Try redeploying after a few minutes

---

**Last Updated:** 2025-01-27  
**Status:** ⚠️ **Action Required** - Set all environment variables to fix deployments


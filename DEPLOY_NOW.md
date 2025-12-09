# 🚀 Deploy to Production - Quick Guide

## Option 1: Deploy via Vercel CLI (Recommended)

### Step 1: Install Vercel CLI (if not installed)

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy to Production

```bash
vercel --prod
```

This will:

- Build your application
- Deploy to production
- Show you the deployment URL

---

## Option 2: Deploy via GitHub (Automatic)

If your repository is connected to Vercel:

1. **Code is already pushed** ✅ (commit: `7b2c481`)
2. **Vercel will auto-deploy** when you push to `main`
3. **Check deployment status:**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - View latest deployment

---

## Option 3: Deploy via Vercel Dashboard

1. **Go to:** https://vercel.com/dashboard
2. **Select your project:** personal-website
3. **Click:** "Deployments" tab
4. **Click:** "Redeploy" on the latest deployment
   - Or click "Create Deployment" to deploy a specific commit

---

## ⚠️ IMPORTANT: Set Environment Variables First

Before deploying, make sure you've set all required environment variables:

### Quick Setup

```bash
# Generate secrets
npm run generate:prod-secrets

# Get setup guide
npm run setup:vercel-env
```

### Then set in Vercel

1. Go to: **Settings → Environment Variables**
2. Add all required variables for **Production** environment
3. **Redeploy** after adding variables

---

## Required Environment Variables

### Critical (Must Set)

- `JWT_SECRET` - Generate with `npm run generate:prod-secrets`
- `SESSION_SECRET` - Generate with `npm run generate:prod-secrets`
- `NEXTAUTH_SECRET` - Generate with `npm run generate:prod-secrets`
- `DATABASE_URL` - From Supabase
- `DIRECT_URL` - From Supabase
- `NEXT_PUBLIC_APP_URL` - `https://advanciapayledger.com`
- `NEXTAUTH_URL` - `https://advanciapayledger.com`
- `NEXT_PUBLIC_SUPABASE_URL` - From Supabase
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - From Supabase

### Recommended

- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase
- `CRON_SECRET` - Generate with `npm run generate:prod-secrets`
- `ANTHROPIC_API_KEY` - From Anthropic console

---

## After Deployment

### 1. Verify Deployment

```bash
npm run verify:prod
```

### 2. Test Admin Login

- URL: `https://advanciapayledger.com/auth/login`
- Email: `superadmin@advanciapayledger.com`
- Password: `QAZwsxEDC1!?`

### 3. Run Database Migrations (if needed)

```bash
npm run migrate:prod
```

---

## Troubleshooting

### Deployment Fails

- Check Vercel deployment logs
- Verify all environment variables are set
- Check build errors in logs

### Environment Variables Missing

- Go to Vercel Dashboard → Settings → Environment Variables
- Ensure variables are set for **Production** environment
- Redeploy after adding variables

### Database Connection Errors

- Verify `DATABASE_URL` is correct
- Check database is accessible
- Ensure database allows connections from Vercel IPs

---

**Ready to deploy?** Choose one of the options above! 🚀

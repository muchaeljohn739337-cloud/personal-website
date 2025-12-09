# 🚀 Production Deployment Steps

## ✅ Pre-Deployment Status

- ✅ Admin login verified
- ✅ TransformStream polyfill configured
- ✅ Database connected
- ✅ Changes committed
- ✅ Code ready for deployment

---

## Step 1: Push to Repository

```bash
git push origin main
```

This will trigger automatic deployment on Vercel (if connected).

---

## Step 2: Set Vercel Environment Variables

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

### Required Variables:

```bash
# Database
DATABASE_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres

# Supabase
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
NEXT_PUBLIC_SUPABASE_URL=https://xesecqcqzykvmrtxrzqi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your_publishable_key>

# Core Secrets
JWT_SECRET=<generate_with_openssl_rand_base64_32>
SESSION_SECRET=<generate_with_openssl_rand_base64_32>
NEXTAUTH_SECRET=<generate_with_openssl_rand_base64_32>

# Application URLs
NEXT_PUBLIC_APP_URL=https://advanciapayledger.com
NEXTAUTH_URL=https://advanciapayledger.com

# Anthropic Claude
ANTHROPIC_API_KEY=<your_anthropic_api_key_from_console>
```

**Important:** 
- Replace `[PASSWORD]` with your actual Supabase database password
- Generate secrets using: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

---

## Step 3: Verify Deployment

After deployment completes:

```bash
# Check health endpoint
curl https://advanciapayledger.com/api/health

# Or use script
npm run verify:prod
```

---

## Step 4: Test Admin Login

1. Navigate to: `https://advanciapayledger.com/auth/login`
2. Login with:
   - **Email:** `superadmin@advanciapayledger.com`
   - **Password:** `QAZwsxEDC1!?`
3. Verify redirect to admin dashboard

---

## Step 5: Run Migrations (if needed)

If database schema needs updating:

```bash
npm run migrate:prod
```

---

## ✅ Deployment Checklist

- [ ] Code pushed to repository
- [ ] Vercel environment variables set
- [ ] Deployment triggered/completed
- [ ] Health endpoint verified
- [ ] Admin login tested in production
- [ ] Database migrations run (if needed)

---

**Status**: Ready to deploy! 🚀


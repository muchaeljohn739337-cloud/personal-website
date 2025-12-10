# 🚀 Production Environment Variables Setup

Complete guide for setting up production environment variables on Vercel.

---

## Quick Start

### Step 1: Generate Production Secrets

```bash
npm run generate:prod-secrets
```

This will generate secure random secrets for:
- `JWT_SECRET`
- `SESSION_SECRET`
- `NEXTAUTH_SECRET`
- `CRON_SECRET`

**Copy the generated values** - you'll need them for Step 2.

---

### Step 2: Get Vercel Environment Setup Guide

```bash
npm run setup:vercel-env
```

This will:
- Read your local `.env.local` file
- Generate a comprehensive list of all required variables
- Show which values you already have
- Identify what still needs to be set

---

### Step 3: Set Variables in Vercel

1. Go to: **https://vercel.com/dashboard**
2. Select your project: **personal-website**
3. Navigate to: **Settings → Environment Variables**
4. Add each variable for **Production** environment
5. After adding all variables, trigger a **new deployment**

---

## Required Variables

### 🔴 Critical - Must Set

These are **REQUIRED** for the application to build and run:

| Variable | Description | How to Get |
|----------|-------------|------------|
| `JWT_SECRET` | Secret for JWT token signing | Generate with `npm run generate:prod-secrets` |
| `SESSION_SECRET` | Secret for session encryption | Generate with `npm run generate:prod-secrets` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Generate with `npm run generate:prod-secrets` |
| `DATABASE_URL` | PostgreSQL connection (pooling) | From Supabase dashboard |
| `NEXT_PUBLIC_APP_URL` | Public application URL | `https://advanciapayledger.com` |
| `NEXTAUTH_URL` | NextAuth callback URL | `https://advanciapayledger.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | From Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase publishable key | From Supabase dashboard |

### ⚠️ Important - Should Set

These are recommended for full functionality:

| Variable | Description | How to Get |
|----------|-------------|------------|
| `DIRECT_URL` | PostgreSQL direct connection | From Supabase dashboard (port 5432) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | From Supabase dashboard |
| `CRON_SECRET` | Secret for cron jobs | Generate with `npm run generate:prod-secrets` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | From https://console.anthropic.com/ |

---

## Database Connection Strings

### DATABASE_URL (Connection Pooling)

Use this for application connections (better performance):

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Port:** `6543` (pooling)  
**Parameter:** `pgbouncer=true`

### DIRECT_URL (Direct Connection)

Use this for migrations and Prisma operations:

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

**Port:** `5432` (direct)  
**No pgbouncer parameter**

**Note:** Replace `[PASSWORD]` with your actual Supabase database password.

---

## Supabase Keys

Get these from: **https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api**

1. **Project URL:**
   - `NEXT_PUBLIC_SUPABASE_URL=https://xesecqcqzykvmrtxrzqi.supabase.co`

2. **Publishable Key:**
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Service Role Key** (⚠️ Keep secret!):
   - `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Verification

After setting all variables:

1. **Trigger a new deployment** in Vercel
2. **Check deployment logs** for any missing variables
3. **Test the application:**
   ```bash
   npm run verify:prod
   ```
4. **Test admin login:**
   - Go to: `https://advanciapayledger.com/auth/login`
   - Email: `superadmin@advanciapayledger.com`
   - Password: `QAZwsxEDC1!?`

---

## Troubleshooting

### Deployment Fails with "Missing Environment Variable"

1. Check Vercel dashboard → Settings → Environment Variables
2. Ensure variable is set for **Production** environment
3. Verify variable name matches exactly (case-sensitive)
4. Redeploy after adding variables

### Database Connection Errors

1. Verify `DATABASE_URL` is correct
2. Check database password is correct
3. Ensure database allows connections from Vercel IPs
4. Try using `DIRECT_URL` for migrations

### Authentication Errors

1. Verify `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches your domain
3. Ensure `JWT_SECRET` and `SESSION_SECRET` are set
4. Regenerate secrets if compromised

---

## Security Best Practices

✅ **DO:**
- Generate unique secrets for production
- Use Vercel's environment variable encryption
- Set variables for specific environments (Production/Preview/Development)
- Rotate secrets periodically
- Use strong, random passwords

❌ **DON'T:**
- Commit secrets to git
- Share secrets in plain text
- Reuse development secrets in production
- Expose service role keys to client-side code

---

## Quick Reference Commands

```bash
# Generate production secrets
npm run generate:prod-secrets

# Get Vercel environment setup guide
npm run setup:vercel-env

# Verify production deployment
npm run verify:prod

# Run database migrations
npm run migrate:prod
```

---

**Status**: Ready to set up production environment variables! 🚀


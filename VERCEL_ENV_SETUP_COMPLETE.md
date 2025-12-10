# 🔐 Vercel Environment Variables - Complete Setup Guide

## 📋 Step-by-Step Instructions

### Step 1: Generate Production Secrets

Run this command to generate secure secrets:

```bash
npm run generate:prod-secrets
```

**Copy the generated values** - you'll need them in Step 3.

---

### Step 2: Get Your Database & Supabase Values

Run this command to see what values you already have:

```bash
npm run setup:vercel-env
```

This will show you:

- Which values are already in your `.env.local`
- Which values still need to be set
- Complete list of all required variables

---

### Step 3: Set Variables in Vercel Dashboard

1. **Go to:** https://vercel.com/dashboard
2. **Select your project:** `personal-website`
3. **Click:** Settings (in the top navigation)
4. **Click:** Environment Variables (in the left sidebar)
5. **For each variable below:**
   - Click "Add New"
   - Enter the variable name
   - Enter the variable value
   - Select **Production** environment
   - Click "Save"

---

## 🔴 Required Variables (Must Set)

### Core Secrets (Generate with `npm run generate:prod-secrets`)

| Variable          | Description                   | How to Get                          |
| ----------------- | ----------------------------- | ----------------------------------- |
| `JWT_SECRET`      | Secret for JWT token signing  | Run `npm run generate:prod-secrets` |
| `SESSION_SECRET`  | Secret for session encryption | Run `npm run generate:prod-secrets` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js        | Run `npm run generate:prod-secrets` |

### Database Connection

| Variable       | Description                     | How to Get                                                                                                                                                                    |
| -------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection (pooling) | From Supabase dashboard<br>Port: **6543**<br>Format: `postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL`   | PostgreSQL direct connection    | From Supabase dashboard<br>Port: **5432**<br>Format: `postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres`                |

**Note:** Replace `[PASSWORD]` with your actual Supabase database password.

### Application URLs

| Variable              | Value                           |
| --------------------- | ------------------------------- |
| `NEXT_PUBLIC_APP_URL` | `https://advanciapayledger.com` |
| `NEXTAUTH_URL`        | `https://advanciapayledger.com` |

### Supabase Configuration

| Variable                                       | Description              | How to Get                                                                                                  |
| ---------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Supabase project URL     | From Supabase dashboard<br>Value: `https://xesecqcqzykvmrtxrzqi.supabase.co`                                |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase publishable key | From Supabase dashboard<br>Go to: Settings → API → Project API keys<br>Copy the "anon" or "publishable" key |

---

## ⚠️ Recommended Variables (Should Set)

| Variable                    | Description               | How to Get                                                                                                         |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | From Supabase dashboard<br>Settings → API → Project API keys<br>Copy the "service_role" key<br>⚠️ **Keep secret!** |
| `CRON_SECRET`               | Secret for cron jobs      | Run `npm run generate:prod-secrets`                                                                                |
| `ANTHROPIC_API_KEY`         | Anthropic Claude API key  | From https://console.anthropic.com/                                                                                |

---

## 📝 Quick Copy Format

After running `npm run generate:prod-secrets`, you'll get output like this:

```
# Production Secrets (Copy to Vercel)
JWT_SECRET=<generated_value>
SESSION_SECRET=<generated_value>
NEXTAUTH_SECRET=<generated_value>
CRON_SECRET=<generated_value>
```

**Copy each value** and paste it into Vercel.

---

## ✅ Verification Checklist

After setting all variables:

- [ ] All 9 required variables set in Vercel
- [ ] Variables set for **Production** environment
- [ ] No typos in variable names (case-sensitive!)
- [ ] Database passwords are correct
- [ ] Supabase keys are correct
- [ ] Application URLs are correct

---

## 🔄 After Setting Variables

1. **Redeploy** your application:
   - Go to Vercel Dashboard → Deployments
   - Click "Redeploy" on the latest deployment
   - Or wait for auto-redeploy (if enabled)

2. **Verify deployment:**

   ```bash
   npm run verify:prod
   ```

3. **Test admin login:**
   - URL: `https://advanciapayledger.com/auth/login`
   - Email: `superadmin@advanciapayledger.com`
   - Password: `QAZwsxEDC1!?`

---

## 🆘 Troubleshooting

### Variable Not Working

- ✅ Check variable name matches exactly (case-sensitive)
- ✅ Ensure it's set for **Production** environment
- ✅ Redeploy after adding variables
- ✅ Check Vercel deployment logs for errors

### Database Connection Errors

- ✅ Verify `DATABASE_URL` uses port **6543** with `pgbouncer=true`
- ✅ Verify `DIRECT_URL` uses port **5432** without pgbouncer
- ✅ Check database password is correct
- ✅ Ensure database allows connections from Vercel IPs

### Authentication Errors

- ✅ Verify all three secrets are set: `JWT_SECRET`, `SESSION_SECRET`, `NEXTAUTH_SECRET`
- ✅ Check `NEXTAUTH_URL` matches your domain exactly
- ✅ Regenerate secrets if you suspect they're incorrect

---

## 📚 Additional Resources

- **Vercel Docs:** https://vercel.com/docs/concepts/projects/environment-variables
- **Supabase Dashboard:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api
- **Anthropic Console:** https://console.anthropic.com/

---

**Status**: Ready to set up environment variables! 🚀

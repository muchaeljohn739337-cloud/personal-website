# 🚨 CRITICAL: Fix DATABASE_URL in Vercel

**Status:** ⚠️ **BLOCKING** - Deployment will not work without this

---

## ❌ **Current Issue**

Vercel logs show:

```
error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

**This means:** `DATABASE_URL` is either missing or invalid in Vercel environment variables.

---

## ✅ **Fix Steps (Do This Now)**

### **1. Go to Vercel Dashboard**

- https://vercel.com/dashboard
- Select project: `personal-website`
- Settings → Environment Variables

### **2. Add DATABASE_URL**

- Click **"Add New"**
- Variable name: `DATABASE_URL`
- Value: Your production database connection string
- Format: `postgresql://user:password@host:port/database?sslmode=require`
- Environment: Select **Production** (and Preview/Development if needed)
- Click **"Save"**

### **3. Example Format (Supabase)**

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**Replace:**

- `[PASSWORD]` with your actual Supabase database password
- Use port `6543` for connection pooling
- Include `pgbouncer=true` for Supabase

### **4. Also Add DIRECT_URL (Optional but Recommended)**

- Variable name: `DIRECT_URL`
- Value: Same as DATABASE_URL but:
  - Use port `5432` (not 6543)
  - Remove `pgbouncer=true`
- Environment: **Production**

---

## 📋 **Complete Environment Variables Checklist**

After fixing DATABASE_URL, verify these are also set:

- [x] `DATABASE_URL` - **CRITICAL - Fix this first!**
- [ ] `DIRECT_URL` - Optional but recommended
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - NEW rotated key
- [ ] `JWT_SECRET` - Generated secret
- [ ] `SESSION_SECRET` - Generated secret
- [ ] `NEXTAUTH_SECRET` - Generated secret
- [ ] `NEXT_PUBLIC_APP_URL` - `https://advanciapayledger.com`
- [ ] `NEXTAUTH_URL` - `https://advanciapayledger.com`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - `https://xesecqcqzykvmrtxrzqi.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Your key

---

## 🔄 **After Setting Variables**

1. **Redeploy** (Vercel will automatically redeploy when you add variables, or manually trigger):

   ```bash
   npm run deploy:prod:safe
   ```

2. **Verify** (after 2-3 minutes):
   ```bash
   npm run post-deploy
   ```

---

## 🔗 **Quick Links**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Environment Variables:** https://vercel.com/dashboard/[team]/personal-website/settings/environment-variables
- **Supabase Database Settings:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/database

---

**⚠️ IMPORTANT:** The deployment will not work until `DATABASE_URL` is set correctly in Vercel!

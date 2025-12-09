# 🔐 Vercel Environment Variables Update Guide

## Quick Update Steps

### Step 1: Access Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your project: `personal-website` or `advanciapayledger`
3. Click **Settings** → **Environment Variables**

---

### Step 2: Update DATABASE_URL (CRITICAL)

**Current Status:** May be incorrect or missing

**Action:**
1. Find `DATABASE_URL` in the list
2. Click **Edit** (or **Add** if missing)
3. Update value to:
   ```
   postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
   ```
4. **Replace `[YOUR-PASSWORD]`** with your actual Supabase database password
5. Select **Production** environment
6. Click **Save**

**Where to get password:**
- Supabase Dashboard → Settings → Database
- Or check your Supabase project settings

---

### Step 3: Update DIRECT_URL (Recommended)

1. Find `DIRECT_URL` (or add if missing)
2. Set value to:
   ```
   postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
   ```
3. Use same password as DATABASE_URL
4. Port is `5432` (not 6543)
5. No `pgbouncer=true` parameter
6. Select **Production** environment
7. Click **Save**

---

### Step 4: Verify Other Variables

**Check these are set correctly:**

- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Current/valid key
- ✅ `JWT_SECRET` - Generated secret
- ✅ `SESSION_SECRET` - Generated secret
- ✅ `NEXTAUTH_SECRET` - Generated secret
- ✅ `NEXT_PUBLIC_APP_URL` - `https://advanciapayledger.com`
- ✅ `NEXTAUTH_URL` - `https://advanciapayledger.com`
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - `https://xesecqcqzykvmrtxrzqi.supabase.co`

---

### Step 5: Redeploy

**After saving variables:**
- Vercel automatically redeploys
- Wait 2-3 minutes
- Check deployment status in dashboard

**Or trigger manual redeploy:**
- Go to **Deployments** tab
- Click **Redeploy** on latest deployment

---

## 🔍 Verification

### Check Deployment Logs

1. Go to **Deployments** tab
2. Click on latest deployment
3. Check **Build Logs** for errors
4. Verify no database connection errors

### Test Production

1. Visit: https://advanciapayledger.com
2. Should load without errors
3. Test admin login:
   - Email: `superadmin@advanciapayledger.com`
   - Password: `QAZwsxEDC1!?`

---

## ⚠️ Common Issues

### Issue: "Database connection error"

**Solution:**
- Verify `DATABASE_URL` is correct
- Check password is correct
- Ensure port is `6543` for pooling
- Include `sslmode=require`

### Issue: "Invalid URL format"

**Solution:**
- Must start with `postgresql://` or `postgres://`
- Check for typos in connection string
- Verify all parameters are correct

### Issue: "Authentication failed"

**Solution:**
- Verify database password is correct
- Check user has proper permissions
- Verify database exists

---

## 📋 Connection String Format

### DATABASE_URL (Connection Pooling)
```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**Key Points:**
- Port: `6543` (pooler)
- Include: `pgbouncer=true`
- Include: `sslmode=require`

### DIRECT_URL (Direct Connection)
```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**Key Points:**
- Port: `5432` (direct)
- No `pgbouncer=true`
- Include: `sslmode=require`

---

**Status:** ✅ Ready to Update  
**Last Updated:** 2024


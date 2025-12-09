# 🔐 Vercel Environment Variables - Ready to Set

**Generated:** 2025-01-27  
**Status:** ⚠️ **ACTION REQUIRED** - Set these in Vercel Dashboard

---

## 📋 **Generated Production Secrets**

Copy these values to Vercel Environment Variables:

### **Required Secrets:**

```
JWT_SECRET=5a6b3412daf64d4faf6542597eb8908f412064878b1dfc3047119635a763cac1ba495b70b7875f4e4c38de3ad5b158a4208e862048bc393f992ec81bf24509f6

SESSION_SECRET=ad2cbff02acedf66e6b18be1d41ac22f5791fe77a8f424498989ee78d3364ce18d986d9ffd403c6c4e4562e43f0f633c3103b6da607dd6578d90b2c22bfc6c7b

NEXTAUTH_SECRET=NoaHe8QMseCUQpLBfwP2ydxaeWPBWPKlkxhNZoXQLNk=

CRON_SECRET=0eG74xgFxSVwXJtl+V23XnHA1nclND5l87Fyz6FYG2Q=
```

---

## 🔗 **How to Set in Vercel Dashboard**

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select project: `personal-website`

2. **Navigate to Environment Variables:**
   - Settings → Environment Variables
   - Or: https://vercel.com/dashboard/[team]/personal-website/settings/environment-variables

3. **Add Each Variable:**
   - Click "Add New"
   - Enter variable name
   - Paste the value
   - Select environment: **Production** (and Preview/Development if needed)
   - Click "Save"

---

## ✅ **Required Variables Checklist**

### **Core Secrets** (Generated Above)

- [ ] `JWT_SECRET` - Use generated value above
- [ ] `SESSION_SECRET` - Use generated value above
- [ ] `NEXTAUTH_SECRET` - Use generated value above
- [ ] `CRON_SECRET` - Use generated value above

### **Application URLs**

- [ ] `NEXT_PUBLIC_APP_URL` = `https://advanciapayledger.com`
- [ ] `NEXTAUTH_URL` = `https://advanciapayledger.com`

### **Database**

- [ ] `DATABASE_URL` = Your production database connection string
- [ ] `DIRECT_URL` = Your direct database connection string (optional)

### **Supabase** (⚠️ **CRITICAL - Rotate Service Role Key First**)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://xesecqcqzykvmrtxrzqi.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` = Your Supabase publishable key
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key (alternative)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = **NEW ROTATED KEY** (rotate first!)

---

## ⚠️ **CRITICAL: Rotate Supabase Service Role Key**

**Before setting `SUPABASE_SERVICE_ROLE_KEY`:**

1. Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api
2. Click "Reset" next to `service_role` key
3. Copy the new key
4. Set it as `SUPABASE_SERVICE_ROLE_KEY` in Vercel

**See:** `SECURITY_INCIDENT_SUPABASE_KEY_EXPOSURE.md` for details

---

## 📝 **Optional but Recommended**

- [ ] `REDIS_URL` - Redis connection URL (if using Redis)
- [ ] `SMTP_HOST` - SMTP server hostname (if sending emails)
- [ ] `SMTP_FROM` = `noreply@advanciapayledger.com`

---

## ✅ **After Setting Variables**

1. **Verify:**

   ```bash
   npm run verify:vercel:env
   ```

2. **Run Deployment Checklist:**

   ```bash
   npm run deploy:checklist
   ```

3. **Deploy:**
   ```bash
   npm run deploy:prod:safe
   ```

---

## 🔗 **Quick Links**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Environment Variables:** https://vercel.com/dashboard/[team]/personal-website/settings/environment-variables
- **Supabase API Settings:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api
- **Setup Guide:** `VERCEL_ENVIRONMENT_SETUP.md`

---

**⚠️ IMPORTANT:**

- Never commit these secrets to git
- Set all variables for **Production** environment
- Rotate Supabase Service Role Key before setting it
- Redeploy after setting variables

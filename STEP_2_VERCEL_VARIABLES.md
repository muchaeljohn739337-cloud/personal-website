# ✅ Step 2: Set Vercel Environment Variables

**Status:** Step 1 Complete ✅ (Supabase key rotated)  
**Next:** Set variables in Vercel Dashboard

---

## 🔗 **Quick Access**

**Vercel Dashboard:** https://vercel.com/dashboard  
**Environment Variables:** https://vercel.com/dashboard/[team]/personal-website/settings/environment-variables

---

## 📋 **Variables to Set (Copy & Paste)**

### **1. Core Secrets** (Generated)

```
JWT_SECRET=5a6b3412daf64d4faf6542597eb8908f412064878b1dfc3047119635a763cac1ba495b70b7875f4e4c38de3ad5b158a4208e862048bc393f992ec81bf24509f6

SESSION_SECRET=ad2cbff02acedf66e6b18be1d41ac22f5791fe77a8f424498989ee78d3364ce18d986d9ffd403c6c4e4562e43f0f633c3103b6da607dd6578d90b2c22bfc6c7b

NEXTAUTH_SECRET=NoaHe8QMseCUQpLBfwP2ydxaeWPBWPKlkxhNZoXQLNk=

CRON_SECRET=0eG74xgFxSVwXJtl+V23XnHA1nclND5l87Fyz6FYG2Q=
```

### **2. Application URLs**

```
NEXT_PUBLIC_APP_URL=https://advanciapayledger.com

NEXTAUTH_URL=https://advanciapayledger.com
```

### **3. Supabase** (⚠️ Use NEW rotated key!)

```
NEXT_PUBLIC_SUPABASE_URL=https://xesecqcqzykvmrtxrzqi.supabase.co

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your_publishable_key>

SUPABASE_SERVICE_ROLE_KEY=<NEW_ROTATED_KEY_FROM_STEP_1>
```

**⚠️ IMPORTANT:** Use the NEW key you just rotated in Step 1!

### **4. Database**

```
DATABASE_URL=<your_production_database_url>

DIRECT_URL=<your_direct_database_url>  # Optional but recommended
```

---

## 📝 **How to Add in Vercel**

1. Go to: https://vercel.com/dashboard
2. Select project: `personal-website`
3. Click: **Settings** → **Environment Variables**
4. For each variable:
   - Click **"Add New"**
   - Enter variable name
   - Paste the value
   - Select environment: **Production** (and Preview/Development if needed)
   - Click **"Save"**
5. Repeat for all variables above

---

## ✅ **After Setting All Variables**

Run this to verify:

```bash
npm run verify:vercel:env
```

**Expected:** All required variables should show ✅

---

## 🚀 **Then Deploy**

Once all variables are set and verified:

```bash
npm run deploy:prod:safe
```

---

**Quick Links:**

- Vercel Dashboard: https://vercel.com/dashboard
- Environment Variables: https://vercel.com/dashboard/[team]/personal-website/settings/environment-variables

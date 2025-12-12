# 🚀 Deployment Steps - Execute Now

**Time Required:** ~15 minutes  
**Status:** Ready - Follow these steps in order

---

## ⚠️ **CRITICAL: Do These First (5 minutes)**

### **Step 1: Rotate Supabase Service Role Key**

1. **Open:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api
2. **Find:** `service_role` key section
3. **Click:** "Reset" or "Regenerate"
4. **Copy:** The new key (save it - you'll need it next)
5. **⚠️ IMPORTANT:** This key was exposed in git - MUST rotate before deployment

---

### **Step 2: Set Vercel Environment Variables**

**Open:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Add these variables (select "Production" environment):**

#### **A. Secrets (Generated - Copy from below):**

```
JWT_SECRET=5a6b3412daf64d4faf6542597eb8908f412064878b1dfc3047119635a763cac1ba495b70b7875f4e4c38de3ad5b158a4208e862048bc393f992ec81bf24509f6

SESSION_SECRET=ad2cbff02acedf66e6b18be1d41ac22f5791fe77a8f424498989ee78d3364ce18d986d9ffd403c6c4e4562e43f0f633c3103b6da607dd6578d90b2c22bfc6c7b

NEXTAUTH_SECRET=NoaHe8QMseCUQpLBfwP2ydxaeWPBWPKlkxhNZoXQLNk=

CRON_SECRET=0eG74xgFxSVwXJtl+V23XnHA1nclND5l87Fyz6FYG2Q=
```

#### **B. URLs:**

```
NEXT_PUBLIC_APP_URL=https://advanciapayledger.com
NEXTAUTH_URL=https://advanciapayledger.com
```

#### **C. Supabase (Use NEW rotated key from Step 1):**

```
NEXT_PUBLIC_SUPABASE_URL=https://xesecqcqzykvmrtxrzqi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your_publishable_key>
SUPABASE_SERVICE_ROLE_KEY=<NEW_KEY_FROM_STEP_1>
```

#### **D. Database:**

```
DATABASE_URL=<your_production_database_url>
DIRECT_URL=<your_direct_database_url>  # Optional
```

**After adding all variables, verify:**

```bash
npm run verify:vercel:env
```

---

## 🚀 **Step 3: Deploy (3 minutes)**

Once environment variables are set, run:

```bash
npm run deploy:prod:safe
```

**What happens:**

- ✅ Checks Vercel authentication
- ✅ Validates environment variables
- ✅ Builds the project
- ✅ Deploys to Vercel production

**Monitor:** Watch terminal output and Vercel Dashboard

---

## 📋 **Step 4: Post-Deployment (After deployment succeeds)**

### **4.1 Run Database Migrations:**

```bash
npm run migrate:prod
```

### **4.2 Verify Deployment:**

```bash
npm run verify:prod
```

### **4.3 Manual Testing:**

- [ ] Visit: https://advanciapayledger.com
- [ ] Test registration
- [ ] Test login
- [ ] Check admin panel
- [ ] Test payment flow (test mode)

---

## ✅ **Quick Checklist**

Before deploying:

- [ ] ✅ Rotated Supabase Service Role Key
- [ ] ✅ Set all Vercel environment variables
- [ ] ✅ Verified variables: `npm run verify:vercel:env`

Deploy:

- [ ] ✅ Run: `npm run deploy:prod:safe`

After deployment:

- [ ] ✅ Run migrations: `npm run migrate:prod`
- [ ] ✅ Verify health: `npm run verify:prod`
- [ ] ✅ Test manually

---

## 🔗 **Quick Links**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Environment Variables:** https://vercel.com/dashboard/[team]/personal-website/settings/environment-variables
- **Supabase API Settings:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api
- **Project URL:** https://advanciapayledger.com

---

**Ready? Start with Step 1!** 🚀

# 🚀 Quick Deployment Guide - 3 Steps

**Time:** ~15 minutes  
**Status:** Ready to deploy ✅

---

## ✅ **Step 1: Rotate Supabase Service Role Key** (2 minutes)

### **Why:** Security - Key was exposed in git history

### **How:**
1. Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api
2. Find `service_role` key section
3. Click **"Reset"** or **"Regenerate"**
4. **Copy the new key immediately** (it won't be shown again)
5. Save it - you'll need it in Step 2

**⚠️ IMPORTANT:** Do this FIRST before setting Vercel variables!

---

## ✅ **Step 2: Set Vercel Environment Variables** (10 minutes)

### **Where:**
- Dashboard: https://vercel.com/dashboard
- Project: `personal-website`
- Settings → Environment Variables
- Or: https://vercel.com/dashboard/[team]/personal-website/settings/environment-variables

### **What to Set:**

#### **A. Generated Secrets** (Copy from `VERCEL_ENV_VARIABLES_TO_SET.md`):
```
JWT_SECRET=5a6b3412daf64d4faf6542597eb8908f412064878b1dfc3047119635a763cac1ba495b70b7875f4e4c38de3ad5b158a4208e862048bc393f992ec81bf24509f6

SESSION_SECRET=ad2cbff02acedf66e6b18be1d41ac22f5791fe77a8f424498989ee78d3364ce18d986d9ffd403c6c4e4562e43f0f633c3103b6da607dd6578d90b2c22bfc6c7b

NEXTAUTH_SECRET=NoaHe8QMseCUQpLBfwP2ydxaeWPBWPKlkxhNZoXQLNk=

CRON_SECRET=0eG74xgFxSVwXJtl+V23XnHA1nclND5l87Fyz6FYG2Q=
```

#### **B. Application URLs:**
```
NEXT_PUBLIC_APP_URL=https://advanciapayledger.com
NEXTAUTH_URL=https://advanciapayledger.com
```

#### **C. Database:**
```
DATABASE_URL=<your_production_database_url>
DIRECT_URL=<your_direct_database_url>  # Optional but recommended
```

#### **D. Supabase:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xesecqcqzykvmrtxrzqi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your_publishable_key>
SUPABASE_SERVICE_ROLE_KEY=<NEW_KEY_FROM_STEP_1>  # ⚠️ Use rotated key!
```

### **How to Add:**
1. Click **"Add New"**
2. Enter variable name
3. Paste value
4. Select environment: **Production** (and Preview/Development if needed)
5. Click **"Save"**
6. Repeat for each variable

### **Verify:**
```bash
npm run verify:vercel:env
```

---

## ✅ **Step 3: Deploy** (3 minutes)

### **Deploy Command:**
```bash
npm run deploy:prod:safe
```

### **What it does:**
- Runs pre-deployment checks
- Validates environment variables
- Builds the project
- Deploys to Vercel production

### **Monitor:**
- Watch the terminal output
- Check Vercel Dashboard for deployment status
- Wait for deployment to complete (~2-3 minutes)

---

## 📋 **Post-Deployment** (After deployment succeeds)

### **1. Run Database Migrations:**
```bash
npm run migrate:prod
```

### **2. Verify Deployment:**
```bash
npm run verify:prod
```

### **3. Manual Testing:**
- [ ] Visit: https://advanciapayledger.com
- [ ] Test registration: https://advanciapayledger.com/auth/register
- [ ] Test login: https://advanciapayledger.com/auth/login
- [ ] Check admin panel (if applicable)
- [ ] Test payment flow (test mode)

---

## 🆘 **Troubleshooting**

### **Deployment Fails:**
1. Check Vercel Dashboard → Deployments → Latest → Logs
2. Verify all environment variables are set
3. Run: `npm run verify:vercel:env`

### **Health Check Fails:**
1. Wait 2-3 minutes after deployment
2. Check Vercel function logs
3. Verify `DATABASE_URL` is correct

### **Database Migration Fails:**
1. Verify `DATABASE_URL` and `DIRECT_URL` are set
2. Check database is accessible from Vercel
3. Run: `npx prisma migrate status`

---

## 📝 **Quick Reference**

**Commands:**
```bash
# Verify environment variables
npm run verify:vercel:env

# Deploy
npm run deploy:prod:safe

# Post-deployment
npm run migrate:prod
npm run verify:prod
```

**Links:**
- Vercel Dashboard: https://vercel.com/dashboard
- Environment Variables: https://vercel.com/dashboard/[team]/personal-website/settings/environment-variables
- Supabase API Settings: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api
- Project URL: https://advanciapayledger.com

---

**Ready? Start with Step 1!** 🚀


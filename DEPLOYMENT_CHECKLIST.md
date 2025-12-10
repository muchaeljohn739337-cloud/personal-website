# ✅ Deployment Checklist - Check Off As You Go

**Start here:** Follow steps in order, check off each item as you complete it.

---

## 🔴 **Step 1: Rotate Supabase Service Role Key** (2 minutes)

- [ ] Open: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api
- [ ] Find `service_role` key section
- [ ] Click "Reset" or "Regenerate"
- [ ] **Copy the new key** (save it - you'll need it in Step 2)
- [ ] ✅ **DONE** - Key rotated

**⚠️ IMPORTANT:** This key was exposed in git history - MUST rotate before deployment!

---

## 🟠 **Step 2: Set Vercel Environment Variables** (10 minutes)

- [ ] Open: https://vercel.com/dashboard
- [ ] Select project: `personal-website`
- [ ] Go to: Settings → Environment Variables

### **Add These Variables (Select "Production" environment):**

#### **A. Generated Secrets:**
- [ ] `JWT_SECRET` = `5a6b3412daf64d4faf6542597eb8908f412064878b1dfc3047119635a763cac1ba495b70b7875f4e4c38de3ad5b158a4208e862048bc393f992ec81bf24509f6`
- [ ] `SESSION_SECRET` = `ad2cbff02acedf66e6b18be1d41ac22f5791fe77a8f424498989ee78d3364ce18d986d9ffd403c6c4e4562e43f0f633c3103b6da607dd6578d90b2c22bfc6c7b`
- [ ] `NEXTAUTH_SECRET` = `NoaHe8QMseCUQpLBfwP2ydxaeWPBWPKlkxhNZoXQLNk=`
- [ ] `CRON_SECRET` = `0eG74xgFxSVwXJtl+V23XnHA1nclND5l87Fyz6FYG2Q=`

#### **B. Application URLs:**
- [ ] `NEXT_PUBLIC_APP_URL` = `https://advanciapayledger.com`
- [ ] `NEXTAUTH_URL` = `https://advanciapayledger.com`

#### **C. Database:**
- [ ] `DATABASE_URL` = Your production database connection string
- [ ] `DIRECT_URL` = Your direct database connection string (optional)

#### **D. Supabase:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://xesecqcqzykvmrtxrzqi.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` = Your publishable key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = **NEW KEY FROM STEP 1** ⚠️

- [ ] ✅ **DONE** - All variables set in Vercel

### **Verify Variables:**
- [ ] Run: `npm run verify:vercel:env`
- [ ] ✅ All required variables show as set

---

## 🚀 **Step 3: Deploy** (3 minutes)

- [ ] Run: `npm run deploy:prod:safe`
- [ ] Watch deployment progress
- [ ] Wait for "Deployment successful!" message
- [ ] ✅ **DONE** - Deployment complete

---

## 📋 **Step 4: Post-Deployment** (After deployment succeeds)

- [ ] Run: `npm run migrate:prod`
- [ ] Run: `npm run verify:prod`
- [ ] Visit: https://advanciapayledger.com
- [ ] Test registration
- [ ] Test login
- [ ] ✅ **DONE** - All post-deployment checks complete

---

## 🎉 **Deployment Complete!**

Once all items are checked, your application is live and ready!

---

**Quick Commands:**
```bash
# Verify variables
npm run verify:vercel:env

# Deploy
npm run deploy:prod:safe

# Post-deployment
npm run migrate:prod
npm run verify:prod
```

**Quick Links:**
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase API Settings: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api
- Project URL: https://advanciapayledger.com

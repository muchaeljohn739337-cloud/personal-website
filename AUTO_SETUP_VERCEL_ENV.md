# 🚀 Automatic Vercel Environment Variables Setup

**Status:** Ready to use  
**Command:** `npm run vercel:env:copy`

---

## ✅ **Quick Setup (3 Steps)**

### **Step 1: Generate Copy-Paste Values**

```bash
npm run vercel:env:copy
```

This creates `VERCEL_ENV_COPY_PASTE.md` with all values ready to copy.

### **Step 2: Set Variables in Vercel Dashboard**

1. **Open:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. **Open:** `VERCEL_ENV_COPY_PASTE.md` (generated file)
3. **For each variable:**
   - Click "Add New" in Vercel
   - Copy variable name from the file
   - Copy the value from the file
   - Select "Production" environment
   - Click "Save"

### **Step 3: Auto-Verify & Deploy**

After setting variables, Vercel will auto-redeploy. Then run:

```bash
npm run post-deploy
```

This will:

- ✅ Verify environment variables
- ✅ Wait for deployment to be healthy
- ✅ Check Vercel logs
- ✅ Run database migrations
- ✅ Provide status summary

---

## 📋 **All Available Commands**

```bash
# Generate copy-paste values
npm run vercel:env:copy

# Verify variables are set
npm run verify:vercel:env

# Deploy to production
npm run deploy:prod:safe

# Post-deployment verification (automated)
npm run post-deploy

# Complete setup (generates scripts)
npm run setup:vercel:env:auto
```

---

## ⚠️ **Missing Variable**

**`SUPABASE_SERVICE_ROLE_KEY`** - You need to:

1. Get it from: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api
2. Use the **NEW rotated** service_role key
3. Add it to `.env.local` first, then run `npm run vercel:env:copy` again
4. Or set it directly in Vercel Dashboard

---

## 🔗 **Quick Links**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Environment Variables:** https://vercel.com/dashboard/[team]/personal-website/settings/environment-variables
- **Generated File:** `VERCEL_ENV_COPY_PASTE.md`

---

**💡 Tip:** After setting all variables, Vercel automatically redeploys. Then run `npm run post-deploy` to verify everything works!

# 🚀 Deploy Now - Step-by-Step Guide

## ⚠️ CRITICAL: Remove Secrets First

**Before committing, remove backup file:**

```powershell
# Remove backup file with secrets
if (Test-Path .env.local.backup) {
    Remove-Item .env.local.backup
    Write-Host "[OK] Removed .env.local.backup (contains secrets)"
}
```

---

## Step 1: Clean Up & Verify ✅

```powershell
# 1. Remove backup file
Remove-Item .env.local.backup -ErrorAction SilentlyContinue

# 2. Verify .gitignore excludes secrets
git check-ignore .env.local.backup
# Should show: .env.local.backup (if properly ignored)

# 3. Check what will be committed
git status
```

---

## Step 2: Stage Safe Files ✅

```bash
# Stage workflow improvements
git add .github/workflows/ci.yml
git rm .github/workflows/ci-fixed.yml  # Remove duplicate

# Stage configuration
git add env.example
git add package.json package-lock.json
git add docker-compose.test.yml

# Stage scripts (safe ones)
git add scripts/setup-test-env.ps1
git add scripts/setup-test-database.sh
git add scripts/test-db-connection.ts
git add scripts/verify-test-env.ts

# Stage documentation
git add *.md

# Review staged files
git status
```

---

## Step 3: Commit Changes ✅

```bash
git commit -m "feat: improve CI/CD workflows and add test environment setup

- Merge duplicate CI workflows with test environment variables
- Add Prisma generate step to build job
- Optimize Playwright installation (chromium only)
- Add test database setup scripts and Docker configuration
- Add comprehensive test environment documentation
- Add GitHub Secrets setup guide
- Add responsive design analysis
- Add GitHub repository analysis

BREAKING: None
Fixes: Duplicate CI workflows, missing test env vars"
```

---

## Step 4: Push to Trigger Deployment 🚀

```bash
git push origin main
```

**This will:**

- ✅ Trigger GitHub Actions CI
- ✅ Auto-deploy to Vercel (if configured)
- ✅ Run all tests

---

## Step 5: Update Vercel Environment Variables 🔐

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

### Update DATABASE_URL

**Current Issue:** May be incorrect or missing

**Fix:**

1. Get correct password from Supabase
2. Update `DATABASE_URL`:

   ```
   postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
   ```

3. Replace `[YOUR-PASSWORD]` with actual password
4. Save

**Vercel will auto-redeploy after saving**

---

## Step 6: Test Admin Login 🔐

**After deployment completes (2-3 minutes):**

1. Go to: https://advanciapayledger.com/auth/login
2. Enter:
   - **Email:** `superadmin@advanciapayledger.com`
   - **Password:** `QAZwsxEDC1!?`
3. Verify login succeeds
4. Check admin dashboard loads

**If login fails:**

- Check Vercel logs
- Verify database connection
- Check environment variables

---

## Step 7: Run Tests 🧪

```bash
# Local tests
npm test

# E2E tests (if database set up)
npm run test:e2e

# Verify environment
npm run test:env
```

---

## Step 8: Verify Deployment ✅

```bash
# Check production health
curl https://advanciapayledger.com/api/health

# Or use verification script
npm run verify:prod
```

---

## 📋 Quick Checklist

- [ ] Removed `.env.local.backup`
- [ ] Staged safe files only
- [ ] Committed changes
- [ ] Pushed to main
- [ ] Updated `DATABASE_URL` in Vercel
- [ ] Waited for deployment (2-3 min)
- [ ] Tested admin login
- [ ] Ran tests
- [ ] Verified production site

---

**Status:** ✅ Ready to Deploy  
**Last Updated:** 2024

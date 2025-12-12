# 🚀 Deployment Checklist - Action Items

## Current Status

**Date:** 2024  
**Priority:** 🔴 **HIGH - Production Deployment**

---

## ✅ Pre-Deployment Checklist

### 1. Security Check

- [x] `.gitignore` properly configured (env files excluded)
- [ ] Verify no secrets in files to be committed
- [ ] Remove `.env.local.backup` if exists (contains secrets)

### 2. Code Changes

- [x] CI workflow improvements merged
- [x] Test environment setup complete
- [x] Documentation updated
- [ ] Review all changes before commit

---

## 📋 Step-by-Step Deployment Process

### Step 1: Clean Up Secrets ⚠️

**Before committing, ensure:**

```bash
# Check for backup files with secrets
# DO NOT COMMIT:
- .env.local.backup
- .env.production
- .env*.local
- Any file containing passwords/secrets
```

**Action:**

```powershell
# Remove backup file if it exists (contains secrets)
if (Test-Path .env.local.backup) {
    Remove-Item .env.local.backup
    Write-Host "Removed .env.local.backup (contains secrets)"
}
```

---

### Step 2: Commit Changes (Safe Files Only) ✅

**Files Safe to Commit:**

- ✅ Documentation files (\*.md)
- ✅ Configuration files (docker-compose.test.yml, etc.)
- ✅ Scripts (without secrets)
- ✅ Workflow files (.github/workflows/\*.yml)
- ✅ package.json, package-lock.json
- ✅ env.example (template only)

**Files to EXCLUDE:**

- ❌ .env.local.backup
- ❌ .env\*.local
- ❌ Any file with actual passwords/secrets

**Commit Command:**

```bash
# Stage safe files
git add .github/workflows/ci.yml
git add env.example
git add package.json package-lock.json
git add docker-compose.test.yml
git add scripts/*.ts scripts/*.sh scripts/*.ps1
git add *.md

# Review what will be committed
git status

# Commit
git commit -m "feat: improve CI workflows and add test environment setup

- Merge duplicate CI workflows with improvements
- Add test environment variables and scripts
- Add Docker test database configuration
- Update documentation for test setup
- Add GitHub Secrets setup guide"

# Push
git push origin main
```

---

### Step 3: Update Vercel Environment Variables 🔐

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Required Updates:**

1. **`DATABASE_URL`** (CRITICAL)
   - Current: May be incorrect or missing
   - Update to: `postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require`
   - Replace `[YOUR-PASSWORD]` with actual Supabase database password
   - Environment: **Production**

2. **`DIRECT_URL`** (Recommended)
   - Value: `postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`
   - Environment: **Production**

3. **Verify Other Variables:**
   - `SUPABASE_SERVICE_ROLE_KEY` - Current/valid key
   - `JWT_SECRET` - Set
   - `SESSION_SECRET` - Set
   - `NEXTAUTH_SECRET` - Set
   - `NEXT_PUBLIC_APP_URL` - `https://advanciapayledger.com`
   - `NEXTAUTH_URL` - `https://advanciapayledger.com`

**After Updating:**

- Vercel will auto-redeploy
- Wait 2-3 minutes for deployment to complete

---

### Step 4: Deploy Latest Changes 🚀

**Option A: Automatic (via Git Push)**

```bash
# After committing and pushing, Vercel auto-deploys
git push origin main
```

**Option B: Manual Deployment**

```bash
npm run deploy:prod
```

**Option C: Safe Deployment Script**

```bash
npm run deploy:prod:safe
```

---

### Step 5: Verify Deployment ✅

**Check Deployment Status:**

1. Go to: https://vercel.com/dashboard
2. Check latest deployment
3. Verify build succeeded
4. Check deployment logs for errors

**Test Production URL:**

- https://advanciapayledger.com
- Should load without errors

---

### Step 6: Test Admin Login 🔐

**Test Credentials:**

- **Email:** `superadmin@advanciapayledger.com`
- **Password:** `QAZwsxEDC1!?`

**Steps:**

1. Go to: https://advanciapayledger.com/auth/login
2. Enter credentials
3. Verify login succeeds
4. Check admin dashboard loads

**If Login Fails:**

- Check Vercel logs for errors
- Verify database connection
- Check environment variables are set correctly
- Verify user exists in database

---

### Step 7: Run Tests 🧪

**Local Tests:**

```bash
# Verify environment
npm run test:env

# Run unit tests
npm test

# Run E2E tests (if database is set up)
npm run test:e2e
```

**CI Tests:**

- Check GitHub Actions after push
- Verify all CI jobs pass
- Review test results

---

## 🔍 Post-Deployment Verification

### Health Checks

```bash
# Check production health endpoint
curl https://advanciapayledger.com/api/health

# Verify deployment
npm run verify:prod
```

### Manual Checks

- [ ] Homepage loads correctly
- [ ] Admin login works
- [ ] Database connections working
- [ ] No errors in browser console
- [ ] No errors in Vercel logs

---

## ⚠️ Important Notes

### Security

- ✅ Never commit `.env` files
- ✅ Never commit backup files with secrets
- ✅ Always verify `.gitignore` excludes sensitive files
- ✅ Use Vercel dashboard for production secrets

### Database

- ⚠️ Ensure `DATABASE_URL` is correct in Vercel
- ⚠️ Use connection pooling URL (port 6543)
- ⚠️ Include `sslmode=require` for security

### Testing

- Test admin login after deployment
- Verify database connections
- Check for any console errors
- Monitor Vercel logs

---

## 📚 Related Documentation

- `VERCEL_DATABASE_URL_FIX.md` - Database URL setup
- `GITHUB_SECRETS_SETUP.md` - CI/CD secrets
- `DEPLOYMENT_COMPLETE_SUMMARY.md` - Previous deployment notes

---

**Status:** ✅ Ready to Deploy  
**Last Updated:** 2024

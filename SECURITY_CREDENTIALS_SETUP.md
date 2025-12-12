# 🔒 CRITICAL: Database Credentials Setup Guide

## ⚠️ SECURITY WARNING

**NEVER commit database passwords or connection strings to git!**

All database credentials must be stored as:

- **GitHub Secrets** (for CI/CD)
- **Vercel Environment Variables** (for deployment)
- **Local `.env.local`** (for development, already in `.gitignore`)

---

## 🎯 Quick Setup

### 1. Set GitHub Secret for CI/CD Tests

Go to your GitHub repository:

1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following:

**Secret Name:** `DATABASE_URL_TEST`  
**Secret Value:**

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

⚠️ **Important:** Replace `[YOUR-PASSWORD]` with your actual database password from Supabase!

---

### 2. Test Connection (Local)

Create or update `.env.local` (never commit this file):

```bash
DATABASE_URL_TEST=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

Test the connection:

```bash
npm run test:db
```

---

### 3. Verify Workflow Uses Secret

The CI workflow at `.github/workflows/ci.yml` already uses:

```yaml
DATABASE_URL: ${{ secrets.DATABASE_URL_TEST || 'postgresql://test:test@localhost:5432/test' }}
```

This means:

- ✅ If `DATABASE_URL_TEST` secret exists → uses it
- ✅ If secret doesn't exist → uses fallback (for local testing without secrets)

---

## 🔍 Verify Setup

After setting the GitHub secret, verify it works:

1. **Check GitHub Secrets:**
   - Repository → Settings → Secrets and variables → Actions
   - Should see `DATABASE_URL_TEST` listed

2. **Test CI Workflow:**
   - Push a commit or create a PR
   - Check the "test" job in GitHub Actions
   - Should connect successfully

---

## 🚨 If You Accidentally Committed Credentials

If credentials were committed to git:

1. **Rotate the password immediately:**
   - Go to Supabase Dashboard
   - Settings → Database → Reset database password

2. **Remove from git history:**

   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch PATH_TO_FILE" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push** (if you're the only contributor):

   ```bash
   git push origin --force --all
   ```

4. **Update all secrets** with the new password

---

## ✅ Security Checklist

- [ ] GitHub Secret `DATABASE_URL_TEST` is set
- [ ] Password is NOT in any committed files
- [ ] `.env.local` is in `.gitignore` (already done)
- [ ] Password does NOT appear in git history
- [ ] Connection string works in CI/CD tests

---

## 📚 Reference

- **Supabase Dashboard:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi
- **Database Settings:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/database
- **GitHub Secrets Docs:** https://docs.github.com/en/actions/security-guides/encrypted-secrets

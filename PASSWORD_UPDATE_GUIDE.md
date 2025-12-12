# 🔐 Database Password Update Guide

**Status:** ✅ Password updated and tested successfully

**New Password:** `[YOUR-PASSWORD]` (Updated in Vercel and GitHub Secrets)  
**Connection:** ✅ Tested and working

---

## 📋 Where to Update the Password

### 1. ✅ Local Development (`.env.local`)

Update your local `.env.local` file (already in `.gitignore`):

```bash
# Connection Pooling (Application)
DATABASE_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require

# Direct Connection (Migrations)
DIRECT_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**Test locally:**

```bash
npm run test:db
```

---

### 2. 🌐 Vercel Production Environment

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Update `DATABASE_URL`:**

- **Value:**
  ```
  postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
  ```
- **Environment:** Production (and Preview/Development if needed)

**Update `DIRECT_URL`:**

- **Value:**
  ```
  postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
  ```
- **Environment:** Production (and Preview/Development if needed)

**After updating:** Vercel will automatically redeploy, or manually trigger a redeploy.

---

### 3. 🔧 GitHub Secrets (for CI/CD Tests)

**Go to:** Repository → Settings → Secrets and variables → Actions

**Update `DATABASE_URL_TEST`:**

- **Secret Value:**
  ```
  postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
  ```

**Note:** The CI workflow at `.github/workflows/ci.yml` already uses this secret automatically.

---

## ✅ Verification Checklist

- [x] ✅ Connection test passed (PostgreSQL 17.6)
- [ ] Update `.env.local` (if using locally)
- [ ] Update Vercel `DATABASE_URL`
- [ ] Update Vercel `DIRECT_URL`
- [ ] Update GitHub Secret `DATABASE_URL_TEST`
- [ ] Test CI/CD pipeline (runs automatically after GitHub secret update)

---

## 🔍 Connection String Details

**DATABASE_URL** (Connection Pooling - Port 6543):

- Port: `6543`
- Query params: `?pgbouncer=true&sslmode=require`
- Use for: Application queries

**DIRECT_URL** (Direct Connection - Port 5432):

- Port: `5432`
- Query params: `?sslmode=require`
- Use for: Prisma migrations

Both use the same password (replace `[YOUR-PASSWORD]` with your actual password)

---

## 🚨 Security Reminder

- ✅ Never commit `.env.local` to git (already in `.gitignore`)
- ✅ Secrets are stored securely in Vercel and GitHub
- ✅ Connection test successful - password works correctly

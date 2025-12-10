# 📝 Manual Test Environment Setup Guide

## Current Status

✅ **Completed:**
- `pg` package installed
- Test scripts created
- Docker configuration ready
- Documentation complete

⚠️ **Action Required:**
- Create `.env.test.local` manually (file is gitignored)
- Set up test database (Docker or local PostgreSQL)

---

## Step 1: Create `.env.test.local` File

Since `.env.test.local` is gitignored, create it manually:

**Create file:** `.env.test.local`

**Content:**
```env
# Test Environment Variables
# This file is for local testing only - DO NOT COMMIT TO GIT

# Test Database URL
# For Docker: postgresql://test:test@localhost:5433/test
# For Local: postgresql://test:test@localhost:5432/test
DATABASE_URL_TEST=postgresql://test:test@localhost:5432/test

# Test User Credentials (for E2E tests)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test_password_123

# Test Environment
NODE_ENV=test
```

**How to create:**
1. Open your code editor
2. Create new file: `.env.test.local`
3. Paste the content above
4. Save in the project root directory

---

## Step 2: Set Up Test Database

### Option A: Docker (If Available)

**Install Docker Desktop:**
- Download: https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop

**Then run:**
```bash
npm run test:db:setup
```

**Or manually:**
```bash
docker-compose -f docker-compose.test.yml up -d
```

**Update `.env.test.local`:**
```
DATABASE_URL_TEST=postgresql://test:test@localhost:5433/test
```

### Option B: Local PostgreSQL (Current Option)

**Prerequisites:** PostgreSQL installed

**Windows:**
```powershell
# Using psql (if PostgreSQL is installed)
psql -U postgres -c "CREATE DATABASE test;"
psql -U postgres -c "CREATE USER test WITH PASSWORD 'test';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE test TO test;"
```

**Or using pgAdmin:**
1. Open pgAdmin
2. Connect to PostgreSQL server
3. Right-click "Databases" → "Create" → "Database"
4. Name: `test`
5. Create user `test` with password `test`
6. Grant privileges

**Verify:**
```powershell
psql -U test -d test -c "SELECT version();"
```

---

## Step 3: Verify Setup

```bash
# 1. Check environment variables
npm run test:env

# Expected: Should show DATABASE_URL_TEST, TEST_USER_EMAIL, TEST_USER_PASSWORD

# 2. Test database connection
npm run test:db

# Expected: ✅ Connection successful!
```

---

## Step 4: Run Migrations (Optional)

If you need database schema:

```powershell
# Set environment variable and run migrations
$env:DATABASE_URL="postgresql://test:test@localhost:5432/test"
npx prisma migrate deploy
```

---

## Step 5: Run Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

---

## Step 6: GitHub Secrets (Optional - For CI/CD)

**For GitHub Actions:**

1. Go to: `https://github.com/[your-username]/[your-repo]/settings/secrets/actions`

2. Click **"New repository secret"** for each:

   **Secret 1: `DATABASE_URL_TEST`**
   - Value: `postgresql://test:test@localhost:5432/test` (or your test DB URL)

   **Secret 2: `TEST_USER_EMAIL`**
   - Value: `test@example.com`

   **Secret 3: `TEST_USER_PASSWORD`**
   - Value: `test_password_123`

**See:** `GITHUB_SECRETS_SETUP.md` for detailed instructions

---

## Troubleshooting

### Issue: `.env.test.local` not found
**Solution:** Create the file manually (see Step 1)

### Issue: PostgreSQL not installed
**Solution:** 
- Install PostgreSQL: https://www.postgresql.org/download/windows/
- Or use Docker Desktop

### Issue: "Connection refused"
**Solution:**
- Ensure PostgreSQL service is running
- Check port (5432 for local, 5433 for Docker)
- Verify credentials in `.env.test.local`

### Issue: "Database does not exist"
**Solution:**
- Create database: `createdb test` or use psql commands above
- Verify database exists: `psql -U postgres -l`

---

## Quick Checklist

- [ ] Created `.env.test.local` file
- [ ] Set up test database (Docker or local)
- [ ] Updated `DATABASE_URL_TEST` in `.env.test.local`
- [ ] Ran `npm run test:env` - variables verified
- [ ] Ran `npm run test:db` - connection successful
- [ ] (Optional) Configured GitHub Secrets

---

## Files Reference

- **Environment Template:** Create `.env.test.local` manually (see Step 1)
- **Docker Config:** `docker-compose.test.yml`
- **Setup Script:** `scripts/setup-test-database.sh`
- **Documentation:** 
  - `SETUP_INSTRUCTIONS.md`
  - `GITHUB_SECRETS_SETUP.md`
  - `SETUP_TEST_DATABASE.md`

---

**Status:** ✅ Ready - Follow steps above  
**Last Updated:** 2024


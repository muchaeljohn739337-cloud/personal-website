# 🚀 Test Environment Setup Instructions

## Step 1: Create .env.test.local ✅

**Status:** Template ready

**Action:**

```bash
# Copy template
cp .env.test.local.example .env.test.local

# Or Windows PowerShell
Copy-Item .env.test.local.example .env.test.local
```

**File Contents:**

```
DATABASE_URL_TEST=postgresql://test:test@localhost:5433/test
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test_password_123
NODE_ENV=test
```

---

## Step 2: Set Up Test Database

### Option A: Docker (Recommended if Docker is installed)

```bash
# Automatic setup
npm run test:db:setup

# Or manual
docker-compose -f docker-compose.test.yml up -d
```

**Verify:**

```bash
docker ps | grep test-postgres
```

### Option B: Local PostgreSQL (If Docker not available)

**Prerequisites:** PostgreSQL installed locally

```bash
# Create test database
createdb test

# Or using psql
psql -U postgres -c "CREATE DATABASE test;"
psql -U postgres -c "CREATE USER test WITH PASSWORD 'test';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE test TO test;"
```

**Update `.env.test.local`:**

```
DATABASE_URL_TEST=postgresql://test:test@localhost:5432/test
```

---

## Step 3: Verify Connection ✅

```bash
# Check environment variables
npm run test:env

# Test database connection
npm run test:db
```

**Expected Output:**

```
✅ Connection successful!
✅ Connected to database: test
✅ All tests passed! Database connection is working.
```

---

## Step 4: Run Migrations (Optional)

If you need database schema:

```bash
# Using DATABASE_URL_TEST from .env.test.local
$env:DATABASE_URL="postgresql://test:test@localhost:5433/test"; npx prisma migrate deploy

# Or set manually
DATABASE_URL=postgresql://test:test@localhost:5433/test npx prisma migrate deploy
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

## Step 6: Configure GitHub Secrets (Optional)

For CI/CD testing:

1. Go to GitHub: `Settings` → `Secrets and variables` → `Actions`
2. Add secrets:
   - `DATABASE_URL_TEST` = `postgresql://test:test@localhost:5432/test` (or your test DB)
   - `TEST_USER_EMAIL` = `test@example.com`
   - `TEST_USER_PASSWORD` = `test_password_123`

**See:** `GITHUB_SECRETS_SETUP.md` for detailed instructions

---

## Troubleshooting

### Issue: "Cannot find module 'pg'"

**Solution:** Run `npm install`

### Issue: "Connection refused"

**Solution:**

- Ensure database is running
- Check port number (5433 for Docker, 5432 for local)
- Verify credentials in `.env.test.local`

### Issue: "Database does not exist"

**Solution:**

- Create database: `createdb test`
- Or use Docker: `npm run test:db:setup`

---

## Quick Reference

| Command                 | Description                  |
| ----------------------- | ---------------------------- |
| `npm run test:env`      | Verify environment variables |
| `npm run test:db`       | Test database connection     |
| `npm run test:db:setup` | Set up Docker test database  |
| `npm test`              | Run unit tests               |
| `npm run test:e2e`      | Run E2E tests                |

---

**Status:** ✅ Ready to Complete  
**Last Updated:** 2024

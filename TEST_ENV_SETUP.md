# 🧪 Test Environment Variables Setup Guide

## Overview

This guide helps you set up test environment variables for CI/CD workflows and local testing.

---

## Required Test Variables

### 1. `DATABASE_URL_TEST`

**Purpose:** Test database connection for unit and E2E tests

**Format:**
```
postgresql://user:password@host:port/database
```

**Options:**

#### Option A: Local PostgreSQL (Recommended for Development)
```bash
DATABASE_URL_TEST=postgresql://test:test@localhost:5432/test
```

**Setup:**
```bash
# Create test database
createdb test

# Or using psql
psql -U postgres -c "CREATE DATABASE test;"
psql -U postgres -c "CREATE USER test WITH PASSWORD 'test';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE test TO test;"
```

#### Option B: Supabase Test Database
```bash
DATABASE_URL_TEST=postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/test_db?pgbouncer=true
```

**Note:** Create a separate test database in Supabase for testing.

#### Option C: Docker PostgreSQL (Quick Setup)
```bash
# Run test database in Docker
docker run --name test-postgres \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=test \
  -p 5433:5432 \
  -d postgres:15

# Use this connection string
DATABASE_URL_TEST=postgresql://test:test@localhost:5433/test
```

---

### 2. `TEST_USER_EMAIL`

**Purpose:** Email address for E2E test user authentication

**Format:**
```
test@example.com
```

**Recommendations:**
- Use a test email that doesn't require verification
- Or configure email verification to be skipped in test environment
- Example: `test@example.com` or `e2e-test@advanciapayledger.com`

---

### 3. `TEST_USER_PASSWORD`

**Purpose:** Password for E2E test user

**Format:**
```
test_password_123
```

**Security Notes:**
- Use a simple password for testing (not production)
- This is only used in test environments
- Never use production passwords

---

## Setup Instructions

### Local Development

1. **Create `.env.test.local` file:**
```bash
cp env.example .env.test.local
```

2. **Update test variables:**
```bash
# Edit .env.test.local
DATABASE_URL_TEST=postgresql://test:test@localhost:5432/test
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test_password_123
```

3. **Run tests:**
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

---

### GitHub Actions (CI/CD)

#### Method 1: GitHub Secrets (Recommended)

1. **Go to GitHub Repository:**
   - Navigate to: `Settings` → `Secrets and variables` → `Actions`

2. **Add Secrets:**

   **`DATABASE_URL_TEST`**
   - Click "New repository secret"
   - Name: `DATABASE_URL_TEST`
   - Value: Your test database connection string
   - Click "Add secret"

   **`TEST_USER_EMAIL`**
   - Click "New repository secret"
   - Name: `TEST_USER_EMAIL`
   - Value: `test@example.com` (or your test email)
   - Click "Add secret"

   **`TEST_USER_PASSWORD`**
   - Click "New repository secret"
   - Name: `TEST_USER_PASSWORD`
   - Value: Your test user password
   - Click "Add secret"

3. **Verify in Workflow:**
   The CI workflow (`.github/workflows/ci.yml`) will automatically use these secrets:
   ```yaml
   env:
     DATABASE_URL: ${{ secrets.DATABASE_URL_TEST || 'postgresql://test:test@localhost:5432/test' }}
     TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
     TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
   ```

#### Method 2: Fallback Values (No Setup Required)

If you don't set GitHub secrets, the workflow uses fallback values:
- `DATABASE_URL_TEST`: `postgresql://test:test@localhost:5432/test`
- Other variables use default test values

**Note:** This works for basic tests but may fail if tests require actual database connections.

---

## Quick Setup Script

Create a test database quickly:

```bash
# Using Docker (easiest)
docker run --name test-postgres \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=test \
  -p 5433:5432 \
  -d postgres:15

# Wait for database to be ready
sleep 5

# Run migrations
DATABASE_URL=postgresql://test:test@localhost:5433/test npx prisma migrate deploy

# Set environment variable
export DATABASE_URL_TEST=postgresql://test:test@localhost:5433/test
```

---

## Verification

### Check Local Setup

```bash
# Verify DATABASE_URL_TEST is set
echo $DATABASE_URL_TEST

# Test database connection
psql $DATABASE_URL_TEST -c "SELECT version();"
```

### Check GitHub Secrets

1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. Verify all three secrets are listed:
   - ✅ `DATABASE_URL_TEST`
   - ✅ `TEST_USER_EMAIL`
   - ✅ `TEST_USER_PASSWORD`

### Run Tests

```bash
# Unit tests (should use DATABASE_URL_TEST)
npm test

# E2E tests (should use all test variables)
npm run test:e2e
```

---

## Troubleshooting

### Issue: Tests fail with "Database connection error"

**Solution:**
1. Verify `DATABASE_URL_TEST` is correct
2. Ensure test database is running
3. Check database credentials
4. Verify network connectivity

### Issue: E2E tests fail with "Authentication error"

**Solution:**
1. Verify `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are set
2. Ensure test user exists in database
3. Check if email verification is required (disable in test mode)

### Issue: GitHub Actions tests fail

**Solution:**
1. Check GitHub secrets are set correctly
2. Verify secret names match workflow file
3. Check workflow logs for specific error messages
4. Ensure test database is accessible from GitHub Actions runners

---

## Best Practices

1. **Separate Test Database:**
   - Always use a separate database for testing
   - Never use production database for tests

2. **Test User Management:**
   - Create dedicated test users
   - Use simple, predictable credentials
   - Clean up test data after tests

3. **Environment Isolation:**
   - Keep test environment variables separate
   - Use `.env.test.local` for local testing
   - Use GitHub Secrets for CI/CD

4. **Security:**
   - Test credentials should be simple but not exposed
   - Use GitHub Secrets for CI/CD
   - Never commit test credentials to git

---

## Related Files

- `.github/workflows/ci.yml` - CI workflow using these variables
- `env.example` - Template with test variables
- `package.json` - Test scripts

---

## Summary

✅ **Local Development:**
- Create `.env.test.local` with test variables
- Set up local test database

✅ **GitHub Actions:**
- Add secrets: `DATABASE_URL_TEST`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`
- Or rely on fallback values (may have limitations)

✅ **Verification:**
- Run tests locally
- Check GitHub Actions workflow runs

---

*Last Updated: 2024*


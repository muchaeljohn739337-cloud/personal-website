# 🔐 GitHub Secrets Setup for CI/CD

## Overview

This guide helps you configure GitHub Secrets for test environment variables in CI/CD workflows.

**Status:** Optional (workflow has fallback values)  
**Recommended:** Yes, for better test coverage

---

## Required Secrets

The following secrets are used by the CI workflow (`.github/workflows/ci.yml`):

1. **`DATABASE_URL_TEST`** - Test database connection string
2. **`TEST_USER_EMAIL`** - Test user email for E2E tests
3. **`TEST_USER_PASSWORD`** - Test user password for E2E tests

---

## Setup Instructions

### Step 1: Navigate to GitHub Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** (top navigation)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add Secrets

Click **"New repository secret"** for each secret:

#### Secret 1: `DATABASE_URL_TEST`

- **Name:** `DATABASE_URL_TEST`
- **Value:** Your test database connection string

**Options:**

**Option A: Docker Test Database (Local CI)**
```
postgresql://test:test@localhost:5432/test
```

**Option B: Supabase Test Database (Recommended)**
```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/test_db?pgbouncer=true
```

**Option C: Cloud Test Database**
```
postgresql://user:password@host:5432/test_db
```

**Note:** Create a separate test database, never use production database!

---

#### Secret 2: `TEST_USER_EMAIL`

- **Name:** `TEST_USER_EMAIL`
- **Value:** Test user email for E2E tests

**Example:**
```
test@example.com
```

**Or:**
```
e2e-test@advanciapayledger.com
```

---

#### Secret 3: `TEST_USER_PASSWORD`

- **Name:** `TEST_USER_PASSWORD`
- **Value:** Test user password for E2E tests

**Example:**
```
test_password_123
```

**Security Note:** This is only for testing. Use a simple password, not production credentials.

---

## Verification

### Check Secrets Are Set

1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. Verify all three secrets are listed:
   - ✅ `DATABASE_URL_TEST`
   - ✅ `TEST_USER_EMAIL`
   - ✅ `TEST_USER_PASSWORD`

### Test in CI Workflow

1. Push a commit or create a PR
2. Go to **Actions** tab
3. Check the workflow run
4. Verify tests use the secrets (check logs)

---

## Workflow Usage

The CI workflow (`.github/workflows/ci.yml`) uses these secrets like this:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL_TEST || 'postgresql://test:test@localhost:5432/test' }}
  TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
  TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

**Fallback Values:**
- If secrets are not set, the workflow uses default fallback values
- Tests will still run, but may have limited functionality

---

## Best Practices

### 1. Separate Test Database

✅ **DO:**
- Use a dedicated test database
- Create separate test database in Supabase/cloud provider
- Use Docker for local testing

❌ **DON'T:**
- Use production database for tests
- Share test database with production

### 2. Test User Management

✅ **DO:**
- Create dedicated test users
- Use simple, predictable credentials
- Clean up test data after tests

❌ **DON'T:**
- Use production user credentials
- Commit test credentials to code

### 3. Security

✅ **DO:**
- Store secrets in GitHub Secrets (not in code)
- Rotate secrets periodically
- Use least-privilege access

❌ **DON'T:**
- Commit secrets to repository
- Share secrets in public channels
- Use production credentials for tests

---

## Troubleshooting

### Issue: Tests fail with "Database connection error"

**Solution:**
1. Verify `DATABASE_URL_TEST` is correct
2. Check database is accessible from GitHub Actions
3. Verify credentials are correct
4. Check network/firewall settings

### Issue: E2E tests fail with "Authentication error"

**Solution:**
1. Verify `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are set
2. Ensure test user exists in database
3. Check if email verification is required (disable in test mode)

### Issue: Secrets not being used

**Solution:**
1. Verify secret names match exactly (case-sensitive)
2. Check workflow file uses correct secret names
3. Ensure secrets are set in correct repository
4. Check workflow logs for errors

---

## Quick Reference

### Secret Names (Exact Match Required)

```
DATABASE_URL_TEST
TEST_USER_EMAIL
TEST_USER_PASSWORD
```

### Default Fallback Values

If secrets are not set, workflow uses:
- `DATABASE_URL_TEST`: `postgresql://test:test@localhost:5432/test`
- `TEST_USER_EMAIL`: Not set (tests may fail)
- `TEST_USER_PASSWORD`: Not set (tests may fail)

---

## Related Documentation

- `.github/workflows/ci.yml` - CI workflow using these secrets
- `TEST_ENV_SETUP.md` - Complete test environment setup guide
- `env.example` - Environment variables template

---

**Last Updated:** 2024  
**Status:** ✅ Ready to Configure


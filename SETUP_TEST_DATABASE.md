# 🐳 Test Database Setup Guide

## Quick Setup Options

### Option 1: Docker (Recommended) ⭐

**Prerequisites:** Docker Desktop installed

**Steps:**

1. **Start test database:**

   ```bash
   npm run test:db:setup
   ```

   Or manually:

   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. **Verify it's running:**

   ```bash
   docker ps | grep test-postgres
   ```

3. **Test connection:**
   ```bash
   npm run test:db
   ```

**Connection String:**

```
DATABASE_URL_TEST=postgresql://test:test@localhost:5433/test
```

---

### Option 2: Docker Run (Manual)

```bash
docker run --name test-postgres \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=test \
  -p 5433:5432 \
  -d postgres:15-alpine

# Wait for database to be ready
sleep 5

# Test connection
npm run test:db
```

---

### Option 3: Local PostgreSQL

**Prerequisites:** PostgreSQL installed locally

**Steps:**

1. **Create test database:**

   ```bash
   createdb test
   ```

   Or using psql:

   ```bash
   psql -U postgres -c "CREATE DATABASE test;"
   psql -U postgres -c "CREATE USER test WITH PASSWORD 'test';"
   psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE test TO test;"
   ```

2. **Update `.env.test.local`:**

   ```
   DATABASE_URL_TEST=postgresql://test:test@localhost:5432/test
   ```

3. **Test connection:**
   ```bash
   npm run test:db
   ```

---

### Option 4: Cloud Database (Supabase/Neon)

**For CI/CD or remote testing:**

1. **Create a separate test database** in your cloud provider
2. **Get connection string** from provider dashboard
3. **Update `.env.test.local`:**
   ```
   DATABASE_URL_TEST=postgresql://user:password@host:port/test_db
   ```

---

## Setup .env.test.local

1. **Copy template:**

   ```bash
   cp .env.test.local.example .env.test.local
   ```

2. **Update with your values:**
   - `DATABASE_URL_TEST` - Your test database connection string
   - `TEST_USER_EMAIL` - Test user email
   - `TEST_USER_PASSWORD` - Test user password

3. **Verify:**
   ```bash
   npm run test:env
   ```

---

## Run Migrations

After setting up the database, run Prisma migrations:

```bash
# Using DATABASE_URL_TEST from .env.test.local
DATABASE_URL=$(grep DATABASE_URL_TEST .env.test.local | cut -d '=' -f2) npx prisma migrate deploy
```

Or set it manually:

```bash
DATABASE_URL=postgresql://test:test@localhost:5433/test npx prisma migrate deploy
```

---

## Verify Setup

```bash
# 1. Check environment variables
npm run test:env

# 2. Test database connection
npm run test:db

# 3. Run tests
npm test
```

---

## Docker Commands Reference

```bash
# Start database
docker-compose -f docker-compose.test.yml up -d

# Stop database
docker-compose -f docker-compose.test.yml down

# View logs
docker-compose -f docker-compose.test.yml logs -f

# Remove database (clean slate)
docker-compose -f docker-compose.test.yml down -v
```

---

## Troubleshooting

### Docker not found

- Install Docker Desktop: https://www.docker.com/products/docker-desktop
- Or use Option 3 (Local PostgreSQL)

### Port 5433 already in use

- Change port in `docker-compose.test.yml` to `5434:5432`
- Update `DATABASE_URL_TEST` to use port 5434

### Connection refused

- Ensure database is running: `docker ps`
- Check port is correct
- Verify credentials match

---

**Last Updated:** 2024

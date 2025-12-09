# Supabase Database Configuration

## Overview

This project uses Supabase PostgreSQL with two connection types:

1. **Connection Pooling** (`DATABASE_URL`) - For application queries
2. **Direct Connection** (`DIRECT_URL`) - For migrations and schema operations

---

## Environment Variables

### Connection Pooling (DATABASE_URL)

**Purpose:** Used for all application database queries and operations.

**Format:**

```bash
DATABASE_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Key Features:**

- Port: `6543` (connection pooler)
- Query parameter: `?pgbouncer=true`
- Optimized for high concurrency
- Better connection management
- Recommended for production

### Direct Connection (DIRECT_URL)

**Purpose:** Used for Prisma migrations and schema operations.

**Format:**

```bash
DIRECT_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

**Key Features:**

- Port: `5432` (direct PostgreSQL)
- No query parameters needed
- Required for migrations
- Used by Prisma for schema operations

---

## Setup Instructions

### 1. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Under **Connection string**, you'll see:
   - **Connection pooling** (port 6543) → Use for `DATABASE_URL`
   - **Direct connection** (port 5432) → Use for `DIRECT_URL`

### 2. Set Environment Variables

**Local Development (`.env.local`):**

```bash
# Connection Pooling (Application)
DATABASE_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct Connection (Migrations)
DIRECT_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

**Production (Vercel/Cloudflare):**

- Add both `DATABASE_URL` and `DIRECT_URL` to your deployment platform
- Replace `[YOUR-PASSWORD]` with your actual database password
- Ensure password is URL-encoded if it contains special characters

---

## Prisma Configuration

### Using DIRECT_URL for Migrations

Prisma will automatically use `DIRECT_URL` if available, otherwise falls back to `DATABASE_URL`.

**Migration Commands:**

```bash
# Create migration
npm run prisma:migrate

# Deploy migrations (production)
npm run migrate:prod

# Generate Prisma Client
npm run prisma:generate
```

**Note:** Prisma migrations require direct connection, so `DIRECT_URL` is essential.

---

## When to Use Each Connection

### Use DATABASE_URL (Connection Pooling) For:

- ✅ All application queries
- ✅ API route handlers
- ✅ Server Components
- ✅ Client Components (via API)
- ✅ Production operations
- ✅ High-concurrency scenarios

### Use DIRECT_URL (Direct Connection) For:

- ✅ Prisma migrations
- ✅ Schema operations
- ✅ Database introspection
- ✅ Prisma Studio
- ✅ One-time setup operations

---

## Connection String Components

### Connection Pooling URL Breakdown:

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
│          │                              │              │                                    │    │
│          │                              │              │                                    │    └─ Query: Enable pgbouncer
│          │                              │              │                                    └─ Port: 6543 (pooler)
│          │                              │              └─ Host: Supabase pooler endpoint
│          │                              └─ Password: Your database password
│          └─ Username: postgres.[PROJECT-REF]
└─ Protocol: PostgreSQL
```

### Direct Connection URL Breakdown:

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
│          │                              │              │                                    │
│          │                              │              │                                    └─ Port: 5432 (direct)
│          │                              │              └─ Host: Supabase pooler endpoint
│          │                              └─ Password: Your database password
│          └─ Username: postgres.[PROJECT-REF]
└─ Protocol: PostgreSQL
```

---

## Security Best Practices

1. **Never Commit Passwords:**
   - Keep `.env.local` out of git
   - Use environment variables in production
   - Rotate passwords regularly

2. **URL Encoding:**
   - If password contains special characters, URL-encode them
   - Example: `@` becomes `%40`, `#` becomes `%23`

3. **Connection Limits:**
   - Connection pooling helps manage connection limits
   - Direct connection has stricter limits
   - Use pooling for production workloads

4. **SSL/TLS:**
   - Supabase connections are encrypted by default
   - No need to add `?sslmode=require` (handled automatically)

---

## Troubleshooting

### Connection Pooling Issues

**Error:** `Connection limit exceeded`

**Solution:**

- Verify you're using connection pooling (port 6543)
- Check connection pooler is enabled
- Review connection usage in Supabase dashboard

### Migration Issues

**Error:** `Migration failed - connection error`

**Solution:**

- Ensure `DIRECT_URL` is set
- Verify direct connection works (port 5432)
- Check database password is correct

### Authentication Issues

**Error:** `Authentication failed`

**Solution:**

1. Verify password is correct
2. Check password is URL-encoded if needed
3. Verify project reference is correct
4. Check database is accessible

---

## Testing Connections

### Test Connection Pooling:

```bash
# Using psql
psql $DATABASE_URL

# Or test with Node.js
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('Connected!')).catch(console.error);"
```

### Test Direct Connection:

```bash
# Using psql
psql $DIRECT_URL

# Or test Prisma
npx prisma db pull
```

---

## Project-Specific Configuration

**Your Supabase Project:**

- **Project Reference:** `xesecqcqzykvmrtxrzqi`
- **Project URL:** `https://xesecqcqzykvmrtxrzqi.supabase.co`
- **Region:** `us-east-1`

**Connection Strings:**

- **Pooling:** `postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Direct:** `postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres`

---

## Additional Resources

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma Connection URLs](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Supabase Database Settings](https://app.supabase.com/project/_/settings/database)

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")  
**Status:** Production Ready

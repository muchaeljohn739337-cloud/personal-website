# Supabase API Schema Setup Guide

## Overview

This guide explains how to set up your Supabase database to use the `api` schema instead of the `public` schema. The `api` schema is required for Supabase API access, as the `public` schema is not accessible via the Supabase REST API.

**Reference:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi

---

## Why API Schema?

- ✅ **Required for Supabase API Access**: The `public` schema is not accessible via Supabase REST API
- ✅ **Better Security**: Isolated schema with proper permissions
- ✅ **Clear Separation**: API tables separate from internal database objects
- ✅ **RLS Support**: Row Level Security works better with dedicated schema

---

## Step 1: Create API Schema

### Option A: Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard SQL Editor:
   https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/sql/new

2. Run this SQL:

```sql
-- Create api schema
CREATE SCHEMA IF NOT EXISTS api;

-- Grant usage to anon and authenticated roles
GRANT USAGE ON SCHEMA api TO anon;
GRANT USAGE ON SCHEMA api TO authenticated;
```

### Option B: Via Script

```bash
npm run setup:supabase:api:schema
```

This will provide instructions and the SQL script to run.

---

## Step 2: Update Prisma Schema

Update `prisma/schema.prisma` to use the `api` schema:

### Option A: Set Default Schema (Recommended)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  schemas   = ["api"]  // Add this
}

// Then add to each model:
model User {
  // ... fields ...
  @@schema("api")  // Add this
  @@map("users")
}
```

### Option B: Add to Each Model

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  // ... other fields ...

  @@schema("api")  // Add this line
  @@map("users")
}

model Wallet {
  id     String @id @default(cuid())
  // ... fields ...

  @@schema("api")  // Add this line
  @@map("wallets")
}
```

---

## Step 3: Grant Permissions

Run this SQL in Supabase Dashboard:

```sql
-- Grant SELECT to anon (public read access)
GRANT SELECT ON TABLE api.users TO anon;
GRANT SELECT ON TABLE api.wallets TO anon;
-- ... repeat for all tables

-- Grant full CRUD to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE api.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE api.wallets TO authenticated;
-- ... repeat for all tables
```

### Automated Script

For all tables at once:

```sql
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'api'
    LOOP
        -- Grant SELECT to anon
        EXECUTE format('GRANT SELECT ON TABLE api.%I TO anon', r.tablename);

        -- Grant full CRUD to authenticated
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE api.%I TO authenticated', r.tablename);
    END LOOP;
END $$;
```

---

## Step 4: Enable Row Level Security (RLS)

```sql
-- Enable RLS on all api schema tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'api'
    LOOP
        EXECUTE format('ALTER TABLE api.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;
```

---

## Step 5: Create RLS Policies

### Example: Public Read Access

```sql
-- Allow anon to read public data
CREATE POLICY "anon_read_users" ON api.users
    FOR SELECT
    TO anon
    USING (true);
```

### Example: Authenticated User Access

```sql
-- Allow authenticated users to access their own data
CREATE POLICY "authenticated_user_access" ON api.users
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = id);
```

### Example: Admin Access

```sql
-- Allow admins full access
CREATE POLICY "admin_full_access" ON api.users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM api.users
            WHERE id = auth.uid()::text
            AND role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );
```

---

## Step 6: Run Prisma Migrations

After updating the schema:

```bash
# Generate Prisma client
npm run prisma:generate

# Create and run migration
npm run prisma:migrate

# Or deploy to production
npm run migrate:prod
```

---

## Step 7: Update Code References

### Update Supabase Client Queries

**Before (public schema):**

```typescript
const { data } = await supabase.from('users').select('*');
```

**After (api schema):**

```typescript
// Supabase automatically uses api schema if configured
const { data } = await supabase.from('users').select('*');
```

### Update Database Utilities

If you have custom database utilities, ensure they reference the `api` schema:

```typescript
// lib/supabase/database.ts
export async function queryTable(tableName: string) {
  // Supabase client automatically uses api schema
  const { data, error } = await supabase
    .from(tableName) // Will use api schema
    .select('*');
  return { data, error };
}
```

---

## Step 8: Verify Setup

### Check Tables in API Schema

```sql
SELECT
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_schema = 'api'
ORDER BY table_name;
```

### Check Permissions

```sql
SELECT
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'api'
ORDER BY table_name, grantee;
```

### Test API Access

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// This should work if api schema is set up correctly
const { data, error } = await supabase.from('users').select('*');
console.log('API Access:', error ? 'Failed' : 'Success', data);
```

---

## Common Tables to Migrate

Based on your Prisma schema, these tables should be in the `api` schema:

- `users` (User model)
- `wallets` (Wallet model)
- `transactions` (Transaction model)
- `payments` (Payment model)
- `subscriptions` (Subscription model)
- `organizations` (Organization model)
- `workspaces` (Workspace model)
- `blog_posts` (BlogPost model)
- `posts` (Post model)
- `comments` (Comment model)
- `admin_actions` (AdminAction model)
- And all other application tables

---

## Troubleshooting

### Issue: "relation does not exist"

**Solution:** Tables are still in `public` schema. Run migrations to create them in `api` schema.

### Issue: "permission denied for schema api"

**Solution:** Grant usage on schema:

```sql
GRANT USAGE ON SCHEMA api TO anon;
GRANT USAGE ON SCHEMA api TO authenticated;
```

### Issue: "permission denied for table"

**Solution:** Grant table permissions:

```sql
GRANT SELECT ON TABLE api.<table_name> TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE api.<table_name> TO authenticated;
```

### Issue: "RLS policy violation"

**Solution:** Create appropriate RLS policies for your use case.

---

## Quick Reference

### SQL Commands

```sql
-- Create schema
CREATE SCHEMA IF NOT EXISTS api;

-- Grant schema usage
GRANT USAGE ON SCHEMA api TO anon, authenticated;

-- Grant table permissions (example)
GRANT SELECT ON TABLE api.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE api.users TO authenticated;

-- Enable RLS
ALTER TABLE api.users ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "anon_read" ON api.users FOR SELECT TO anon USING (true);
```

### NPM Commands

```bash
# Setup instructions
npm run setup:supabase:api:schema

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Deploy to production
npm run migrate:prod
```

### Dashboard Links

- **SQL Editor:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/sql/new
- **Database Tables:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/editor
- **Policies:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/auth/policies

---

## Status: ✅ Ready to Deploy

Once you've completed these steps:

1. ✅ API schema created
2. ✅ Permissions granted
3. ✅ RLS enabled
4. ✅ Prisma schema updated
5. ✅ Migrations run
6. ✅ Code updated

Your Supabase API will be fully accessible via the `api` schema!

---

## Next Steps

1. Run setup script: `npm run setup:supabase:api:schema`
2. Follow the SQL instructions in Supabase Dashboard
3. Update Prisma schema
4. Run migrations
5. Test API access
6. Deploy to production

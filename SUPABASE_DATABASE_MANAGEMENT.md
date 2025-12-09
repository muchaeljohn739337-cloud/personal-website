# Supabase Database Management Guide

## Overview

Complete guide for managing Supabase database schema, storage, and all database components.

---

## Client Libraries Installation

### JavaScript/TypeScript (Node.js/Next.js)

**Already Installed:**
```bash
npm list @supabase/supabase-js @supabase/ssr
```

**If Not Installed:**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Status:** ✅ Installed in this project

### Python (Optional - for scripts/automation)

**Install:**
```bash
pip install supabase
```

**Note:** Python client is optional and not required for Next.js application.

---

## Database Schema Management

### Schema Components

Supabase PostgreSQL database includes:

1. **Tables** - Data storage
2. **Functions** - Stored procedures
3. **Triggers** - Automated actions
4. **Enumerated Types** - Custom types
5. **Extensions** - PostgreSQL extensions
6. **Indexes** - Query optimization
7. **Publications** - Replication
8. **Configuration** - Database settings
9. **Roles** - User permissions
10. **Policies** - Row Level Security (RLS)

---

## Accessing Schema Information

### Method 1: Supabase Dashboard (Visual)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Database** → **Tables**
4. View schema visually with:
   - Table relationships
   - Column types
   - Indexes
   - Foreign keys
   - Policies

### Method 2: Supabase Studio

1. In Dashboard, click **Table Editor**
2. Visual schema editor
3. Create/edit tables
4. Manage relationships
5. Set up RLS policies

### Method 3: Prisma Studio

```bash
npm run prisma:studio
```

Opens visual editor for Prisma schema at `http://localhost:5555`

### Method 4: SQL Editor

1. Go to **SQL Editor** in Supabase Dashboard
2. Run queries to inspect schema:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- List all functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- List all triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- List all indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';

-- List all policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- List all roles
SELECT rolname FROM pg_roles;

-- List all extensions
SELECT extname FROM pg_extension;
```

### Method 5: Command Line Script

```bash
npm run supabase:schema
```

Runs schema verification script.

---

## Storage Management

### Storage Buckets

**Required Buckets:**
- `user-avatars` - User profile images (public)
- `blog-images` - Blog post images (public)
- `workspace-assets` - Workspace files (private)
- `ai-outputs` - AI-generated content (private)
- `documents` - User documents (private)

### Check Storage

**Via Dashboard:**
1. Go to **Storage** in Supabase Dashboard
2. View all buckets
3. Manage files and permissions

**Via Script:**
```bash
npm run supabase:storage
```

**Via Code:**
```typescript
import { getStorage } from '@/lib/storage/supabase';

const storage = getStorage();

// List buckets
const buckets = await storage.list('user-avatars');

// Upload file
await storage.uploadFile({
  bucket: 'user-avatars',
  path: 'user-123/avatar.jpg',
  file: fileBuffer,
});
```

---

## Database Components

### 1. Tables

**Current Tables (from Prisma):**
- User
- Wallet
- Transaction
- Payment
- Subscription
- Organization
- Workspace
- BlogPost
- And many more...

**View Tables:**
```bash
npm run supabase:schema
```

**Create/Modify Tables:**
- Use Prisma migrations: `npm run prisma:migrate`
- Or Supabase Dashboard → Table Editor

### 2. Functions

**Common Functions:**
- Custom SQL functions
- Stored procedures
- Database triggers

**Create Function:**
```sql
CREATE OR REPLACE FUNCTION function_name()
RETURNS void AS $$
BEGIN
  -- Function logic
END;
$$ LANGUAGE plpgsql;
```

### 3. Triggers

**Common Triggers:**
- Auto-update `updated_at` timestamps
- Audit logging
- Data validation

**Example:**
```sql
CREATE TRIGGER update_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 4. Enumerated Types

**From Prisma Schema:**
- UserRole (USER, ADMIN, SUPER_ADMIN)
- PaymentProvider (STRIPE, LEMONSQUEEZY, etc.)
- TransactionType (DEPOSIT, WITHDRAWAL, etc.)
- And more...

**View Types:**
```sql
SELECT typname FROM pg_type WHERE typtype = 'e';
```

### 5. Extensions

**Common Extensions:**
- `uuid-ossp` - UUID generation
- `pgcrypto` - Cryptographic functions
- `pg_trgm` - Text search
- `vector` - Vector similarity (if using AI)

**Enable Extension:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 6. Indexes

**Automatic Indexes:**
- Primary keys
- Foreign keys
- Unique constraints

**Custom Indexes:**
```sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_transaction_user_id ON transactions(user_id);
```

**View Indexes:**
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### 7. Publications

**For Replication:**
- Logical replication
- Read replicas
- Cross-region sync

**Note:** Usually managed by Supabase automatically.

### 8. Configuration

**Database Settings:**
- Connection limits
- Timeout settings
- SSL configuration
- Performance tuning

**Access:** Supabase Dashboard → Settings → Database

### 9. Roles

**Default Roles:**
- `postgres` - Superuser
- `anon` - Anonymous access
- `authenticated` - Authenticated users
- `service_role` - Service role (admin)

**View Roles:**
```sql
SELECT rolname FROM pg_roles;
```

### 10. Policies (Row Level Security)

**RLS Policies:**
- User data access
- Organization isolation
- Public/private content

**Example Policy:**
```sql
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);
```

**View Policies:**
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## Verification Scripts

### Schema Check

```bash
npm run supabase:schema
```

**Checks:**
- ✅ Connection
- ✅ Tables
- ✅ Functions
- ✅ Triggers
- ✅ Indexes
- ✅ Policies

### Storage Check

```bash
npm run supabase:storage
```

**Checks:**
- ✅ Buckets
- ✅ Files
- ✅ Permissions

---

## Prisma Integration

### Schema Management

**Prisma Schema:** `prisma/schema.prisma`

**Commands:**
```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Apply migrations
npm run migrate:prod

# Open Prisma Studio
npm run prisma:studio

# Reset database (dev only)
npm run db:reset
```

### Connection Configuration

**Prisma uses:**
- `DATABASE_URL` - For queries (connection pooling)
- `DIRECT_URL` - For migrations (direct connection)

**Schema:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooling
  directUrl = env("DIRECT_URL")        // Direct
}
```

---

## Supabase Dashboard Access

### Database Management

1. **Tables:** Database → Tables
2. **SQL Editor:** Database → SQL Editor
3. **Migrations:** Database → Migrations
4. **Extensions:** Database → Extensions
5. **Roles:** Database → Roles
6. **Policies:** Database → Policies

### Storage Management

1. **Buckets:** Storage → Buckets
2. **Files:** Storage → Files
3. **Policies:** Storage → Policies

---

## Quick Reference

### Check Schema
```bash
npm run supabase:schema
```

### Check Storage
```bash
npm run supabase:storage
```

### View in Dashboard
- [Supabase Dashboard](https://app.supabase.com)
- Select project: `xesecqcqzykvmrtxrzqi`

### Prisma Studio
```bash
npm run prisma:studio
```

---

## Troubleshooting

### Cannot Connect to Database

**Check:**
1. `DATABASE_URL` is set correctly
2. Password is URL-encoded
3. Connection pooler URL (port 6543)
4. Firewall allows connections

### Schema Not Syncing

**Solution:**
1. Run Prisma migrations: `npm run prisma:migrate`
2. Check `DIRECT_URL` is set
3. Verify database permissions

### Storage Access Denied

**Solution:**
1. Check bucket policies
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Check RLS policies on storage

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")  
**Status:** Ready for Use


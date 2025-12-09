# Supabase Schema Visualizer & Database Management Guide

## Overview

Complete guide for visualizing and managing your Supabase database schema, including all components: Tables, Functions, Triggers, Enumerated Types, Extensions, Indexes, Publications, Configuration, Roles, and Policies.

---

## Schema Visualizer Tools

### 1. Supabase Dashboard (Primary Tool)

**URL:** https://app.supabase.com/project/xesecqcqzykvmrtxrzqi

**Access:**

1. Go to Supabase Dashboard
2. Select project: `xesecqcqzykvmrtxrzqi`
3. Navigate to **Database** section

**Features:**

- ✅ Visual table editor
- ✅ Relationship diagrams
- ✅ Column types and constraints
- ✅ Index visualization
- ✅ Policy management
- ✅ SQL editor with syntax highlighting

---

### 2. Prisma Studio (Local Visualizer)

**Command:**

```bash
npm run prisma:studio
```

**Access:**

- Opens at: http://localhost:5555
- Visual schema browser
- Data editor
- Relationship navigation

**Features:**

- ✅ Browse all tables
- ✅ Edit data visually
- ✅ View relationships
- ✅ Search and filter
- ✅ Create/edit records

---

### 3. SQL Editor (Advanced)

**Location:** Supabase Dashboard → Database → SQL Editor

**Use for:**

- Custom queries
- Schema inspection
- Data analysis
- Function creation

---

## Database Components

### 1. Tables

**View Tables:**

- **Dashboard:** Database → Tables
- **Prisma Studio:** `npm run prisma:studio`
- **SQL:**
  ```sql
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
  ```

**Current Tables (from Prisma Schema):**

- User, Wallet, Transaction, Payment
- Subscription, Organization, Workspace
- BlogPost, Post, Comment
- And 30+ more tables

---

### 2. Functions

**View Functions:**

- **Dashboard:** Database → Functions
- **SQL:**
  ```sql
  SELECT
    routine_name,
    routine_type,
    data_type
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  ORDER BY routine_name;
  ```

**Common Functions:**

- Custom SQL functions
- Stored procedures
- Database triggers

---

### 3. Triggers

**View Triggers:**

- **Dashboard:** Database → Triggers
- **SQL:**
  ```sql
  SELECT
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  ORDER BY event_object_table;
  ```

**Common Triggers:**

- Auto-update `updated_at` timestamps
- Audit logging
- Data validation

---

### 4. Enumerated Types

**View Types:**

- **SQL:**
  ```sql
  SELECT
    typname as type_name,
    oid
  FROM pg_type
  WHERE typtype = 'e'
  ORDER BY typname;
  ```

**From Prisma Schema:**

- `UserRole` (USER, ADMIN, SUPER_ADMIN)
- `PaymentProvider` (STRIPE, LEMONSQUEEZY, etc.)
- `TransactionType` (DEPOSIT, WITHDRAWAL, etc.)
- And more...

---

### 5. Extensions

**View Extensions:**

- **Dashboard:** Database → Extensions
- **SQL:**
  ```sql
  SELECT
    extname as extension_name,
    extversion as version
  FROM pg_extension
  ORDER BY extname;
  ```

**Common Extensions:**

- `uuid-ossp` - UUID generation
- `pgcrypto` - Cryptographic functions
- `pg_trgm` - Text search
- `vector` - Vector similarity (AI)

**Enable Extension:**

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

### 6. Indexes

**View Indexes:**

- **Dashboard:** Database → Indexes
- **SQL:**
  ```sql
  SELECT
    tablename,
    indexname,
    indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;
  ```

**Automatic Indexes:**

- Primary keys
- Foreign keys
- Unique constraints

**Custom Indexes:**

```sql
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_transaction_user_id ON "Transaction"(user_id);
```

---

### 7. Publications

**View Publications:**

- **SQL:**
  ```sql
  SELECT
    pubname as publication_name
  FROM pg_publication;
  ```

**Note:** Usually managed by Supabase for replication.

---

### 8. Configuration

**Access:**

- **Dashboard:** Settings → Database
- Connection settings
- Performance tuning
- Backup configuration

---

### 9. Roles

**View Roles:**

- **SQL:**
  ```sql
  SELECT
    rolname,
    rolsuper,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
  FROM pg_roles
  ORDER BY rolname;
  ```

**Default Roles:**

- `postgres` - Superuser
- `anon` - Anonymous access
- `authenticated` - Authenticated users
- `service_role` - Service role (admin)

---

### 10. Policies (Row Level Security)

**View Policies:**

- **Dashboard:** Database → Policies
- **SQL:**
  ```sql
  SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
  ```

**RLS Policies:**

- User data access
- Organization isolation
- Public/private content

**Example:**

```sql
CREATE POLICY "Users can view own data"
ON "User" FOR SELECT
USING (auth.uid()::text = id);
```

---

## Complete Schema Query

**Get All Schema Information:**

```sql
-- Complete Schema Overview
SELECT
  'Tables' as component_type,
  count(*) as count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL

SELECT
  'Functions',
  count(*)
FROM information_schema.routines
WHERE routine_schema = 'public'

UNION ALL

SELECT
  'Triggers',
  count(*)
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

SELECT
  'Indexes',
  count(*)
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

SELECT
  'Policies',
  count(*)
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT
  'Types',
  count(*)
FROM pg_type
WHERE typtype = 'e'

UNION ALL

SELECT
  'Extensions',
  count(*)
FROM pg_extension;
```

---

## Storage Management

### View Storage

**Via Dashboard:**

1. Go to Storage section
2. View all buckets
3. Check files and permissions

**Via Script:**

```bash
npm run supabase:storage
```

**Via Code:**

```typescript
import { getStorage } from '@/lib/storage/supabase';

const storage = getStorage();
const files = await storage.listFiles('user-avatars');
```

---

## Quick Reference

### Access Dashboard

- **URL:** https://app.supabase.com/project/xesecqcqzykvmrtxrzqi
- **Project:** `xesecqcqzykvmrtxrzqi`

### Commands

```bash
# Schema check
npm run supabase:schema

# Storage check
npm run supabase:storage

# Prisma Studio
npm run prisma:studio

# Generate Prisma Client
npm run prisma:generate
```

### SQL Queries

- All queries available in `SUPABASE_DATABASE_MANAGEMENT.md`
- Run in Supabase Dashboard → SQL Editor

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")  
**Status:** Ready for Use

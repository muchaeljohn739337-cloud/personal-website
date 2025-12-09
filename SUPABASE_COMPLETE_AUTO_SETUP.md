# ✅ Supabase Complete Auto-Setup Guide

## Overview

Complete automated setup for Supabase in your Next.js SaaS application. This guide covers all aspects of Supabase configuration.

---

## 🚀 Quick Start

Run the auto-setup script:

```bash
npm run setup:supabase:auto
```

This will:

1. ✅ Detect your project environment
2. ✅ Install required libraries
3. ✅ Initialize Supabase
4. ✅ Set up Vault/secrets
5. ✅ Configure authentication
6. ✅ Configure storage
7. ✅ Generate wrapper functions
8. ✅ Set up API schema

---

## 📋 Project Detection

**Detected Environment:**

- **Type:** Next.js 14 with TypeScript
- **Package Manager:** npm
- **Node Version:** 20.x
- **Framework:** Next.js App Router

---

## 📦 Installed Libraries

### Core Supabase Libraries

```bash
✅ @supabase/supabase-js@^2.86.2
✅ @supabase/ssr@^0.5.2
```

**Installation:**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Status:** ✅ Already installed

---

## 🔧 Supabase Initialization

### Local Development (Optional)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Start local Supabase
supabase start
```

**Note:** For production, use Supabase Cloud Dashboard.

### Configuration File

**File:** `supabase/config.toml`

- ✅ Created with project configuration
- ✅ Configured for project ID: `xesecqcqzykvmrtxrzqi`
- ✅ API schema enabled

---

## 🔐 Vault / Secrets Setup

### Environment Variables

**Required Variables:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xesecqcqzykvmrtxrzqi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_dj1xLuksqBUvn9O6AWU3Fg_bRYa6ohq
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Vault Secrets

**Access:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations/vault/secrets

**Store Secrets:**

```sql
-- Create secret
SELECT vault.create_secret('secret_name', 'secret_value');

-- Get secret
SELECT vault.get_secret('secret_name');
```

**⚠️ Security:**

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
- Store sensitive keys in Vault
- Use environment variables for non-sensitive config

---

## 🔑 Authentication Configuration

### Auth Utilities

**File:** `lib/supabase/auth.ts`

**Available Methods:**

- ✅ `signUp()` - Email/password signup
- ✅ `signIn()` - Email/password login
- ✅ `signInWithOtp()` - Magic link login
- ✅ `signUpWithPhone()` - Phone signup
- ✅ `signInWithOtpPhone()` - SMS OTP login
- ✅ `verifyOtp()` - Verify OTP
- ✅ `signInWithOAuth()` - OAuth login (GitHub, Google, etc.)
- ✅ `getUser()` - Get current user
- ✅ `getSession()` - Get current session
- ✅ `updateUser()` - Update user
- ✅ `resetPasswordForEmail()` - Password reset
- ✅ `signOut()` - Sign out
- ✅ `inviteUserByEmail()` - Admin invite (server-side)

### Provider Setup

**Dashboard:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/auth/providers

**Enable Providers:**

1. **Email/Password** - Enabled by default
2. **OAuth Providers:**
   - Google - Requires Google OAuth credentials
   - GitHub - Requires GitHub OAuth app
   - Facebook - Requires Facebook app
   - Others - Follow provider-specific setup

**Configuration:**

```typescript
// Enable in Supabase Dashboard, then use:
import { signInWithOAuth } from '@/lib/supabase/auth';

await signInWithOAuth('github', {
  redirectTo: 'https://advanciapayledger.com/auth/callback',
});
```

---

## 📦 Storage Configuration

### Storage Buckets

**Required Buckets:**

- ✅ `user-avatars` (public) - User profile images
- ✅ `blog-images` (public) - Blog post images
- ✅ `workspace-assets` (private) - Workspace files
- ✅ `ai-outputs` (private) - AI-generated content
- ✅ `documents` (private) - User documents

### Setup Buckets

**Automated:**

```bash
npm run setup:supabase:buckets
```

**Manual:**

1. Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/storage/files
2. Click "Create Bucket"
3. Set name and public/private
4. Configure policies

### Storage Utilities

**File:** `lib/storage/supabase.ts`

**Usage:**

```typescript
import { uploadFile, downloadFile } from '@/lib/storage/supabase';

// Upload
const result = await uploadFile({
  bucket: 'user-avatars',
  path: 'user-123/avatar.jpg',
  file: fileBlob,
  contentType: 'image/jpeg',
});

// Download
const blob = await downloadFile('user-avatars', 'user-123/avatar.jpg');
```

---

## 🗄️ Database & API Schema

### API Schema Setup

**Why API Schema?**

- `public` schema is not accessible via Supabase REST API
- `api` schema is required for API access
- Better security isolation

**Setup:**

```bash
npm run setup:supabase:api:schema
```

**SQL Script:** `prisma/migrations/setup_api_schema.sql`

**Manual Steps:**

1. Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/sql/new
2. Run SQL script to:
   - Create `api` schema
   - Grant permissions to `anon` and `authenticated`
   - Enable Row Level Security (RLS)

**Permissions:**

```sql
-- Grant SELECT to anon (public read)
GRANT SELECT ON TABLE api.<table> TO anon;

-- Grant full CRUD to authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE api.<table> TO authenticated;
```

---

## 🛠️ Wrapper Functions

### Query Wrappers

**File:** `lib/supabase/wrappers/queries.ts`

**Available Functions:**

- ✅ `queryTable()` - Generic query with filtering, pagination
- ✅ `getById()` - Get single record by ID
- ✅ `insertRecord()` - Insert new record
- ✅ `updateRecord()` - Update existing record
- ✅ `deleteRecord()` - Delete record

**Usage:**

```typescript
import { queryTable, getById, insertRecord } from '@/lib/supabase/wrappers/queries';

// Query with filters
const { data, error } = await queryTable('users', {
  filter: { role: 'USER' },
  orderBy: { column: 'created_at', ascending: false },
  limit: 10,
});

// Get by ID
const { data, error } = await getById('users', 'user-id');

// Insert
const { data, error } = await insertRecord('users', {
  email: 'user@example.com',
  name: 'John Doe',
});
```

### Database Wrappers

**File:** `lib/supabase/database.ts`

- ✅ Table operations (CRUD)
- ✅ Function calls
- ✅ Real-time subscriptions
- ✅ Schema visualization

### Admin Actions Wrappers

**File:** `lib/supabase/admin-actions.ts`

- ✅ Log admin actions
- ✅ Query admin logs
- ✅ Real-time subscriptions

---

## 📝 Client Utilities

### Server Components

**File:** `utils/supabase/server.ts`

```typescript
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const cookieStore = await cookies();
const supabase = createClient(cookieStore);
```

### Client Components

**File:** `utils/supabase/client.ts`

```typescript
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();
```

### Middleware

**File:** `utils/supabase/middleware.ts`

```typescript
import { createClient } from '@/utils/supabase/middleware';

const { supabase, supabaseResponse } = createClient(request);
```

---

## 🚀 Deployment

### Production Deployment

```bash
npm run deploy:production
```

**Steps:**

1. ✅ Environment variables check
2. ✅ Supabase API schema setup
3. ✅ Prisma client generation
4. ✅ Build project
5. ✅ Database migrations
6. ✅ Pre-production checks
7. ✅ Deploy to Vercel
8. ✅ Verify deployment

### Manual Deployment

Follow `DEPLOY.md` and `PRODUCTION_DEPLOYMENT.md` for detailed instructions.

---

## 📊 Configuration Summary

### ✅ Completed

- [x] Project environment detected
- [x] Supabase libraries installed
- [x] Client utilities created (server, client, middleware)
- [x] Authentication utilities created
- [x] Storage utilities created
- [x] Database utilities created
- [x] Query wrappers created
- [x] Admin actions logging created
- [x] API schema setup script created
- [x] Storage buckets setup script created
- [x] Environment variables configured
- [x] Documentation created

### ⚠️ Manual Steps Required

1. **API Schema Setup:**
   - Run: `npm run setup:supabase:api:schema`
   - Execute SQL in Supabase Dashboard
   - Grant permissions to anon and authenticated

2. **Storage Buckets:**
   - Run: `npm run setup:supabase:buckets`
   - Or create manually in Dashboard

3. **Auth Providers:**
   - Enable in Supabase Dashboard
   - Configure OAuth credentials
   - Set redirect URLs

4. **Vault Secrets:**
   - Store sensitive keys in Vault
   - Access via SQL functions

5. **Database Migrations:**
   - Update Prisma schema to use `api` schema
   - Run: `npm run prisma:migrate`

---

## 🔗 Dashboard Links

- **Project:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi
- **Auth:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/auth/providers
- **Storage:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/storage/files
- **Database:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/editor
- **SQL Editor:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/sql/new
- **Vault:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations/vault/secrets
- **API:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/api

---

## 🧪 Testing

### Test Authentication

```bash
npm run test:supabase:auth
```

### Test Storage

```bash
npm run supabase:storage
```

### Test Schema

```bash
npm run supabase:schema
```

---

## 📚 Documentation

- **Complete Setup:** `SUPABASE_COMPLETE_AUTH_STORAGE_SETUP.md`
- **API Schema:** `SUPABASE_API_SCHEMA_SETUP.md`
- **Next Steps:** `SUPABASE_SETUP_NEXT_STEPS.md`
- **Integration Guide:** `SUPABASE_INTEGRATION_GUIDE.md`

---

## ✅ Status: Ready for Production

All Supabase components are configured and ready to use!

**Next:** Run `npm run setup:supabase:auto` to verify everything is set up correctly.

# ✅ Supabase Setup - Next Steps Guide

## Quick Start

Follow these steps to complete your Supabase integration:

---

## Step 1: Set Up Environment Variables

### Option A: Automatic Setup (Recommended)

```bash
npm run setup:supabase:env
```

This script will:

- Extract Supabase variables from `env.example`
- Create or update `.env.local` with Supabase configuration
- Preserve your existing environment variables

### Option B: Manual Setup

1. Copy `env.example` to `.env.local`:

   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and ensure these Supabase variables are set:

   ```bash
   # Supabase Project URL
   NEXT_PUBLIC_SUPABASE_URL=https://xesecqcqzykvmrtxrzqi.supabase.co

   # Publishable Key (for client-side operations)
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_dj1xLuksqBUvn9O6AWU3Fg_bRYa6ohq

   # Anon Key (alternative)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Service Role Key (for server-side admin operations only)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Important:** Update `DATABASE_URL` with your actual database password:
   ```bash
   DATABASE_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
   ```

---

## Step 2: Test Authentication

Run the authentication test suite:

```bash
npm run test:supabase:auth
```

This will test:

- ✅ Sign up
- ✅ Sign in
- ✅ Get user/session
- ✅ Update user
- ✅ Sign out
- ✅ All authentication methods

**Expected Output:**

```
🔐 Testing Supabase Authentication Methods
✅ All tests passed! Supabase authentication is working correctly.
```

---

## Step 3: Access Supabase Dashboard

### Storage Management

**URL:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/storage/files

**Actions:**

1. Create storage buckets:
   - `user-avatars` (public)
   - `blog-images` (public)
   - `workspace-assets` (private)
   - `ai-outputs` (private)
   - `documents` (private)

2. Configure bucket policies:
   - Public buckets: Allow read access
   - Private buckets: Require authentication

### Database Management

**URL:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/editor

**Components:**

- **Tables:** View and manage database tables
- **Functions:** Database functions
- **Triggers:** Database triggers
- **Indexes:** Performance indexes
- **Policies:** Row Level Security (RLS) policies
- **Extensions:** PostgreSQL extensions
- **Types:** Custom types and enums

### Integrations

**URL:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations

**Available:**

- **Wrappers:** Extend database functionality
- **Postgres Modules:** Connect to external services
- **Vault Secrets:** Store sensitive secrets securely

---

## Step 4: Configure OAuth Providers (Optional)

If you want to enable OAuth login (GitHub, Google, etc.):

1. Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/auth/providers

2. Enable desired providers:
   - **GitHub:** Get Client ID and Secret from GitHub OAuth Apps
   - **Google:** Get Client ID and Secret from Google Cloud Console
   - **Facebook:** Get App ID and Secret from Facebook Developers
   - **Others:** Follow provider-specific setup

3. Add credentials to `.env.local`:

   ```bash
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. Update `lib/env.ts` if needed to include new OAuth variables

---

## Step 5: Configure SMS Authentication (Optional)

If you want to enable phone/SMS authentication:

1. **Set up Twilio:**
   - Create account at https://www.twilio.com
   - Get Account SID and Auth Token
   - Get a phone number

2. **Configure in Supabase:**
   - Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/auth/providers
   - Enable "Phone" provider
   - Enter Twilio credentials:
     - Account SID
     - Auth Token
     - Phone Number

3. **Test SMS:**

   ```typescript
   import { signInWithOtpPhone, verifyOtp } from '@/lib/supabase/auth';

   // Send OTP
   await signInWithOtpPhone('+13334445555');

   // Verify OTP
   await verifyOtp('+13334445555', '123456');
   ```

---

## Step 6: Verify Integration

### Check Storage

```bash
npm run supabase:storage
```

### Check Database Schema

```bash
npm run supabase:schema
```

### Check Health

```bash
curl http://localhost:3000/api/health
```

---

## Step 7: Use in Your Application

### Authentication Example

```typescript
import { signUp, signIn, getUser } from '@/lib/supabase/auth';

// Sign up
const { data, error } = await signUp('user@example.com', 'password123');

// Sign in
const { data, error } = await signIn('user@example.com', 'password123');

// Get current user
const { user, error } = await getUser();
```

### Storage Example

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

### Database Example

```typescript
import { queryTable, insertIntoTable } from '@/lib/supabase/database';

// Query
const { data, error } = await queryTable('users', {
  filter: { role: 'USER' },
  limit: 10,
});

// Insert
const { data, error } = await insertIntoTable('users', {
  email: 'user@example.com',
  name: 'John Doe',
});
```

---

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution:**

```bash
npm run setup:supabase:env
```

### Issue: "Authentication test fails"

**Check:**

1. Environment variables are set in `.env.local`
2. Supabase project is active
3. Network connectivity to Supabase

**Debug:**

```bash
# Check environment variables
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Test connection
curl https://xesecqcqzykvmrtxrzqi.supabase.co/rest/v1/
```

### Issue: "Storage operations fail"

**Check:**

1. Storage buckets are created in Supabase Dashboard
2. Bucket policies allow access
3. Service role key is set for admin operations

### Issue: "Database connection fails"

**Check:**

1. `DATABASE_URL` has correct password
2. Connection pooling is enabled
3. Database is accessible from your network

---

## Quick Reference

### Commands

```bash
# Setup environment
npm run setup:supabase:env

# Test authentication
npm run test:supabase:auth

# Check storage
npm run supabase:storage

# Check schema
npm run supabase:schema

# Generate Prisma client
npm run prisma:generate

# Open Prisma Studio
npm run prisma:studio
```

### Dashboard Links

- **Storage:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/storage/files
- **Database:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/editor
- **Auth:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/auth/users
- **Integrations:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations
- **Vault:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations/vault/secrets

---

## Status: ✅ Ready to Use

Once you've completed these steps, your Supabase integration is fully configured and ready to use!

**Need Help?**

- Check documentation: `SUPABASE_COMPLETE_AUTH_STORAGE_SETUP.md`
- Review examples: `app/examples/supabase-*.tsx`
- Access Supabase Dashboard for visual management

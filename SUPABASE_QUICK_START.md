# 🚀 Supabase Quick Start Guide

## ✅ Setup Complete

Your Supabase integration is ready! Here's what's been set up:

---

## 📋 New Supabase Project

**Project:** `qbxugwctchtqwymhucpl`  
**URL:** `https://qbxugwctchtqwymhucpl.supabase.co`

---

## 🔐 Environment Variables

### Add to `.env.local`

```bash
# ⚠️ SECURITY: Get these values from Supabase Dashboard
# Never commit actual keys to git!
# Go to: https://app.supabase.com/project/qbxugwctchtqwymhucpl/settings/api

NEXT_PUBLIC_SUPABASE_URL=https://qbxugwctchtqwymhucpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase_dashboard
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_from_supabase_dashboard
DATABASE_URL=postgres://postgres.qbxugwctchtqwymhucpl:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DIRECT_URL=postgres://postgres.qbxugwctchtqwymhucpl:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### Add to Vercel (Production)

Same variables as above, but for Production environment.

---

## 📊 Create Notes Table

### Option 1: Run Setup Script (Recommended)

```bash
npm run setup:notes-table
```

### Option 2: Manual SQL in Supabase Dashboard

1. Go to: https://app.supabase.com/project/qbxugwctchtqwymhucpl
2. Navigate to: **Database** → **SQL Editor**
3. Run the SQL from: `prisma/migrations/create_notes_table.sql`

**SQL:**

```sql
-- Create the table
CREATE TABLE notes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL
);

-- Insert some sample data
INSERT INTO notes (title)
VALUES
  ('Today I created a Supabase project.'),
  ('I added some data and queried it from Next.js.'),
  ('It was awesome!');

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Make the data publicly readable
CREATE POLICY "public can read notes"
ON public.notes
FOR SELECT
TO anon
USING (true);
```

---

## 🚀 Test the Notes Page

### Start Development Server

```bash
npm run dev
```

### Visit Notes Page

Open: http://localhost:3000/notes

**Expected Result:**

- See 3 sample notes displayed
- JSON output at bottom showing all notes

---

## 📁 Files Created

### 1. `app/notes/page.tsx`

- Next.js Server Component
- Fetches notes from Supabase
- Displays notes with nice UI
- Shows JSON output for debugging

**Code:**

```typescript
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function Notes() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { data: notes } = await supabase.from('notes').select();

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
```

### 2. `prisma/migrations/create_notes_table.sql`

- SQL migration file
- Creates notes table
- Inserts sample data
- Sets up RLS policies

### 3. `scripts/setup-notes-table.ts`

- Automated setup script
- Executes SQL migration
- Handles errors gracefully

---

## 🔍 Verify Setup

### Check Environment Variables

```bash
# Check if variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
```

### Test Supabase Connection

```bash
# Using curl
curl -H "apikey: <YOUR_ANON_KEY>" \
     -H "Authorization: Bearer <YOUR_ANON_KEY>" \
     https://qbxugwctchtqwymhucpl.supabase.co/rest/v1/notes
```

### Test Notes Page

```bash
# Start dev server
npm run dev

# Visit
http://localhost:3000/notes
```

---

## 📝 Using Supabase Client

### Server Components (Recommended)

```typescript
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function MyPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { data } = await supabase.from('notes').select();
  return <div>{/* render data */}</div>;
}
```

### Client Components

```typescript
'use client';
import { createClient } from '@/utils/supabase/client';

export default function MyComponent() {
  const supabase = createClient();
  // Use supabase client...
}
```

---

## ✅ Checklist

- [ ] Environment variables set in `.env.local`
- [ ] Environment variables set in Vercel (Production)
- [ ] Notes table created in Supabase
- [ ] RLS policy "public can read notes" created
- [ ] Sample data inserted
- [ ] Notes page accessible at `/notes`
- [ ] Notes display correctly

---

## 🚀 Next Steps

1. **Update Environment Variables:**
   - Add to `.env.local` for local development
   - Add to Vercel for production

2. **Create Notes Table:**

   ```bash
   npm run setup:notes-table
   ```

3. **Test Locally:**

   ```bash
   npm run dev
   # Visit http://localhost:3000/notes
   ```

4. **Deploy:**
   ```bash
   git add .
   git commit -m "feat: Add Supabase notes integration"
   git push origin main
   ```

---

**Status:** ✅ **Ready to Use**

**Quick Test:** Run `npm run setup:notes-table` then visit `/notes` page.

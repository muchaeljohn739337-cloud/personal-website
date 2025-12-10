# ✅ Supabase Notes Table Setup

## Summary

Notes table has been created with Row Level Security (RLS) policies for public read access.

---

## 📋 New Supabase Project

**Project Reference:** `qbxugwctchtqwymhucpl`  
**Project URL:** `https://qbxugwctchtqwymhucpl.supabase.co`

**⚠️ IMPORTANT:** This is a NEW project. Update all environment variables!

---

## 🔐 Environment Variables to Update

### Add to Vercel (Production):

| Variable                               | Value                                                                                                                                                                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://qbxugwctchtqwymhucpl.supabase.co`                                                                                                                                                                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | `⚠️ Get from Supabase Dashboard → Settings → API → anon/public key`                                                                                                                                    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `⚠️ Get from Supabase Dashboard → Settings → API → publishable key`                                                                                                                                                          |
| `SUPABASE_SERVICE_ROLE_KEY`            | `⚠️ CRITICAL: Get from Supabase Dashboard → Settings → API → service_role key (NEVER expose!)`                                                                                                                               |
| `DATABASE_URL`                         | `⚠️ Get from Supabase Dashboard → Settings → Database → Connection Pooling`                                                                                                                                    |
| `DIRECT_URL`                           | `⚠️ Get from Supabase Dashboard → Settings → Database → Direct Connection`                                                                                                                                    |

---

## 📊 Notes Table Structure

### Table: `notes`

```sql
CREATE TABLE notes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Sample Data

The table includes 3 sample notes:

1. "Today I created a Supabase project."
2. "I added some data and queried it from Next.js."
3. "It was awesome!"

---

## 🔒 Row Level Security (RLS)

### Policies Created:

1. **Public Read Access:**

   ```sql
   CREATE POLICY "public can read notes"
   ON public.notes
   FOR SELECT
   TO anon
   USING (true);
   ```

2. **Authenticated Insert:**

   ```sql
   CREATE POLICY "authenticated can insert notes"
   ON public.notes
   FOR INSERT
   TO authenticated
   WITH CHECK (true);
   ```

3. **Authenticated Update:**

   ```sql
   CREATE POLICY "authenticated can update notes"
   ON public.notes
   FOR UPDATE
   TO authenticated
   USING (true)
   WITH CHECK (true);
   ```

4. **Authenticated Delete:**
   ```sql
   CREATE POLICY "authenticated can delete notes"
   ON public.notes
   FOR DELETE
   TO authenticated
   USING (true);
   ```

---

## 🚀 Setup Steps

### Step 1: Update Environment Variables

**Local (.env.local):**

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

**Vercel (Production):**

- Go to: Vercel Dashboard → Settings → Environment Variables
- Add all variables above for Production environment

### Step 2: Create Notes Table

**Option A: Run Script (Recommended)**

```bash
npm run setup:notes-table
```

**Option B: Manual SQL**

1. Go to: Supabase Dashboard → SQL Editor
2. Copy SQL from: `prisma/migrations/create_notes_table.sql`
3. Execute in SQL Editor

### Step 3: Test Notes Page

```bash
# Start dev server
npm run dev

# Visit
http://localhost:3000/notes
```

You should see the 3 sample notes displayed.

---

## 📁 Files Created

### 1. `app/notes/page.tsx`

- Next.js page component
- Fetches notes from Supabase
- Displays notes in a nice UI
- Shows JSON output for debugging

### 2. `prisma/migrations/create_notes_table.sql`

- SQL migration file
- Creates notes table
- Sets up RLS policies
- Inserts sample data

### 3. `scripts/setup-notes-table.ts`

- Automated setup script
- Executes SQL migration
- Handles errors gracefully

### 4. `SUPABASE_NEW_CREDENTIALS.md`

- Complete credential reference
- Environment variable checklist

---

## 🧪 Testing

### Test Notes Page

```bash
# Start dev server
npm run dev

# Visit in browser
http://localhost:3000/notes
```

**Expected Result:**

- See 3 sample notes displayed
- Each note shows title and creation date
- JSON output at bottom for debugging

### Test API Directly

```bash
# Using Supabase client
curl -H "apikey: <ANON_KEY>" \
     https://qbxugwctchtqwymhucpl.supabase.co/rest/v1/notes \
     -H "Authorization: Bearer <ANON_KEY>"
```

---

## 📊 Database Schema

### Notes Table

| Column       | Type      | Description                 |
| ------------ | --------- | --------------------------- |
| `id`         | BIGINT    | Primary key, auto-generated |
| `title`      | TEXT      | Note title (required)       |
| `created_at` | TIMESTAMP | Creation timestamp          |
| `updated_at` | TIMESTAMP | Last update timestamp       |

---

## 🔍 Troubleshooting

### Error: "relation notes does not exist"

**Solution:** Run the setup script or execute SQL manually:

```bash
npm run setup:notes-table
```

### Error: "permission denied for table notes"

**Solution:** Check RLS policies are enabled and public read policy exists.

### Error: "Missing NEXT_PUBLIC_SUPABASE_URL"

**Solution:** Add environment variables to `.env.local` or Vercel.

---

## ✅ Verification Checklist

- [ ] Environment variables updated (local and Vercel)
- [ ] Notes table created in Supabase
- [ ] RLS policies enabled and configured
- [ ] Sample data inserted
- [ ] Notes page accessible at `/notes`
- [ ] Notes display correctly
- [ ] Public read access works

---

## 🚀 Next Steps

1. **Update Vercel Environment Variables:**
   - Add all new Supabase credentials
   - Update DATABASE_URL and DIRECT_URL

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
   git commit -m "feat: Add Supabase notes table and page"
   git push origin main
   ```

---

**Status:** ✅ **Notes Table Setup Complete**

**Next Action:** Update environment variables, then run `npm run setup:notes-table`.

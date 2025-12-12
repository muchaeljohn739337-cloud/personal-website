# 🔧 Database Setup Instructions

**Date:** 2025-12-10  
**Database:** `qbxugwctchtqwymhucpl`

---

## ⚠️ Action Required

Your `.env.local` file currently contains `[YOUR-PASSWORD]` placeholder. You need to replace it with your actual Supabase database password.

---

## 📋 Step-by-Step Instructions

### 1. Get Your Supabase Database Password

1. Go to: **https://app.supabase.com**
2. Select your project: **qbxugwctchtqwymhucpl**
3. Navigate to: **Settings** → **Database**
4. Under **Connection string**, you'll see your connection string
5. Copy the **password** from the connection string

**Example connection string format:**

```
postgresql://postgres.qbxugwctchtqwymhucpl:YOUR_ACTUAL_PASSWORD_HERE@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

### 2. Update `.env.local`

Open `.env.local` and replace `[YOUR-PASSWORD]` with your actual password in both:

**DATABASE_URL:**

```bash
DATABASE_URL=postgresql://postgres.qbxugwctchtqwymhucpl:YOUR_ACTUAL_PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**DIRECT_URL:**

```bash
DIRECT_URL=postgresql://postgres.qbxugwctchtqwymhucpl:YOUR_ACTUAL_PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

### 3. Test Connection

After updating the password, test the connection:

```bash
npm run test:db
```

Expected output:

```
✅ Connection successful!
✅ Connected to database: postgres
✅ Found X table(s) in database
```

### 4. Run Migrations

Once the connection works, deploy migrations:

```bash
npx prisma migrate deploy
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

---

## 🔍 Current Configuration

**Database Project ID:** `qbxugwctchtqwymhucpl`  
**Host:** `aws-1-us-east-1.pooler.supabase.com`  
**Region:** US East 1

**Connection Pooling (DATABASE_URL):**

- Port: `6543`
- Query param: `?pgbouncer=true`
- Use for: Application queries

**Direct Connection (DIRECT_URL):**

- Port: `5432`
- Use for: Prisma migrations

---

## ✅ Verification Checklist

- [ ] `.env.local` has actual password (not `[YOUR-PASSWORD]`)
- [ ] `DATABASE_URL` uses port `6543` with `?pgbouncer=true`
- [ ] `DIRECT_URL` uses port `5432`
- [ ] Both URLs use database ID `qbxugwctchtqwymhucpl`
- [ ] Connection test passes: `npm run test:db`
- [ ] Migrations can run: `npx prisma migrate deploy`

---

## 🚨 Troubleshooting

### Authentication Failed

**Error:** `P1000: Authentication failed`

**Solution:**

1. Verify password is correct (no extra spaces)
2. Check if password contains special characters (may need URL encoding)
3. Ensure you're using the password from Supabase dashboard, not an API key

### Connection Timeout

**Error:** `Can't reach database server`

**Solution:**

1. Check internet connection
2. Verify Supabase project is active
3. Check if IP is whitelisted in Supabase (if IP restrictions enabled)

### Wrong Database

**Error:** Tables not found or wrong database

**Solution:**

1. Verify database ID in connection string matches: `qbxugwctchtqwymhucpl`
2. Check you're connecting to the correct Supabase project

---

**Once password is updated, run the test and migration commands again!**

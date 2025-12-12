# 🔌 Database Connection Fix

## Current Issue

The database connection is failing because:

1. The connection string format may be incorrect
2. The hostname might be wrong
3. Missing SSL parameters

## ✅ Fixed Configuration

I've updated your `.env.local` to use:

- **DATABASE_URL**: Port 6543 (connection pooling) with `?pgbouncer=true`
- **DIRECT_URL**: Port 5432 (direct connection for migrations)

## 📋 Next Steps

### 1. Update Your Supabase Connection String

Your `.env.local` currently shows `localhost` - you need to replace it with your actual Supabase connection string.

**Get your Supabase connection string:**

1. Go to: https://app.supabase.com
2. Select your project: `xesecqcqzykvmrtxrzqi`
3. Go to **Settings** → **Database**
4. Under **Connection string**, copy:
   - **Connection pooling** (port 6543) → Use for `DATABASE_URL`
   - **Direct connection** (port 5432) → Use for `DIRECT_URL`

### 2. Update `.env.local`

Replace the connection strings with your actual Supabase credentials:

```bash
# Connection Pooling (for application)
DATABASE_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct Connection (for migrations)
DIRECT_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

**Important:** Replace `[YOUR-PASSWORD]` with your actual Supabase database password.

### 3. Test Connection

After updating, test the connection:

```bash
npm run worker:check-db
```

### 4. If Still Failing

**Add SSL parameter:**

```bash
DATABASE_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
DIRECT_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

## 🔍 Verify Connection String Format

**Correct format for Supabase:**

- Host: `aws-1-us-east-1.pooler.supabase.com` (for pooling)
- Port: `6543` (pooling) or `5432` (direct)
- Database: `postgres`
- Username: `postgres.xesecqcqzykvmrtxrzqi`
- Password: Your Supabase database password

## ✅ Status

- ✅ Connection string format fixed (port 6543 for pooling)
- ✅ DIRECT_URL added for migrations
- ⚠️ **Action Required**: Update with your actual Supabase password

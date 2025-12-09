# 🔌 Database Connection Fix Guide

## Current Issue

**Error:** `Can't reach database server at dpg-d4f112trnu6s73doipjg-a:5432`

This indicates the database connection string is incorrect or the database is not accessible.

---

## Step 1: Verify DATABASE_URL in Vercel

### Access Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select your project: `personal-website` or `advanciapayledger`
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` and `DIRECT_URL`

### Supabase Connection Configuration:

**Connection Pooling (DATABASE_URL) - For Application Use:**

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Direct Connection (DIRECT_URL) - For Migrations:**

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

### Check DATABASE_URL Format:

**Connection Pooling Format:**

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Direct Connection Format:**

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

### Common Issues:

1. **Missing SSL Parameter:**
   - Add `?sslmode=require` to the end
   - Or `?sslmode=prefer` if strict mode fails

2. **Incorrect Host:**
   - Host should be the full hostname, not just the ID
   - Example: `dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com`

3. **Wrong Port:**
   - Default PostgreSQL port is `5432`
   - Verify with your database provider

4. **Incorrect Credentials:**
   - Verify username and password
   - Check for special characters (may need URL encoding)

---

## Step 2: Test Database Connection

### Method 1: Using Prisma

```bash
# Test connection
npx prisma db pull

# Or generate client (will test connection)
npx prisma generate
```

### Method 2: Using psql

```bash
# Test connection directly
psql $DATABASE_URL

# Or with explicit connection
psql -h hostname -p 5432 -U username -d database
```

### Method 3: Using Node.js Script

Create `test-db-connection.js`:

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful!', result);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

Run:

```bash
node test-db-connection.js
```

---

## Step 3: Fix Common Database Provider Issues

### Render.com (PostgreSQL)

**Issue:** Connection string format

**Solution:**

1. Go to Render Dashboard → Your Database
2. Copy **Internal Database URL** (for Vercel)
3. Or use **External Connection String**
4. Add `?sslmode=require` if not present

**Format:**

```
postgresql://user:pass@dpg-xxxxx-a.oregon-postgres.render.com:5432/dbname?sslmode=require
```

### Supabase

**Issue:** Connection pooling

**Solution:**

1. Use **Connection Pooling** URL (port 6543)
2. Or use **Direct Connection** URL (port 5432)
3. Add `?sslmode=require`

**Format:**

```
postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

### Neon

**Issue:** Serverless connection

**Solution:**

1. Use **Connection String** from dashboard
2. Ensure `?sslmode=require` is present
3. May need connection pooling for serverless

**Format:**

```
postgresql://user:pass@ep-xxxxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

### Railway

**Issue:** Dynamic hostname

**Solution:**

1. Use **DATABASE_URL** from Railway dashboard
2. Format is usually correct
3. Verify SSL mode

**Format:**

```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway?sslmode=require
```

---

## Step 4: Update Environment Variables

### In Vercel:

1. Go to **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. Click **Edit**
4. Update with correct connection string
5. Ensure it's set for **Production** environment
6. Click **Save**

### Verify:

1. Go to **Deployments**
2. Click on latest deployment
3. Check **Build Logs** for database connection errors
4. Check **Function Logs** for runtime errors

---

## Step 5: Test After Update

### Test Connection:

```bash
# Set DATABASE_URL locally (for testing)
export DATABASE_URL="your_connection_string"

# Test with Prisma
npx prisma db pull

# Or test with script
node test-db-connection.js
```

### Test Admin Creation:

```bash
# Once connection works
npm run create-admin
```

---

## Step 6: Firewall & Network Issues

### If Connection Still Fails:

1. **Check Firewall Rules:**
   - Allow connections from Vercel IPs
   - Or allow all IPs (0.0.0.0/0) for testing

2. **Check Database Status:**
   - Verify database is running
   - Check database provider dashboard
   - Look for any alerts or issues

3. **Check Connection Limits:**
   - Some providers limit connections
   - Use connection pooling if available
   - Check current connection count

4. **Network Connectivity:**
   - Test from different network
   - Check if VPN is blocking
   - Verify DNS resolution

---

## Quick Fix Checklist

- [ ] Verify `DATABASE_URL` format is correct
- [ ] Add `?sslmode=require` if missing
- [ ] Check hostname is full domain (not just ID)
- [ ] Verify port is correct (usually 5432)
- [ ] Check username and password are correct
- [ ] Update in Vercel environment variables
- [ ] Test connection locally
- [ ] Test connection from Vercel deployment
- [ ] Check database firewall rules
- [ ] Verify database is running

---

## Support

If issues persist:

1. Check database provider status page
2. Review Vercel function logs
3. Test connection from different location
4. Contact database provider support
5. Check Prisma connection documentation

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")

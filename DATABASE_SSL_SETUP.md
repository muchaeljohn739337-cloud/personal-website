# 🔒 Database SSL Certificate Setup

## SSL Certificate for Supabase PostgreSQL

If you have a certificate file (`prod-ca-2021.crt`), you may need to configure SSL for your database connections.

---

## Option 1: SSL Mode in Connection String (Recommended)

Add `sslmode=require` to your connection strings:

### DATABASE_URL (Connection Pooling)

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

### DIRECT_URL (Direct Connection)

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

---

## Option 2: Using Certificate File

If you need to use the certificate file directly:

### For Vercel Environment Variables

1. **Convert certificate to base64:**

   ```bash
   # On Windows PowerShell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("prod-ca-2021.crt"))

   # On Linux/Mac
   base64 -i prod-ca-2021.crt
   ```

2. **Add as environment variable:**
   - Variable name: `PGSSLROOTCERT` or `DATABASE_SSL_CERT`
   - Value: Base64 encoded certificate content
   - Environment: Production

3. **Update connection string:**

   ```
   postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=verify-ca
   ```

---

## Option 3: Supabase Default SSL (Easiest)

Supabase connections typically work with `sslmode=require` without needing a certificate file. Try this first:

### Updated Connection Strings

**DATABASE_URL:**

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**DIRECT_URL:**

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

---

## SSL Mode Options

| Mode          | Description                               | Use Case                          |
| ------------- | ----------------------------------------- | --------------------------------- |
| `disable`     | No SSL                                    | Development only                  |
| `require`     | SSL required, no certificate verification | **Recommended for Supabase**      |
| `verify-ca`   | SSL with CA certificate verification      | When you have a certificate file  |
| `verify-full` | SSL with full certificate verification    | Most secure, requires certificate |

---

## ✅ Recommended Configuration

For Vercel + Supabase, use **`sslmode=require`** in your connection strings:

### DATABASE_URL

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

### DIRECT_URL

```
postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**Note:** Replace `[PASSWORD]` with your actual Supabase database password.

---

## 🔍 Testing SSL Connection

After setting up, test the connection:

```bash
# Test connection with SSL
psql "postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

---

## 📝 Update Vercel Environment Variables

1. Go to: https://vercel.com/dashboard → Settings → Environment Variables
2. Update `DATABASE_URL` with `&sslmode=require` added
3. Update `DIRECT_URL` with `?sslmode=require` added
4. Redeploy after updating

---

## ⚠️ Important Notes

- **Supabase typically works with `sslmode=require`** without needing a certificate file
- If you have `prod-ca-2021.crt`, you can use it for `verify-ca` mode, but it's usually not necessary
- The certificate file is mainly needed for self-hosted PostgreSQL or custom SSL configurations
- For Supabase, `sslmode=require` is sufficient and recommended

---

**Status**: Use `sslmode=require` in connection strings for Supabase. Certificate file usually not needed. 🔒

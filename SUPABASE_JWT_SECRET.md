# 🔐 Supabase JWT Secret

## JWT Secret from Supabase

**Supabase JWT Secret:**
```
TP3SichwNoqTyKGfKIyee8u44WwyJQ/BXQGB6jmYFUHXyUhP1LaWZssSw9TTnV/viM6ntBEcNH0m7beYmUiXSw==
```

---

## ⚠️ Important: This is NOT the Same as JWT_SECRET

**Note:** This Supabase JWT secret is different from the `JWT_SECRET` environment variable needed for your Next.js application.

### Two Different JWT Secrets:

1. **Supabase JWT Secret** (from Supabase dashboard):
   - Used by Supabase internally
   - Already configured in Supabase
   - Not needed as an environment variable

2. **Application JWT_SECRET** (for Next.js):
   - Used by your Next.js application for JWT token signing
   - Must be set in Vercel environment variables
   - Generate with: `npm run generate:prod-secrets`

---

## 📋 Application JWT_SECRET (Still Needed)

You still need to set `JWT_SECRET` in Vercel for your Next.js application:

**Generated Value:**
```
JWT_SECRET=b9a736a15f83edb98b7bc9fd3742a2494a2d5c521272eab7bc2dd1c4f2bdcff22297322d2392b689929952d790445aa4e6075dd7c668b2d23637252c0276a87f
```

---

## 🔒 Row Level Security (RLS) Status

**Current Status:** All tables have RLS **DISABLED**

### Tables with RLS Disabled:

- `users`
- `agent_checkpoints`
- `ai_jobs`
- `organizations`
- `transactions`
- `wallets`
- And 70+ other tables...

---

## ⚠️ Security Recommendation

**For Production:** Consider enabling RLS on sensitive tables:

1. **Critical Tables (Should Enable RLS):**
   - `users` - User data protection
   - `organizations` - Organization data
   - `transactions` - Financial data
   - `wallets` - Wallet data
   - `api_keys` - API key security
   - `admin_actions` - Admin audit trail
   - `audit_logs` - Security logs
   - `password_entries` - Password manager data

2. **How to Enable RLS:**
   - Go to Supabase Dashboard → Table Editor
   - Select a table
   - Click "Enable RLS"
   - Create policies for access control

3. **Basic Policy Example:**
   ```sql
   -- Allow users to read their own data
   CREATE POLICY "Users can view own data"
   ON users FOR SELECT
   USING (auth.uid() = id);
   ```

---

## 📝 Summary

- ✅ Supabase JWT secret is configured (internal use)
- ❌ Application `JWT_SECRET` still needs to be set in Vercel
- ⚠️ RLS is disabled on all tables (consider enabling for production)

---

**Status**: Supabase JWT secret noted. Application JWT_SECRET still needs to be set separately. 🔐


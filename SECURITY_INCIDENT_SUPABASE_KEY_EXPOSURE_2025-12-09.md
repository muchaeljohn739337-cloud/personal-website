# 🚨 Security Incident: Supabase API Keys Exposure

**Date:** 2025-12-09  
**Severity:** 🔴 **CRITICAL**  
**Status:** ⚠️ **ACTION REQUIRED**

---

## Summary

Supabase API keys and database credentials were exposed in documentation files committed to git:

1. **Anon Key** - Exposed in 3 markdown files
2. **Service Role Key** - Exposed in 2 markdown files (CRITICAL)
3. **Database Password** - Exposed in 3 markdown files
4. **Publishable Key** - Exposed in 3 markdown files

**Exposed Files:**

- `SUPABASE_QUICK_START.md`
- `SUPABASE_NEW_CREDENTIALS.md`
- `SUPABASE_NOTES_SETUP.md`

---

## Impact

### Risk Level: 🔴 **CRITICAL**

**Anon Key Exposure:**

- Can be used to access public data
- Limited by Row Level Security (RLS) policies
- **Lower risk** if RLS is properly configured

**Service Role Key Exposure:**

- **FULL DATABASE ACCESS** - bypasses all RLS policies
- Can read, write, and delete any data
- Can modify database schema
- Can execute admin operations
- **CRITICAL RISK** - must rotate immediately

**Database Password Exposure:**

- Direct database access
- Can bypass application layer
- **HIGH RISK** - should change password

---

## Immediate Actions Taken

### ✅ 1. Removed Exposed Keys from Documentation

- [x] Replaced all keys in `SUPABASE_QUICK_START.md` with placeholders
- [x] Replaced all keys in `SUPABASE_NEW_CREDENTIALS.md` with placeholders
- [x] Replaced all keys in `SUPABASE_NOTES_SETUP.md` with placeholders
- [x] Added security warnings to all key locations

### ✅ 2. Security Warnings Added

All key locations now include:

- ⚠️ Warning about keeping keys secret
- Instructions to get keys from Supabase Dashboard
- Clear indication that keys should never be committed

---

## Required Actions

### 🔴 **IMMEDIATE: Rotate Supabase Keys**

**Step 1: Rotate Service Role Key (CRITICAL)**

1. Go to: https://app.supabase.com/project/qbxugwctchtqwymhucpl/settings/api
2. Find **service_role** key section
3. Click **"Reset"** or **"Rotate"** button
4. Copy the new key immediately
5. Update in:
   - `.env.local` (local development)
   - Vercel environment variables (production)
   - Any other deployment platforms

**Step 2: Rotate Anon Key (Recommended)**

1. Go to: https://app.supabase.com/project/qbxugwctchtqwymhucpl/settings/api
2. Find **anon/public** key section
3. Click **"Reset"** or **"Rotate"** button
4. Copy the new key immediately
5. Update in:
   - `.env.local` (local development)
   - Vercel environment variables (production)

**Step 3: Change Database Password (Recommended)**

1. Go to: https://app.supabase.com/project/qbxugwctchtqwymhucpl/settings/database
2. Find **Database Password** section
3. Click **"Reset Database Password"**
4. Copy the new password immediately
5. Update `DATABASE_URL` and `DIRECT_URL` in:
   - `.env.local` (local development)
   - Vercel environment variables (production)

**Step 4: Rotate Publishable Key (Optional)**

1. Go to: https://app.supabase.com/project/qbxugwctchtqwymhucpl/settings/api
2. Find **publishable** key section
3. Click **"Reset"** or **"Rotate"** button
4. Copy the new key immediately
5. Update in environment variables

---

## Update Environment Variables

### Local Development (`.env.local`)

```bash
# ⚠️ Get NEW keys from Supabase Dashboard after rotation
NEXT_PUBLIC_SUPABASE_URL=https://qbxugwctchtqwymhucpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NEW_ANON_KEY_FROM_DASHBOARD>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<NEW_PUBLISHABLE_KEY_FROM_DASHBOARD>
SUPABASE_SERVICE_ROLE_KEY=<NEW_SERVICE_ROLE_KEY_FROM_DASHBOARD>
DATABASE_URL=postgres://postgres.qbxugwctchtqwymhucpl:<NEW_PASSWORD>@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DIRECT_URL=postgres://postgres.qbxugwctchtqwymhucpl:<NEW_PASSWORD>@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### Vercel (Production)

1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update all Supabase-related variables with new keys
3. Redeploy application after updating

---

## Git History Cleanup

**⚠️ IMPORTANT:** Even after removing keys from files, they remain in git history.

### Option 1: Accept Risk (If repository is private)

- Keys are already exposed in history
- Rotating keys invalidates old keys
- Monitor for unauthorized access

### Option 2: Clean Git History (Advanced)

If repository is public or shared:

```bash
# Use git-filter-repo or BFG Repo-Cleaner
# This rewrites git history - coordinate with team first!
```

**Warning:** Rewriting git history can break forks and clones. Only do this if absolutely necessary.

---

## Monitoring

After rotating keys, monitor for:

1. **Unauthorized Access:**
   - Check Supabase Dashboard → Logs
   - Look for unusual API calls
   - Monitor database access patterns

2. **Application Errors:**
   - Ensure all services are updated with new keys
   - Check deployment logs
   - Verify all integrations work

3. **Security Alerts:**
   - Set up Supabase security alerts
   - Monitor for suspicious activity
   - Review access logs regularly

---

## Prevention

### ✅ Best Practices Implemented

- [x] Removed all keys from documentation
- [x] Added security warnings to all key locations
- [x] Created this incident response document

### 📋 Future Prevention

1. **Never commit keys to git:**
   - Use `.env.local` (already in `.gitignore`)
   - Use environment variables in deployment platforms
   - Use secret management services

2. **Use placeholders in documentation:**
   - Always use `your_key_here` or `[YOUR-KEY]`
   - Include instructions to get keys from dashboard
   - Add security warnings

3. **Regular key rotation:**
   - Rotate keys periodically (every 90 days recommended)
   - Rotate immediately after exposure
   - Document rotation process

4. **Code review:**
   - Review all commits before pushing
   - Use pre-commit hooks to detect secrets
   - Use tools like `git-secrets` or `truffleHog`

---

## Checklist

- [ ] Rotate Service Role Key in Supabase Dashboard
- [ ] Rotate Anon Key in Supabase Dashboard
- [ ] Change Database Password in Supabase Dashboard
- [ ] Update `.env.local` with new keys
- [ ] Update Vercel environment variables with new keys
- [ ] Test application with new keys
- [ ] Monitor Supabase logs for unauthorized access
- [ ] Verify all integrations work with new keys
- [ ] Document rotation process for future reference

---

## Status

**Current Status:** ⚠️ **ACTION REQUIRED**

**Next Steps:**

1. Rotate all exposed keys in Supabase Dashboard
2. Update environment variables
3. Test application
4. Monitor for unauthorized access

**Completion Target:** Within 24 hours

---

**Last Updated:** 2025-12-09  
**Incident Owner:** Development Team

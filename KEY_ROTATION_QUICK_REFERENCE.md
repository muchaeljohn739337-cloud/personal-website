# 🔄 Key Rotation Quick Reference

**Project:** `qbxugwctchtqwymhucpl`  
**Priority:** 🔴 **CRITICAL - Do Now**

---

## 🚀 Quick Steps (5 Minutes)

### 1️⃣ Rotate Service Role Key
**Link:** https://app.supabase.com/project/qbxugwctchtqwymhucpl/settings/api
- Find **"service_role"** → Click **"Reset"**
- **Copy new key immediately!**

### 2️⃣ Rotate Anon Key
**Same page as above**
- Find **"anon/public"** → Click **"Reset"**
- **Copy new key immediately!**

### 3️⃣ Change Database Password
**Link:** https://app.supabase.com/project/qbxugwctchtqwymhucpl/settings/database
- Click **"Reset Database Password"**
- **Copy new password immediately!**

### 4️⃣ Update `.env.local`
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NEW_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<NEW_SERVICE_ROLE_KEY>
DATABASE_URL=postgres://postgres.qbxugwctchtqwymhucpl:[NEW_PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DIRECT_URL=postgres://postgres.qbxugwctchtqwymhucpl:[NEW_PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### 5️⃣ Update Vercel
**Link:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables
- Update all Supabase variables with new keys
- Redeploy

---

## 🔗 Direct Links

- **Supabase API:** https://app.supabase.com/project/qbxugwctchtqwymhucpl/settings/api
- **Supabase Database:** https://app.supabase.com/project/qbxugwctchtqwymhucpl/settings/database
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## ⚠️ Important Notes

- **Copy keys immediately** - you can't see them again!
- **Old keys stop working** as soon as you rotate
- **Update both local and Vercel** environment variables
- **Test after updating** to ensure everything works

---

**For detailed instructions, see:** `HOW_TO_ROTATE_SUPABASE_KEYS.md`


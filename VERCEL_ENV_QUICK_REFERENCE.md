# 🔐 Vercel Environment Variables - Quick Reference

## 🚀 Quick Setup Steps

1. **Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. **Add each variable below** for **Production** environment
3. **Redeploy** after adding all variables

---

## 📋 Generated Secrets (Copy These Values)

These were generated with `npm run generate:prod-secrets`:

```
JWT_SECRET=a7ed1bc7a946c2bd00e0b9f08f228f719b64996dee20b4e1118e613e73e15363c6dc9d22913c60213a2a3f514988c7873035f1ff0459ef79634799b2c2cbc91c
SESSION_SECRET=8bfcab32fd65100e6fae942945b994ba08299b1aa12f92146ddcfc789d49d3454405df3e190330d0ad6caddf45375b12f3ef0acff67b64d83896e75b47d2520b
NEXTAUTH_SECRET=QIBhNTm4lb3OLBJHNx7fRkCeCvTsjpfrQNvduoO5aWI=
CRON_SECRET=iAIOBJkFBvRmgpOwb/tZuG/AwGw9DczmqXJq7orx2YM=
```

---

## 📋 Required Variables

### 1. Core Secrets

| Variable          | Value                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`      | `a7ed1bc7a946c2bd00e0b9f08f228f719b64996dee20b4e1118e613e73e15363c6dc9d22913c60213a2a3f514988c7873035f1ff0459ef79634799b2c2cbc91c` |
| `SESSION_SECRET`  | `8bfcab32fd65100e6fae942945b994ba08299b1aa12f92146ddcfc789d49d3454405df3e190330d0ad6caddf45375b12f3ef0acff67b64d83896e75b47d2520b` |
| `NEXTAUTH_SECRET` | `QIBhNTm4lb3OLBJHNx7fRkCeCvTsjpfrQNvduoO5aWI=`                                                                                     |

### 2. Database Connection

| Variable       | Value (Replace [PASSWORD] with your actual password)                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | `postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require` |
| `DIRECT_URL`   | `postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`                |

**Get your password from:** Supabase Dashboard → Settings → Database → Connection string

### 3. Application URLs

| Variable              | Value                           |
| --------------------- | ------------------------------- |
| `NEXT_PUBLIC_APP_URL` | `https://advanciapayledger.com` |
| `NEXTAUTH_URL`        | `https://advanciapayledger.com` |

### 4. Supabase Configuration

| Variable                                       | Value                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | `https://xesecqcqzykvmrtxrzqi.supabase.co`                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `sb_publishable_dj1xLuksqBUvn9O6AWU3Fg_bRYa6ohq` ✅ **Already Set** |

---

## ⚠️ Recommended Variables

| Variable                    | Value                                          | How to Get                                             |
| --------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `CRON_SECRET`               | `iAIOBJkFBvRmgpOwb/tZuG/AwGw9DczmqXJq7orx2YM=` | Already generated above                                |
| `SUPABASE_SERVICE_ROLE_KEY` | **[Get from Supabase Dashboard]**              | Supabase Dashboard → Settings → API → service_role key |
| `ANTHROPIC_API_KEY`         | **[Get from Anthropic Console]**               | https://console.anthropic.com/ → API Keys              |

---

## ✅ Setup Checklist

- [ ] `JWT_SECRET` - Set ✅
- [ ] `SESSION_SECRET` - Set ✅
- [ ] `NEXTAUTH_SECRET` - Set ✅
- [ ] `DATABASE_URL` - Set (replace [PASSWORD])
- [ ] `DIRECT_URL` - Set (replace [PASSWORD])
- [ ] `NEXT_PUBLIC_APP_URL` - Set ✅
- [ ] `NEXTAUTH_URL` - Set ✅
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set ✅
- [x] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - ✅ **Already Set**
- [ ] `CRON_SECRET` - Set ✅ (optional but recommended)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - **Need to get from Supabase** (optional)
- [ ] `ANTHROPIC_API_KEY` - **Need to get from Anthropic** (optional)

---

## 🔗 Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase API Keys:** https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api
- **Anthropic Console:** https://console.anthropic.com/

---

## 📝 Notes

- All variables must be set for **Production** environment
- Variable names are **case-sensitive**
- After setting variables, **redeploy** your application
- Database passwords should match your Supabase database password

---

**Status**: Ready to copy values to Vercel! 🚀

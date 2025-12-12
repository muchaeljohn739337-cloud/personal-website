# Vercel Environment Variables - Copy to Dashboard

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**For each variable:**

1. Click "Add New"
2. Enter variable name
3. Paste the value below
4. Select environment: **Production**
5. Click "Save"

---

## DATABASE_URL ✅ REQUIRED

```
Pi6icDrern3Kdszg
```

## JWT_SECRET ✅ REQUIRED

```
a7ed1bc7a946c2bd00e0b9f08f228f719b64996dee20b4e1118e613e73e15363c6dc9d22913c60213a2a3f514988c7873035f1ff0459ef79634799b2c2cbc91c
```

## SESSION_SECRET ✅ REQUIRED

```
8bfcab32fd65100e6fae942945b994ba08299b1aa12f92146ddcfc789d49d3454405df3e190330d0ad6caddf45375b12f3ef0acff67b64d83896e75b47d2520b
```

## NEXTAUTH_SECRET ✅ REQUIRED

```
QIBhNTm4lb3OLBJHNx7fRkCeCvTsjpfrQNvduoO5aWI=\n
```

## NEXT_PUBLIC_APP_URL ✅ REQUIRED

```
https://advanciapayledger.com
```

## NEXTAUTH_URL ✅ REQUIRED

```
https://personal-website-4puis47cl-advanciapayledger.vercel.app\r\n
```

## NEXT_PUBLIC_SUPABASE_URL ✅ REQUIRED

```
https://xesecqcqzykvmrtxrzqi.supabase.c
```

## NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ✅ REQUIRED

```
sb_publishable_dj1xLuksqBUvn9O6AWU3Fg_bRYa6ohq
```

## DIRECT_URL ⚠️ OPTIONAL

```
Pi6icDrern3Kdszg\n
```

---

## ⚠️ Missing Variables

- **SUPABASE_SERVICE_ROLE_KEY** - Set manually in Vercel Dashboard

---

## ✅ After Setting All Variables

1. Vercel will automatically redeploy
2. Wait 2-3 minutes
3. Run: `npm run post-deploy`
4. Verify: `npm run verify:prod`

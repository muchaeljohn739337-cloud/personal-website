# 🔐 Vercel Secrets - Set These in Dashboard Only

**⚠️ CRITICAL: Never commit these to git! Set them in Vercel Dashboard only!**

---

## 📋 **Set These in Vercel Dashboard**

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Select "Production" environment for each:**

### **1. JWT_SECRET**
```
[Set in Vercel Dashboard - Do NOT commit to git]
```

### **2. SESSION_SECRET**
```
[Set in Vercel Dashboard - Do NOT commit to git]
```

### **3. NEXTAUTH_SECRET**
```
[Set in Vercel Dashboard - Do NOT commit to git]
```

### **4. CRON_SECRET**
```
[Set in Vercel Dashboard - Do NOT commit to git]
```

### **5. SUPABASE_SERVICE_ROLE_KEY**
```
[Set in Vercel Dashboard - Use NEW rotated key - Do NOT commit to git]
```

---

## ✅ **How to Set**

1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Click "Add New"
4. Enter variable name
5. Paste the value
6. Select "Production"
7. Click "Save"
8. **DO NOT** save these values in any files

---

## 🔒 **Security Reminder**

- ✅ Set secrets in Vercel Dashboard only
- ✅ Never commit secrets to git
- ✅ Never save secrets in code files
- ✅ Use environment variables only

---

**All secrets should be set directly in Vercel Dashboard, not in any files!**


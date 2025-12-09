# 👤 Admin User Setup Instructions

**⚠️ SECURITY: Keep credentials secure and delete this file after setup!**

---

## Admin Credentials

### Default Admin Account:

**Email:** `admin@advanciapayledger.com`  
**Password:** `AdvanciaAdmin2024!Secure#`  
**Role:** `ADMIN`

**⚠️ IMPORTANT:**

- **CHANGE THIS PASSWORD IMMEDIATELY** after first login
- Use a strong, unique password
- Enable 2FA for admin account
- Never share these credentials

---

## How to Create Admin User

### Option 1: Using Script (Recommended)

**Prerequisites:**

- Database must be accessible
- `DATABASE_URL` must be set correctly

**Steps:**

```bash
cd personal-website
npm run create-admin
```

**Follow the prompts:**

1. Email: `admin@advanciapayledger.com`
2. Name: `Admin User` (or your name)
3. Password: `AdvanciaAdmin2024!Secure#` (or your secure password)
4. Role: `ADMIN` (or `SUPER_ADMIN`)

### Option 2: Using API Endpoint (Development Only)

**⚠️ This endpoint is disabled in production!**

```bash
curl -X POST https://your-domain.com/api/setup/admin \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_ADMIN_SETUP_SECRET",
    "email": "admin@advanciapayledger.com",
    "password": "AdvanciaAdmin2024!Secure#",
    "name": "Admin User"
  }'
```

**Required:** Set `ADMIN_SETUP_SECRET` environment variable

### Option 3: Direct Database (If Script Fails)

**⚠️ Only use if other methods fail!**

1. **Connect to Database:**

   ```bash
   psql $DATABASE_URL
   ```

2. **Hash Password:**
   - Use: https://bcrypt-generator.com/
   - Password: `AdvanciaAdmin2024!Secure#`
   - Cost: 12
   - Copy the hash

3. **Create Admin User:**

   ```sql
   INSERT INTO "User" (
     id, email, name, password, role,
     "isApproved", "isVerified", "emailVerified",
     "approvedAt", "approvedBy", "createdAt", "updatedAt"
   ) VALUES (
     gen_random_uuid()::text,
     'admin@advanciapayledger.com',
     'Admin User',
     '$2a$12$[paste_bcrypt_hash_here]',
     'ADMIN',
     true, true, NOW(), NOW(), 'system', NOW(), NOW()
   );
   ```

4. **Create Default Wallet:**
   ```sql
   INSERT INTO "Wallet" (
     id, name, "userId", type, currency,
     "createdAt", "updatedAt"
   ) VALUES (
     gen_random_uuid()::text,
     'Primary Wallet',
     (SELECT id FROM "User" WHERE email = 'admin@advanciapayledger.com'),
     'PERSONAL',
     'USD',
     NOW(),
     NOW()
   );
   ```

---

## Login Instructions

1. **Go to Login Page:**
   - https://www.advanciapayledger.com/auth/login
   - Or: https://advanciapayledger.com/auth/login

2. **Enter Credentials:**
   - Email: `admin@advanciapayledger.com`
   - Password: `AdvanciaAdmin2024!Secure#`

3. **Access Admin Dashboard:**
   - After login, you'll be redirected to `/admin`
   - Or manually go to: https://www.advanciapayledger.com/admin

---

## Security Checklist

After creating admin and logging in:

- [ ] **Change Password Immediately**
  - Go to Settings → Security
  - Change to a strong, unique password
  - Minimum 12 characters, mixed case, numbers, symbols

- [ ] **Enable 2FA**
  - Go to Settings → Security
  - Enable Two-Factor Authentication
  - Save backup codes securely

- [ ] **Review Admin Settings**
  - Check user approval settings
  - Configure email notifications
  - Set up monitoring alerts

- [ ] **Delete This File**
  - After setup is complete
  - Never commit to git
  - Keep credentials in secure password manager

---

## Troubleshooting

### Cannot Connect to Database

**Error:** `Can't reach database server`

**Solutions:**

1. Verify `DATABASE_URL` is set correctly
2. Check database is running
3. Verify firewall allows connections
4. Check SSL requirements

### Admin Login Not Working

**Error:** "Account pending approval"

**Solution:**

- Admins are auto-approved
- Check database: `SELECT email, role, "isApproved" FROM "User" WHERE email = 'admin@advanciapayledger.com';`
- Ensure `role = 'ADMIN'` and `isApproved = true`

### Forgot Admin Password

**Solution:**

1. Use password reset (if email configured)
2. Or update in database:
   ```sql
   UPDATE "User"
   SET password = '$2a$12$[new_bcrypt_hash]'
   WHERE email = 'admin@advanciapayledger.com';
   ```

---

## Admin Privileges

Once logged in as admin, you can:

- ✅ Approve/reject user registrations
- ✅ View all users and their accounts
- ✅ Send/withdraw funds from user accounts
- ✅ Access admin dashboard
- ✅ Manage system settings
- ✅ View audit logs
- ✅ Instruct AI agents
- ✅ Cannot be locked out by authentication

---

**⚠️ SECURITY REMINDER:**

- Delete this file after setup
- Never commit credentials to git
- Use strong, unique passwords
- Enable 2FA
- Rotate passwords regularly

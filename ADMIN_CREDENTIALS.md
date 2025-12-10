# 🔐 Admin Credentials

**⚠️ SECURITY WARNING: Keep this file secure and delete after use!**

---

## Admin User Creation

### Method 1: Using Script (Recommended)

```bash
cd personal-website
npx tsx scripts/create-admin.ts
```

Follow the prompts to create your admin user.

### Method 2: Using API Endpoint (Development Only)

**⚠️ This endpoint is disabled in production for security.**

```bash
POST /api/setup/admin
Content-Type: application/json

{
  "secret": "YOUR_ADMIN_SETUP_SECRET",
  "email": "admin@advanciapayledger.com",
  "password": "YourSecurePassword123!",
  "name": "Admin User"
}
```

**Required Environment Variable:**

- `ADMIN_SETUP_SECRET` - Must be set in environment

---

## Default Admin Credentials

**⚠️ IMPORTANT:** These are example credentials. You MUST change them after first login!

### Generated Admin Account:

**Email:** `admin@advanciapayledger.com`  
**Password:** `[Generated during setup]`  
**Role:** `ADMIN` or `SUPER_ADMIN`

### Security Notes:

1. **Change Password Immediately**
   - After first login, change the password
   - Use a strong password (min 12 characters, mixed case, numbers, symbols)

2. **Enable 2FA**
   - Go to Settings → Security
   - Enable Two-Factor Authentication
   - Save backup codes securely

3. **Admin Privileges:**
   - Can approve/reject user registrations
   - Can control user accounts (send/withdraw funds)
   - Can access admin dashboard
   - Can manage system settings
   - Cannot be locked out by authentication

---

## Creating Admin via Database (If Script Fails)

If the script fails due to database connection issues:

1. **Connect to Database:**

   ```bash
   psql $DATABASE_URL
   ```

2. **Create Admin User:**

   ```sql
   -- Hash password first (use bcrypt with cost 12)
   -- Password: YourSecurePassword123!
   -- Hash: [Generate using bcrypt]

   INSERT INTO "User" (
     id,
     email,
     name,
     password,
     role,
     "isApproved",
     "isVerified",
     "emailVerified",
     "approvedAt",
     "approvedBy",
     "createdAt",
     "updatedAt"
   ) VALUES (
     gen_random_uuid()::text,
     'admin@advanciapayledger.com',
     'Admin User',
     '$2a$12$[bcrypt_hash_here]',
     'ADMIN',
     true,
     true,
     NOW(),
     NOW(),
     'system',
     NOW(),
     NOW()
   );
   ```

3. **Create Default Wallet:**
   ```sql
   INSERT INTO "Wallet" (
     id,
     name,
     "userId",
     type,
     currency,
     "createdAt",
     "updatedAt"
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

## Password Requirements

- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&\*)

**Example Strong Passwords:**

- `Admin@Secure2024!`
- `AdvanciaPayLedger#123`
- `MyAdmin!Pass2024$`

---

## Admin Login URL

After creating admin user:

1. Go to: `https://www.advanciapayledger.com/auth/login`
2. Enter admin email and password
3. You'll be redirected to admin dashboard: `/admin`

---

## Troubleshooting

### Cannot Create Admin

**Issue:** Database connection error

**Solution:**

1. Verify `DATABASE_URL` is set correctly
2. Check database is accessible
3. Ensure database migrations have run
4. Try connecting directly: `psql $DATABASE_URL`

### Admin Login Not Working

**Issue:** "Account pending approval" error

**Solution:**

- Admins are auto-approved, but if you see this:
  1. Check user role in database: `SELECT email, role, "isApproved" FROM "User" WHERE email = 'admin@advanciapayledger.com';`
  2. Ensure `role = 'ADMIN'` or `'SUPER_ADMIN'`
  3. Ensure `isApproved = true`

### Forgot Admin Password

**Solution:**

1. Use password reset (if email is configured)
2. Or update directly in database:
   ```sql
   UPDATE "User"
   SET password = '$2a$12$[new_bcrypt_hash]'
   WHERE email = 'admin@advanciapayledger.com';
   ```

---

**⚠️ SECURITY REMINDER:**

- Delete this file after creating admin
- Never commit admin credentials to git
- Use strong, unique passwords
- Enable 2FA for admin accounts
- Rotate passwords regularly

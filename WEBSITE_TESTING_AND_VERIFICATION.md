# 🧪 Website Testing & Verification Guide

**Date:** 2025-01-27  
**Production URL:** https://personal-website-7whguk6z4-advanciapayledgeradvanciapayledger.vercel.app  
**Custom Domain:** https://advanciapayledger.com (if configured)

---

## ✅ Testing Checklist

### 1. Health Endpoint Test

**URL:** `/api/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T...",
  "uptime": 123.45,
  "environment": "production",
  "database": {
    "status": "healthy",
    "responseTime": 45
  },
  "paymentProviders": {
    "stripe": true/false,
    "lemonsqueezy": true/false,
    "nowpayments": true/false,
    "alchemypay": true/false
  },
  "memory": {
    "used": 123,
    "total": 256,
    "external": 45,
    "unit": "MB"
  }
}
```

**Test Command:**
```bash
curl https://personal-website-7whguk6z4-advanciapayledgeradvanciapayledger.vercel.app/api/health
```

**Or in PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://personal-website-7whguk6z4-advanciapayledgeradvanciapayledger.vercel.app/api/health" | Select-Object StatusCode, Content
```

---

### 2. Homepage Test

**URL:** `/`

**Expected:**
- Status Code: `200 OK`
- Page loads without errors
- No console errors in browser
- All assets load correctly

**Test:**
- Visit: https://personal-website-7whguk6z4-advanciapayledgeradvanciapayledger.vercel.app
- Check browser console for errors
- Verify page renders correctly

---

### 3. Authentication Routes Test

#### Login Page
**URL:** `/auth/login`

**Expected:**
- Status Code: `200 OK`
- Login form displays
- Can submit login credentials

**Test:**
1. Visit: https://personal-website-7whguk6z4-advanciapayledgeradvanciapayledger.vercel.app/auth/login
2. Verify form is visible
3. Try logging in with test credentials

#### Registration Page
**URL:** `/auth/register`

**Expected:**
- Status Code: `200 OK`
- Registration form displays
- Can submit registration

**Test:**
1. Visit: https://personal-website-7whguk6z4-advanciapayledgeradvanciapayledger.vercel.app/auth/register
2. Verify form is visible
3. Try registering a new account

---

### 4. Public Pages Test

Test these public routes:

- `/privacy` - Privacy Policy
- `/terms` - Terms of Service
- `/faq` - FAQ Page
- `/security` - Security Information

**Expected:** All return `200 OK` and display content

---

### 5. Dashboard Test (Requires Authentication)

**URL:** `/dashboard`

**Expected Behavior:**
- If not logged in: Redirects to `/auth/login`
- If logged in: Displays dashboard

**Test:**
1. Try accessing `/dashboard` without login
2. Should redirect to login page
3. After login, should access dashboard

---

### 6. API Routes Test

#### Admin API Routes (Require Admin Authentication)

Test these endpoints (require admin login):

- `/api/admin/stats` - Admin statistics
- `/api/admin/users` - User management
- `/api/admin/payments/stats` - Payment statistics
- `/api/admin/analytics` - Analytics data

**Expected:** Return `401 Unauthorized` if not authenticated, `200 OK` with data if authenticated

---

## 🔐 Environment Variables Verification

### Required Variables Checklist

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

#### 🔴 Critical (Must Have)

- [ ] `DATABASE_URL` - Production database connection string
- [ ] `NEXTAUTH_SECRET` - NextAuth.js secret (32+ characters)
- [ ] `JWT_SECRET` - JWT token signing secret (64+ characters)
- [ ] `SESSION_SECRET` - Session encryption secret (64+ characters)
- [ ] `NEXT_PUBLIC_APP_URL` - `https://advanciapayledger.com`
- [ ] `NEXTAUTH_URL` - `https://advanciapayledger.com`

#### ⚠️ Important (Recommended)

- [ ] `DIRECT_URL` - Direct database connection (for migrations)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `CRON_SECRET` - For cron job security

#### 💳 Optional (For Features)

- [ ] `STRIPE_SECRET_KEY` - For Stripe payments
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `RESEND_API_KEY` - For email sending
- [ ] `OPENAI_API_KEY` - For AI features
- [ ] `ANTHROPIC_API_KEY` - For Claude AI features

---

## 📊 Vercel Deployment Logs

### How to Check Logs

1. **Via Vercel Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Select project: `personal-website`
   - Click on latest deployment
   - View "Build Logs" and "Function Logs"

2. **Via Vercel CLI:**
   ```bash
   vercel logs <deployment-url>
   ```

3. **Check for Errors:**
   - Look for red error messages
   - Check for missing environment variables
   - Verify database connection errors
   - Check for build failures

---

## 🧪 User Registration & Login Test

### Test Registration Flow

1. **Navigate to Registration:**
   - Visit: `/auth/register`

2. **Fill Registration Form:**
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Name: `Test User`
   - Accept terms (if checkbox exists)

3. **Submit Form:**
   - Click "Register" or "Sign Up"
   - Should redirect to login or dashboard
   - Check for success message

4. **Verify in Database:**
   - Check if user was created
   - Verify email verification status (if enabled)

### Test Login Flow

1. **Navigate to Login:**
   - Visit: `/auth/login`

2. **Enter Credentials:**
   - Email: `test@example.com`
   - Password: `TestPassword123!`

3. **Submit:**
   - Click "Login" or "Sign In"
   - Should redirect to dashboard
   - Session should be created

4. **Verify Session:**
   - Check if cookies are set
   - Verify user can access protected routes
   - Test logout functionality

---

## 🔍 Critical Features Test

### 1. Database Connection
- Health endpoint should show `database.status: "healthy"`
- User registration should save to database
- Login should query database successfully

### 2. Authentication
- Login creates session
- Protected routes require authentication
- Logout clears session
- Session persists across page refreshes

### 3. API Routes
- Public routes accessible without auth
- Protected routes require authentication
- Admin routes require admin role
- Error handling works correctly

### 4. Payment Features (If Configured)
- Stripe integration works
- Payment forms load
- Webhooks receive events
- Transactions are recorded

### 5. Email Features (If Configured)
- Registration emails sent
- Password reset emails sent
- Email verification works

---

## 🚨 Error Monitoring

### Check for Common Errors

1. **500 Internal Server Error:**
   - Check Vercel function logs
   - Verify environment variables
   - Check database connection

2. **401 Unauthorized:**
   - Verify authentication is working
   - Check session creation
   - Verify JWT_SECRET is set

3. **Database Connection Errors:**
   - Verify DATABASE_URL is correct
   - Check database is accessible
   - Verify SSL settings if required

4. **Build Errors:**
   - Check build logs in Vercel
   - Verify all dependencies installed
   - Check for TypeScript errors

---

## 📝 Testing Results Template

```
Date: 2025-01-27
Tester: [Your Name]
Environment: Production

✅ Health Endpoint: PASS / FAIL
✅ Homepage: PASS / FAIL
✅ Login Page: PASS / FAIL
✅ Registration: PASS / FAIL
✅ Dashboard Access: PASS / FAIL
✅ Environment Variables: PASS / FAIL
✅ Database Connection: PASS / FAIL
✅ API Routes: PASS / FAIL

Issues Found:
- [List any issues]

Notes:
- [Additional notes]
```

---

## 🔄 After Testing

1. **Document Results:**
   - Record all test results
   - Note any issues found
   - Document fixes applied

2. **Fix Issues:**
   - Address any critical errors
   - Update environment variables if needed
   - Redeploy if necessary

3. **Monitor:**
   - Set up error monitoring (Sentry)
   - Monitor deployment logs
   - Track user registrations
   - Watch for errors in production

---

## ✅ Success Criteria

Website is ready for users when:

- ✅ Health endpoint returns `200 OK` with healthy status
- ✅ Homepage loads without errors
- ✅ User registration works
- ✅ User login works
- ✅ Dashboard is accessible after login
- ✅ All environment variables are set
- ✅ No critical errors in logs
- ✅ Database connection is healthy

---

**Status:** Ready for comprehensive testing! 🧪

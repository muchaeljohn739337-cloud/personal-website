# 🎉 Frontend UI Testing & Deployment Guide

## ✅ Setup Complete!

### Backend Status

- ✅ Server running on http://localhost:4000
- ✅ Security headers active (HSTS, CSP, X-Frame-Options)
- ✅ Rate limiting enabled (100 req/15min)
- ✅ CORS configured for frontend
- ✅ JWT authentication working
- ✅ 93 API endpoints available
- ✅ 22 AI agents scheduled
- ⚠️ Redis/Vault warnings (non-blocking)

### Frontend Status

- ✅ Next.js 14 dev server on http://127.0.0.1:3000
- ✅ Environment variables configured
- ✅ API connection to backend
- ✅ All UI pages created

---

## 🧪 Manual Testing Checklist

### 1. Authentication Testing

**URL:** http://127.0.0.1:3000/auth/login

**Test Steps:**

```
1. Open browser: http://127.0.0.1:3000/auth/login
2. Login credentials:
   Email: admin@advanciapayledger.com
   Password: Admin123!
3. Verify token stored in localStorage
4. Check redirect to dashboard
```

**Expected:**

- ✅ Login successful
- ✅ JWT token in localStorage
- ✅ Redirect to /dashboard

---

### 2. Project Management Testing

**URL:** http://127.0.0.1:3000/projects

**Test Steps:**

#### Create Project:

```
1. Navigate to /projects
2. Click "New Project" button
3. Fill form:
   - Name: "Test Project"
   - Description: "Testing CRUD operations"
   - Status: ACTIVE
   - Priority: HIGH
   - Start Date: Today
4. Click "Create Project"
```

**Expected:**

- ✅ Project created
- ✅ Redirected to project detail page
- ✅ Project visible in list

#### Kanban Board:

```
1. From project detail, click "Kanban Board" tab
2. Click "+" on any column
3. Create task:
   - Title: "Test Task"
   - Priority: HIGH
   - Estimated Hours: 5
4. Drag task between columns
```

**Expected:**

- ✅ Task created
- ✅ Appears in correct column
- ✅ Drag-drop works smoothly
- ✅ Task moves to new column

#### API Endpoints Tested:

```
POST /api/projects (Create)
GET /api/projects (List)
GET /api/projects/:id (Read)
POST /api/projects/:id/tasks (Create Task)
PUT /api/tasks/:id/move (Move Task)
```

---

### 3. Blog/CMS Testing

**URL:** http://127.0.0.1:3000/admin/blog

**Test Steps:**

#### Create Blog Post:

```
1. Navigate to /admin/blog
2. Click "New Post"
3. Fill form:
   - Title: "Welcome Post"
   - Content: Write markdown
   - Status: PUBLISHED
   - Toggle to "Preview" to see rendering
4. Add SEO title and description
5. Click "Create Post"
```

**Expected:**

- ✅ Post created
- ✅ Markdown preview works
- ✅ Post appears in list
- ✅ SEO fields saved

#### Markdown Editor:

````
1. Test markdown syntax:
   **bold**, *italic*, # Heading
   - Bullet lists
   ```code blocks```
2. Toggle Preview tab
````

**Expected:**

- ✅ Markdown renders correctly
- ✅ Preview updates
- ✅ Syntax highlighting works

#### API Endpoints Tested:

```
POST /api/blog/posts (Create)
GET /api/blog/posts (List)
GET /api/blog/categories (Categories)
```

---

### 4. SEO Management Testing

**URL:** http://127.0.0.1:3000/admin/seo

**Test Steps:**

#### Run SEO Audit:

```
1. Navigate to /admin/seo
2. Find a published blog post
3. Click "Run Audit" button
4. Wait for audit to complete
5. View audit score (0-100)
```

**Expected:**

- ✅ Audit executes
- ✅ Score displayed (0-100)
- ✅ Findings visible
- ✅ Recent audits list updates

#### Generate Sitemap:

```
1. Click "Generate Sitemap" button
2. Wait for confirmation
```

**Expected:**

- ✅ Sitemap generated
- ✅ Success message shown

#### API Endpoints Tested:

```
POST /api/seo/audits (Create Audit)
GET /api/seo/audits (List Audits)
POST /api/seo/sitemap/generate (Generate)
```

---

### 5. Social Media Testing

**URL:** http://127.0.0.1:3000/admin/social

**Test Steps:**

#### Create Social Post:

```
1. Navigate to /admin/social
2. Click "New Post"
3. Select platform (if any configured)
4. Write content
5. Set status to DRAFT or SCHEDULED
6. Add schedule datetime if SCHEDULED
7. Click "Create Post"
```

**Expected:**

- ✅ Post created
- ✅ Appears in recent posts
- ✅ Status badge correct
- ✅ Schedule time visible

#### Platform Management:

```
1. Check connected platforms section
2. If empty, note "Connect accounts" message
```

**Expected:**

- ✅ Shows platform count
- ✅ Stats displayed (total, scheduled, published)

#### API Endpoints Tested:

```
POST /api/social/posts (Create)
GET /api/social/posts (List)
GET /api/social/platforms (Platforms)
```

---

## 🔍 Browser DevTools Testing

### Network Tab:

```
1. Open DevTools (F12)
2. Go to Network tab
3. Perform any action
4. Verify:
   - Status codes (200, 201)
   - Authorization headers present
   - Response data correct
```

### Console Tab:

```
1. Check for errors
2. Should see:
   - No red errors
   - API calls logging (if enabled)
```

### Application Tab:

```
1. Go to Application > Local Storage
2. Verify:
   - "token" key present after login
   - JWT format (eyJhbGci...)
```

---

## 🛡️ Security Features Verification

### 1. Check Security Headers

```bash
# In PowerShell:
curl -I http://localhost:4000/health

# Look for:
Strict-Transport-Security: max-age=31536000
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: ...
```

### 2. Rate Limiting Test

```bash
# Send 105 requests rapidly:
1..105 | ForEach-Object {
  Invoke-WebRequest -Uri http://localhost:4000/health
}

# Should get 429 Too Many Requests after 100
```

### 3. CORS Test

```javascript
// In browser console on different origin:
fetch("http://localhost:4000/api/projects");
// Should fail with CORS error (expected)

// From allowed origin (localhost:3000):
// Should succeed with Authorization header
```

---

## 📊 Expected Results Summary

| Feature            | Endpoint                       | Expected Response    |
| ------------------ | ------------------------------ | -------------------- |
| Create Project     | POST /api/projects             | 201 + project object |
| List Projects      | GET /api/projects              | 200 + array          |
| Create Task        | POST /api/projects/:id/tasks   | 201 + task object    |
| Move Task          | PUT /api/tasks/:id/move        | 200 + updated task   |
| Create Blog Post   | POST /api/blog/posts           | 201 + post object    |
| List Posts         | GET /api/blog/posts            | 200 + array          |
| Run SEO Audit      | POST /api/seo/audits           | 201 + audit result   |
| Generate Sitemap   | POST /api/seo/sitemap/generate | 200 + success        |
| Create Social Post | POST /api/social/posts         | 201 + post object    |
| List Social Posts  | GET /api/social/posts          | 200 + array          |

---

## 🐛 Common Issues & Solutions

### Issue: "Network Error"

**Solution:**

- Check backend running: http://localhost:4000/health
- Verify .env.local: `NEXT_PUBLIC_API_URL=http://localhost:4000`
- Check browser console for CORS errors

### Issue: "401 Unauthorized"

**Solution:**

- Login again: /auth/login
- Check localStorage has "token"
- Verify token not expired (check backend logs)

### Issue: "Drag-drop not working"

**Solution:**

- Ensure @dnd-kit packages installed
- Check browser console for errors
- Try refreshing page

### Issue: "Markdown not rendering"

**Solution:**

- Check react-markdown installed
- Verify remark-gfm package present
- Test in Preview tab

### Issue: "404 Not Found"

**Solution:**

- Backend: Check route exists in src/routes/
- Frontend: Verify page.tsx exists in src/app/

---

## 🚀 Production Deployment Checklist

### Backend (.env production):

```bash
NODE_ENV=production
PORT=4000

# Required:
DATABASE_URL=your-production-db
JWT_SECRET=generate-strong-secret-64-chars

# Recommended:
SENTRY_DSN=https://...@sentry.io/...

# Security:
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_DDOS_PROTECTION=true
TRUST_PROXY=true

# Optional:
TURNSTILE_ENABLED=true
TURNSTILE_SITE_KEY=your-key
TURNSTILE_SECRET_KEY=your-secret
```

### Frontend (.env.production):

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

### Build Commands:

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

### Deployment Platforms:

- **Backend:** Render, Railway, Fly.io, AWS ECS
- **Frontend:** Vercel (recommended), Netlify, Cloudflare Pages
- **Database:** PlanetScale, Railway, Neon (PostgreSQL)

---

## 📝 Test Report Template

```markdown
## Test Session: [Date]

### Environment:

- Backend: http://localhost:4000
- Frontend: http://127.0.0.1:3000
- Browser: [Chrome/Firefox/Safari]

### Tests Performed:

#### 1. Authentication

- [ ] Login successful
- [ ] Token stored
- [ ] Dashboard accessible

#### 2. Project Management

- [ ] Create project
- [ ] List projects
- [ ] Create task
- [ ] Drag-drop task
- [ ] View analytics

#### 3. Blog/CMS

- [ ] Create post
- [ ] Markdown editor works
- [ ] Preview renders
- [ ] List posts

#### 4. SEO

- [ ] Run audit
- [ ] View audit score
- [ ] Generate sitemap

#### 5. Social Media

- [ ] Create post
- [ ] Schedule post
- [ ] View stats

### Issues Found:

1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce: ...

### Notes:

- ...
```

---

## 🎯 Next Steps

1. **Complete Manual Testing** using checklist above
2. **Fix any bugs** found during testing
3. **Add Sentry DSN** for error tracking
4. **Configure SMS Pool** if needed (run `npx tsx scripts/store-smspool-key.ts`)
5. **Enable Turnstile** for production (get keys from Cloudflare)
6. **Write automated tests** (Jest/Cypress)
7. **Deploy to production** using checklist

---

## 📞 Support

- **Backend Logs:** Check terminal where `npm run dev` is running
- **Frontend Logs:** Check browser DevTools console
- **Database:** Check `backend/dev.db` (SQLite)
- **API Docs:** Check `backend/docs/` folder

---

**All systems operational! 🚀 Start testing at http://127.0.0.1:3000**

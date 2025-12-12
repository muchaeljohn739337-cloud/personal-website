# 🚀 Codespace Setup Guide - Advancia Pay Ledger

This guide helps you set up the development environment as recommended.

## ✅ Quick Setup

Run the automated setup script:

```powershell
pwsh setup-codespace.ps1
```

This will:

- ✅ Check Node.js and npm versions
- ✅ Install all dependencies (root, backend, frontend)
- ✅ Generate Prisma client
- ✅ Create environment variable templates
- ✅ Verify workspace configuration

## 📋 Manual Setup Steps

### 1. Prerequisites

- **Node.js**: 18+ (Current: v24.11.1 ✅)
- **npm**: 9+ (Current: 11.6.2 ✅)
- **PostgreSQL**: For database (or use cloud database)
- **Git**: For version control

### 2. Install Dependencies

```powershell
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install
npx prisma generate

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Variables

#### Backend (`.env` in `backend/`)

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@host:5432/database

# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Security (REQUIRED)
JWT_SECRET=your-secret-key-min-32-chars
SESSION_SECRET=your-session-secret
API_KEY=your-api-key

# Email (Optional - for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# VAPID (Optional - for web push)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:support@advanciapayledger.com
```

#### Frontend (`.env.local` in `frontend/`)

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

# App Configuration
NEXT_PUBLIC_APP_NAME=Advancia PayLedger
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAGS=notifications,bonus_tokens,debit_card,crypto_recovery

# Stripe (Optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# VAPID (Optional)
NEXT_PUBLIC_VAPID_KEY=...
```

### 4. Database Setup

#### Option A: Local PostgreSQL

```powershell
# Using Docker
docker run --name advancia-postgres `
  -e POSTGRES_USER=dev_user `
  -e POSTGRES_PASSWORD=dev_password `
  -e POSTGRES_DB=advancia_ledger `
  -p 5432:5432 `
  -d postgres:14-alpine
```

#### Option B: Cloud Database (Recommended)

- **Render PostgreSQL**: https://render.com
- **Neon**: https://neon.tech
- **Supabase**: https://supabase.com

Update `DATABASE_URL` in `backend/.env` with your connection string.

### 5. Run Database Migration

```powershell
cd backend
npx prisma migrate dev --name add_ai_bot_detection_system
```

This creates all tables including the new AI bot detection models.

### 6. Start Development Servers

**Terminal 1 - Backend:**

```powershell
cd backend
npm run dev
```

Backend runs on: `http://localhost:4000`

**Terminal 2 - Frontend:**

```powershell
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

## 🎯 VS Code Workspace Configuration

The workspace is pre-configured with:

- ✅ **Multi-root workspace**: Root, Backend, Frontend folders
- ✅ **TypeScript**: Configured for both projects
- ✅ **Prettier**: Format on save enabled
- ✅ **ESLint**: Auto-fix on save
- ✅ **Debug configurations**: Backend and Frontend debugging
- ✅ **Recommended extensions**: Prisma, ESLint, Prettier, etc.

### Opening the Workspace

1. Open VS Code
2. File → Open Workspace from File...
3. Select: `modular-saas-platform.code-workspace`

## 🔧 Recommended VS Code Extensions

Install these extensions for the best experience:

- **Prisma** (`prisma.prisma`) - Prisma schema support
- **ESLint** (`dbaeumer.vscode-eslint`) - JavaScript/TypeScript linting
- **Prettier** (`esbenp.prettier-vscode`) - Code formatting
- **GitLens** (`eamodio.gitlens`) - Git integration
- **Thunder Client** (`rangav.vscode-thunder-client`) - API testing
- **Error Lens** (`usernamehw.errorlens`) - Inline error display

## 📊 Project Structure

```
modular-saas-platform/
├── backend/                 # Express.js + TypeScript backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/      # Business logic (including AI services)
│   │   ├── middleware/    # Auth, security, etc.
│   │   └── index.ts       # Server entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── models/            # AI model storage
├── frontend/               # Next.js 14 frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities
│   └── public/            # Static assets
└── modular-saas-platform.code-workspace  # VS Code workspace
```

## 🧪 Testing the Setup

### 1. Test Backend Health

```powershell
curl http://localhost:4000/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": ...
}
```

### 2. Test Bot Detection

```powershell
curl -X POST http://localhost:4000/api/bot-check/verify `
  -H "Content-Type: application/json"
```

### 3. Test Frontend

Open: `http://localhost:3000`

You should see the Advancia Pay Ledger dashboard.

## 🎓 AI Bot Detection System

The workspace includes a complete AI bot detection system:

- **Bot Detection**: ML-capable with rule-based fallback
- **Click Tracking**: All clicks tracked with bot detection
- **AI Training**: Admin dashboard for training models
- **Fraud Detection**: Integrated with financial transactions

### Access AI Training Dashboard

1. Log in as admin
2. Navigate to: `http://localhost:3000/admin/ai-training`
3. Verify training data
4. Train models when you have 100+ verified samples

## 🐛 Troubleshooting

### Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `backend/.env`
3. Test connection: `psql $DATABASE_URL`

### Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:

```powershell
cd backend
npx prisma generate
```

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::4000`

**Solution**:

```powershell
# Find process using port 4000
netstat -ano | findstr :4000

# Kill process (replace PID)
taskkill /PID <pid> /F
```

### TypeScript Errors

**Error**: Property does not exist on PrismaClient

**Solution**:

1. Run: `npx prisma generate`
2. Restart TypeScript server in VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

## 📚 Additional Resources

- **Backend README**: `backend/README.md`
- **Frontend README**: `frontend/README.md`
- **API Documentation**: See `backend/src/routes/`
- **Prisma Setup**: `backend/PRISMA_SETUP.md`

## ✅ Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (root, backend, frontend)
- [ ] Environment variables configured
- [ ] Database accessible
- [ ] Prisma client generated
- [ ] Database migration run
- [ ] Backend server starts successfully
- [ ] Frontend server starts successfully
- [ ] Can access admin AI training dashboard

---

**Last Updated**: $(Get-Date -Format "yyyy-MM-dd")
**Setup Script**: `setup-codespace.ps1`

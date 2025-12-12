# 🚀 Setup Instructions - Advancia Pay Ledger

**Last Updated:** December 5, 2025  
**Estimated Time:** 15-20 minutes

---

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Ubuntu/Debian Linux** (for PostgreSQL installation)

---

## ⚡ Quick Setup (Automated)

### Option 1: One-Command Setup

```bash
# Run the automated setup script
bash scripts/setup-database.sh
```

This script will:

1. Install PostgreSQL if not present
2. Create development and test databases
3. Run Prisma migrations
4. Generate Prisma Client
5. Verify database connection

---

## 🔧 Manual Setup (Step-by-Step)

### Step 1: Install PostgreSQL

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

### Step 2: Create Databases

```bash
# Create databases and set password
sudo -u postgres psql << EOF
CREATE DATABASE advancia_payledger;
CREATE DATABASE modular_saas_test;
ALTER USER postgres PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE advancia_payledger TO postgres;
GRANT ALL PRIVILEGES ON DATABASE modular_saas_test TO postgres;
\q
EOF
```

### Step 3: Configure Environment

```bash
# Navigate to backend
cd backend

# Copy environment template
cp .env.example .env

# Edit .env file with your settings
nano .env
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/advancia_payledger"

# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long"
SESSION_SECRET="your-session-secret-key-change-this"

# Redis (optional for development)
REDIS_URL="redis://localhost:6379"
```

### Step 4: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 5: Setup Database Schema

```bash
# Navigate to backend
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed initial data
npm run db:seed
```

### Step 6: Start Development Servers

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### Step 7: Verify Installation

```bash
# Check backend health
curl http://localhost:4000/api/health

# Check frontend
curl http://localhost:3000/api/healthcheck

# Run tests
cd backend
npm test
```

---

## 🎯 Access Points

After successful setup:

- **Frontend Dashboard:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **API Health Check:** http://localhost:4000/api/health
- **Prisma Studio:** Run `npm run prisma:studio` in backend folder

---

## 🐛 Troubleshooting

### Issue: PostgreSQL Connection Failed

**Solution:**

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql

# Test connection
PGPASSWORD=postgres psql -h localhost -U postgres -d advancia_payledger -c "SELECT 1"
```

### Issue: Port Already in Use

**Solution:**

```bash
# Find process using port 4000
lsof -i :4000

# Kill the process (replace PID with actual process ID)
kill -9 PID

# Or change port in .env file
PORT=4001
```

### Issue: Prisma Migration Failed

**Solution:**

```bash
# Reset database (WARNING: This deletes all data)
npm run prisma:reset

# Or push schema without migration
npm run prisma:push
```

### Issue: Tests Failing

**Solution:**

```bash
# Ensure test database exists
sudo -u postgres psql -c "CREATE DATABASE modular_saas_test;"

# Update .env.test with correct DATABASE_URL
cd backend
nano .env.test

# Run tests again
npm test
```

### Issue: Module Not Found Errors

**Solution:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache if needed
npm cache clean --force
```

---

## 📦 Optional Services

### Redis (for caching and sessions)

```bash
# Install Redis
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

### Docker (alternative setup)

```bash
# Start all services with Docker Compose
docker-compose up -d

# This will start:
# - PostgreSQL
# - Redis
# - Backend API
# - Frontend
```

---

## 🔐 Security Notes

### For Development:

- Default passwords are used (postgres/postgres)
- JWT secrets are simple strings
- CORS is open to localhost

### For Production:

- ⚠️ **CHANGE ALL DEFAULT PASSWORDS**
- ⚠️ **USE STRONG JWT SECRETS** (min 32 characters)
- ⚠️ **CONFIGURE PROPER CORS ORIGINS**
- ⚠️ **ENABLE SSL/TLS**
- ⚠️ **SET UP ENVIRONMENT VARIABLES SECURELY**

---

## 📚 Next Steps

After setup is complete:

1. **Read Documentation:**
   - [README.md](README.md) - Project overview
   - [CRITICAL_FIXES_REQUIRED.md](CRITICAL_FIXES_REQUIRED.md) - Current status
   - [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Feature guide

2. **Create Admin User:**

   ```bash
   cd backend
   npm run seed:admin
   ```

3. **Explore the API:**
   - Open Prisma Studio: `npm run prisma:studio`
   - Test API endpoints with Postman or curl
   - Check API documentation (if available)

4. **Start Development:**
   - Check [FRONTEND_FEATURES_CHECKLIST.md](FRONTEND_FEATURES_CHECKLIST.md)
   - Review open issues
   - Start implementing features

---

## 🆘 Getting Help

### Common Commands

```bash
# Backend
npm run dev              # Start development server
npm test                 # Run tests
npm run build            # Build for production
npm run prisma:studio    # Open database GUI
npm run prisma:migrate   # Run migrations

# Frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run linter

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:push      # Push schema to database
npm run prisma:reset     # Reset database (WARNING: deletes data)
npm run db:seed          # Seed database with initial data
```

### Useful Links

- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Express Docs:** https://expressjs.com/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

### Support

- Check existing documentation in the project
- Review error logs in console
- Check [CRITICAL_FIXES_REQUIRED.md](CRITICAL_FIXES_REQUIRED.md) for known issues

---

## ✅ Setup Checklist

- [ ] PostgreSQL installed and running
- [ ] Databases created (advancia_payledger, modular_saas_test)
- [ ] Environment files configured (.env, .env.test)
- [ ] Dependencies installed (backend and frontend)
- [ ] Prisma Client generated
- [ ] Database migrations run
- [ ] Backend server starts successfully
- [ ] Frontend server starts successfully
- [ ] Tests pass
- [ ] Can access dashboard at http://localhost:3000
- [ ] API responds at http://localhost:4000

---

**🎉 Setup Complete!** You're ready to start development.

_For issues or questions, refer to [CRITICAL_FIXES_REQUIRED.md](CRITICAL_FIXES_REQUIRED.md)_

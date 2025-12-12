# 🚀 QUICK START - Launch Advancia in 2 Minutes

**For users to access your self-hosted SaaS platform**

---

## ✅ Prerequisites (One-Time Setup)

```bash
# 1. Install Node.js 20+ and PostgreSQL
node --version  # Should be v20+
psql --version  # Should be installed

# 2. Clone and install
git clone https://github.com/muchaeljohn739337-cloud/modular-saas-platform.git
cd modular-saas-platform

# 3. Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Setup database
cd backend
cp .env.example .env
# Edit .env with your database URL
psql -U postgres -c "CREATE DATABASE advancia;"
npx prisma migrate deploy
npx prisma generate

# 5. Create admin user
npm run seed:admin
```

---

## 🎯 Launch Command (Every Time)

```bash
# From project root
node launch.js
```

That's it! The launcher will:

1. ✅ Check prerequisites
2. ✅ Start backend (port 4000)
3. ✅ Start frontend (port 3000)
4. ✅ Start Guardian AI monitoring
5. ✅ Run health checks
6. ✅ Make it accessible to users

**Access your platform:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Admin Dashboard: http://localhost:3000/admin
- Status Page: http://localhost/status

---

## 🛡️ With Guardian AI Protection

```bash
# Enable self-monitoring and auto-correction
cd backend
npm install nodemailer axios

# Add Guardian tables
psql -U postgres -d advancia -f prisma/migrations/add_guardian_tables.sql

# Configure alerts (add to backend/.env)
ADMIN_EMAIL=your-email@advanciapayledger.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK

# Launch with Guardian
node launch.js
```

Guardian AI will:

- 🔒 Block malicious IPs automatically
- 🏥 Monitor health 24/7
- 🔄 Auto-restart on crashes
- 📧 Alert you for critical issues
- 💡 Suggest fixes for errors

---

## 🌍 Make It Publicly Accessible

### Option 1: Cloudflare Tunnel (Easiest)

```bash
npm install -g cloudflared

# One-time setup
cloudflared tunnel create advancia

# Start tunnel
cloudflared tunnel run advancia
```

Your platform is now accessible at: `https://advancia-xxxxxx.trycloudflare.com`

### Option 2: Nginx Reverse Proxy

```bash
# Install Nginx
# Windows: Download from nginx.org
# Linux: apt-get install nginx

# Copy provided config
cp status-page/nginx/status.conf /etc/nginx/sites-available/advancia.conf
ln -s /etc/nginx/sites-available/advancia.conf /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

Configure your domain DNS → Point to your server IP
Access at: `https://advanciapayledger.com`

### Option 3: Deploy to Cloud

**Vercel (Frontend):**

```bash
cd frontend
npx vercel --prod
```

**Render (Backend):**

```bash
# Go to render.com
# Connect GitHub repo
# Deploy backend folder
# Add environment variables from .env
```

---

## 👥 User Access & First Login

### Create User Accounts

**Option 1: Self-Registration (Recommended)**

1. Go to `http://localhost:3000/signup`
2. Users fill form
3. Receive OTP email
4. Verify and login

**Option 2: Admin Creates Users**

```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

(async () => {
  const hashedPassword = await bcrypt.hash('TempPassword123!', 10);
  await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: hashedPassword,
      role: 'user',
      is_verified: true,
    },
  });
  console.log('User created: user@example.com / TempPassword123!');
  await prisma.\$disconnect();
})();
"
```

**Option 3: Bulk Import**
Create `users.csv`:

```csv
email,name,role
john@example.com,John Doe,user
jane@example.com,Jane Smith,user
admin@example.com,Admin User,admin
```

Import:

```bash
cd backend
npm run import:users -- --file=../users.csv
```

---

## 📊 Admin Dashboard

### Login as Admin

1. Go to `http://localhost:3000/admin`
2. Email: admin@advanciapayledger.com
3. Password: (from setup step)

### Admin Features

- 👥 User Management
- 💳 Payment Tracking
- 📧 Support Tickets
- 🛡️ Guardian AI Dashboard
- 📊 Analytics & Reports
- ⚙️ System Settings

---

## 🔧 Common Issues & Fixes

### "Port already in use"

```bash
# Kill process on port 4000
npx kill-port 4000

# Kill process on port 3000
npx kill-port 3000

# Then relaunch
node launch.js
```

### "Database connection failed"

```bash
# Check PostgreSQL running
pg_isready

# If not, start it
# Windows: Start PostgreSQL service
# Linux: systemctl start postgresql
# Docker: docker-compose up -d postgres
```

### "Module not found"

```bash
# Reinstall dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### "Guardian AI not starting"

```bash
# Install dependencies
cd backend && npm install nodemailer axios

# Add database tables
psql -U postgres -d advancia -f prisma/migrations/add_guardian_tables.sql

# Check logs
pm2 logs advancia-backend | grep Guardian
```

---

## 📈 Usage Monitoring

### Check User Activity

```bash
# Total users
psql -U postgres -d advancia -c "SELECT COUNT(*) FROM \"User\";"

# Active users (last 7 days)
psql -U postgres -d advancia -c "
  SELECT COUNT(*) FROM \"User\"
  WHERE last_login_at >= NOW() - INTERVAL '7 days';
"

# Today's signups
psql -U postgres -d advancia -c "
  SELECT COUNT(*) FROM \"User\"
  WHERE created_at >= CURRENT_DATE;
"
```

### Check System Health

```bash
# Guardian AI dashboard
curl http://localhost:4000/api/guardian/status | jq

# Status page
curl http://localhost/status | jq

# PM2 monitoring
pm2 monit
```

---

## 🎯 Next Steps for Users

1. **Onboarding**: Users see interactive tour on first login
2. **Complete Profile**: Fill in payment details, preferences
3. **Start Using Features**:
   - Create transactions
   - Manage wallets
   - Track rewards
   - View analytics
4. **Upgrade to Pro**: More features, higher limits
5. **Invite Team**: Referral program rewards

---

## 💰 Payment Setup

### Stripe (Credit Cards)

```bash
# Get API keys from dashboard.stripe.com
# Add to backend/.env:
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Test webhook
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

### Crypto Payments

```bash
# Already configured! Supports:
# - Bitcoin
# - Ethereum
# - USDC

# Users pay → Crypto monitoring auto-confirms → Access granted
```

### Manual Payments

```bash
# Bank transfer, wire, cash
# Admin records in dashboard
# User gets receipt email automatically
```

---

## 🚀 Scale When Ready

### Add More Servers

```bash
# Load balancer (Nginx)
# Multiple backend instances (PM2 cluster mode)
pm2 start ecosystem.config.js -i max

# Database read replicas
# Redis caching layer
npm install ioredis
```

### CDN for Frontend

```bash
# Cloudflare CDN
# Already configured!
# Just update DNS to point to Cloudflare
```

### Monitoring & Alerts

```bash
# Guardian AI handles automatically:
# - Email alerts
# - Slack notifications
# - SMS (optional)
# - Real-time dashboard
```

---

## 📞 Support

### For Solo Operators

- Check `GUARDIAN_AI_SETUP.md` for monitoring
- Review `AUTOMATION_STACK.md` for workflows
- See `AUTOMATION_QUICK_REFERENCE.md` for commands

### For Users

- Email: support@advanciapayledger.com
- Help Center: /help
- Live Chat: Bottom right corner (AI chatbot)

---

**🎉 Your SaaS is ready for users!**

**Launch command:** `node launch.js`  
**Access:** http://localhost:3000  
**Admin:** http://localhost:3000/admin

**Zero downtime. Self-monitoring. Human-supervised.**

**Focus on your users, not operations.** 🚀

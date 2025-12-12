# 🚀 Advancia SaaS Platform - README

**Self-hosted, self-monitoring SaaS with Guardian AI protection**

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm run setup

# 2. Configure database
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Setup database
npm run setup:db

# 4. Create admin user
npm run seed:admin

# 5. Launch platform
npm run launch
```

**Access:**

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Admin: http://localhost:3000/admin

---

## 📚 Documentation

- **[LAUNCH_GUIDE_FOR_USERS.md](./LAUNCH_GUIDE_FOR_USERS.md)** - How to launch and make accessible
- **[GUARDIAN_AI_SETUP.md](./GUARDIAN_AI_SETUP.md)** - Self-monitoring AI setup
- **[AUTOMATION_STACK.md](./AUTOMATION_STACK.md)** - Full automation workflows
- **[AUTOMATION_QUICK_REFERENCE.md](./AUTOMATION_QUICK_REFERENCE.md)** - Command cheat sheet

---

## 🛡️ Guardian AI Features

- ✅ Auto-blocks malicious IPs
- ✅ Detects SQL injection, XSS, DDoS
- ✅ Monitors API key leaks
- ✅ Auto-restarts on memory leaks
- ✅ Emails critical alerts
- ✅ Provides guided error fixes
- ✅ 24/7 health monitoring

---

## 💳 Payment Methods Supported

- ✅ Stripe (Credit Cards)
- ✅ Bitcoin
- ✅ Ethereum
- ✅ USDC Stablecoin
- ✅ Bank Transfer
- ✅ Wire Transfer
- ✅ Cash/Check

---

## 🎯 Key Commands

```bash
npm run launch      # Launch all services
npm run stop        # Stop all services
npm run restart     # Restart all services
npm run logs        # View logs
npm run monit       # Monitor processes
npm run health      # Health check
npm run status      # Status page
```

---

## 🏗️ Architecture

```
Frontend (Next.js 14) → Backend (Express + Prisma) → PostgreSQL
                     ↓
               Guardian AI
                     ↓
          Status Page + Monitoring
```

---

## 📊 Admin Dashboard Features

- 👥 User Management
- 💳 Payment Tracking (Stripe + Crypto + Manual)
- 📧 Support Tickets
- 🛡️ Guardian AI Monitoring
- 📊 Analytics & Reports
- ⚙️ System Settings
- 🔐 Security Incidents
- 📈 Revenue Dashboard

---

## 🔒 Security

- JWT authentication
- 2FA/TOTP support
- Rate limiting
- IP blocking
- API key leak detection
- SQL injection prevention
- XSS protection
- DDoS mitigation
- Automated vulnerability scanning

---

## 📈 Scalability

- PM2 cluster mode
- Redis caching (optional)
- PostgreSQL read replicas
- Cloudflare CDN
- Nginx load balancing
- Horizontal scaling ready

---

## 🤝 Support

- Email: support@advanciapayledger.com
- Documentation: /docs
- Status: http://localhost/status

---

## 📄 License

MIT License - See LICENSE file

---

**Built with ❤️ for solo SaaS operators**

**Zero downtime. Self-monitoring. Production-ready.**

🚀 Launch command: `npm run launch`

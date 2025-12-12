# 🪙 Advancia Pay Ledger

A modular fintech SaaS platform for transaction tracking, analytics, and automation.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)](https://prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 🚀 Quick Start

```bash
# Clone & Install
git clone https://github.com/muchaeljohn739337-cloud/personal-website.git
cd modular-saas-platform

# Backend
cd backend && npm install
npx prisma migrate dev
npm run dev  # → http://localhost:4000

# Frontend (new terminal)
cd frontend && npm install
npm run dev  # → http://localhost:3000
```

## 🎯 Features

- 💳 **Transaction Management** - Real-time credit/debit tracking
- 📊 **Analytics Dashboard** - Beautiful animated cards
- 🔐 **Multi-Auth** - Password, Email OTP, SMS OTP
- 🎁 **Rewards System** - User tiers & achievements
- 💰 **Token Wallet** - Digital token management
- 🔄 **Real-time Sync** - Socket.IO live updates

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js + Express + TypeScript |
| Frontend | Next.js 16 + Tailwind CSS |
| Database | PostgreSQL + Prisma ORM |
| Realtime | Socket.IO |
| Auth | JWT + OTP (Twilio) |

## 📁 Structure

```
modular-saas-platform/
├── backend/          # Express API + Prisma
├── frontend/         # Next.js Dashboard
├── docker-compose.yml
└── package.json
```

## ⚙️ Environment

Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/advancia
JWT_SECRET=your-secret-key
PORT=4000
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/auth/login` | POST | User login |
| `/api/transactions` | GET/POST | Transactions |
| `/api/users` | GET/POST | User management |

## 🐳 Docker

```bash
docker-compose up -d
```

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

Made with ❤️ for fintech innovation

# Advancia PayLedger

A modern, enterprise-grade SaaS platform with Web3 integration, AI-powered features, and comprehensive payment solutions.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5
- **Database**: PostgreSQL (via Supabase) with Prisma ORM
- **Authentication**: NextAuth.js, Web3Auth
- **Styling**: Tailwind CSS 4
- **Payments**: Stripe, LemonSqueezy, Crypto (NowPayments)
- **AI**: Anthropic Claude
- **Monitoring**: Sentry
- **Testing**: Jest, Playwright
- **Deployment**: Vercel, Cloudflare

## 📋 Prerequisites

- **Node.js**: Version 20.x
- **npm**: Version 9.x or higher
- **PostgreSQL**: Via Supabase (recommended)
- **Git**: Latest version

## 🔐 Environment Variables

### Required

| Variable          | Description                  | How to Get                                                                         |
| ----------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection string | Supabase Dashboard > Settings > Database                                           |
| `NEXTAUTH_SECRET` | NextAuth.js secret           | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXTAUTH_URL`    | Application URL              | `http://localhost:3000` (development)                                              |
| `JWT_SECRET`      | JWT secret for tokens        | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `SESSION_SECRET`  | Session secret               | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |

### Optional

- `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` - Web3 wallet features
- `STRIPE_SECRET_KEY` - Payment processing
- `ANTHROPIC_API_KEY` - AI features
- `SENTRY_DSN` - Error monitoring

See `.env.example` for the complete list.

## 📚 Available Commands

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run type-check   # Check TypeScript types
```

### Database

```bash
npx prisma generate  # Generate Prisma client
npm run prisma:migrate  # Run database migrations
npm run prisma:seed  # Seed database
npm run prisma:studio  # Open Prisma Studio
```

### Testing

```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run E2E tests
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel Dashboard
3. Deploy automatically on push to main branch

### Cloudflare

```bash
npm run build:worker
npm run deploy:worker:prod
```

## 🔒 Security

- **Never commit sensitive information** like API keys, passwords, or private keys
- All secrets should be stored in environment variables
- Rotate secrets regularly
- See [SECURITY.md](SECURITY.md) for security guidelines

## 📖 Documentation

- [Quick Start Guide](QUICK_START_GUIDE.md) - Getting started guide
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Architecture](ARCHITECTURE.md) - System architecture
- [Deployment Guide](DEPLOYMENT_CHECKLIST.md) - Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

Private project - All rights reserved.

---

**Built with ❤️ by the Advancia PayLedger Team**

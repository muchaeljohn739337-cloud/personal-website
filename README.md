# Advancia PayLedger

A modern, enterprise-grade SaaS platform with Web3 integration, AI-powered features, and comprehensive payment solutions.

## 🚀 Features

- **Authentication**: Multi-factor authentication with NextAuth.js
- **Web3 Integration**: Crypto wallet support via Web3Auth
- **Payment Processing**: Stripe, LemonSqueezy, and crypto payments
- **AI Agents**: Autonomous task execution with Claude AI
- **Admin Dashboard**: Comprehensive management console
- **Real-time Communication**: Live chat and notifications
- **Health & Rewards**: Gamification and wellness tracking
- **Security**: Enterprise-grade security with rate limiting, CSRF protection, and more

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: NextAuth.js, Web3Auth
- **Styling**: Tailwind CSS 4
- **Payments**: Stripe, LemonSqueezy, NowPayments
- **AI**: Anthropic Claude
- **Monitoring**: Sentry, Vercel Analytics
- **Testing**: Jest, Playwright, Testing Library
- **Deployment**: Vercel, Cloudflare

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js**: Version 20.x or higher
- **npm**: Version 9.x or higher
- **PostgreSQL**: Version 14+ or Supabase account
- **Git**: Latest version

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/muchaeljohn739337-cloud/personal-website.git
cd personal-website
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp env.example .env.local

# Edit .env.local with your credentials
# NEVER commit this file!
```

### 4. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Environment Variables

### Required Variables

| Variable          | Description                  | How to Get                                                                         |
| ----------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection string | Supabase Dashboard > Settings > Database                                           |
| `NEXTAUTH_SECRET` | NextAuth.js secret           | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXTAUTH_URL`    | Application URL              | `http://localhost:3000` (development)                                              |
| `JWT_SECRET`      | JWT secret for tokens        | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `SESSION_SECRET`  | Session secret               | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |

### Optional Variables

| Variable                         | Description                        | Required For         |
| -------------------------------- | ---------------------------------- | -------------------- |
| `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` | Web3Auth client ID                 | Web3 wallet features |
| `WEB3AUTH_NETWORK`               | Web3Auth network (mainnet/testnet) | Web3 wallet features |
| `STRIPE_SECRET_KEY`              | Stripe secret key                  | Payment processing   |
| `STRIPE_WEBHOOK_SECRET`          | Stripe webhook secret              | Payment webhooks     |
| `ANTHROPIC_API_KEY`              | Claude AI API key                  | AI features          |
| `SENTRY_DSN`                     | Sentry Data Source Name            | Error monitoring     |
| `CLOUDFLARE_API_TOKEN`           | Cloudflare API token               | CDN and security     |

See `env.example` for the complete list of environment variables.

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
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

### Testing

```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e     # Run E2E tests
```

### Deployment

```bash
npm run deploy:prod  # Deploy to production
npm run setup:vercel # Set up Vercel environment
npm run setup:github # Set up GitHub secrets
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Configure project settings

2. **Set Environment Variables**

   ```bash
   # Use the automated script
   npm run setup:vercel

   # Or manually in Vercel Dashboard:
   # Project Settings > Environment Variables
   ```

3. **Deploy**

   ```bash
   # Automatic deployment on push to main branch
   git push origin main

   # Or manual deployment
   npm run deploy:prod
   ```

### Cloudflare (Alternative)

```bash
# Build for Cloudflare Workers
npm run build

# Deploy to Cloudflare
wrangler deploy
```

## 🔧 Configuration

### Security Setup

1. **Rotate Secrets** (Do this immediately after cloning):

   ```bash
   # Run the secret rotation script
   .\scripts\setup-vercel-secrets.ps1
   ```

2. **Set Up Monitoring**:

   ```bash
   # Set up Sentry and analytics
   .\scripts\setup-monitoring.ps1
   ```

3. **Configure GitHub Secrets**:

   ```bash
   # Set up CI/CD secrets
   .\scripts\setup-github-secrets.ps1
   ```

### Database Configuration

The application uses PostgreSQL via Supabase. Configuration steps:

1. Create a Supabase project
2. Copy connection string to `DATABASE_URL`
3. Run migrations: `npx prisma migrate dev`
4. Enable Row Level Security (RLS) in Supabase Dashboard

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- path/to/test

# Watch mode
npm run test:watch
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

### Test Coverage

```bash
npm run test:coverage
```

Aim for 80%+ code coverage.

## 📖 Documentation

- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Security Policy](SECURITY.md) - Security guidelines
- [Architecture](ARCHITECTURE.md) - System architecture
- [API Documentation](docs/api/README.md) - API reference
- [Deployment Guide](DEPLOYMENT_CHECKLIST.md) - Production deployment

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🔒 Security

Security is a top priority. Please review our [Security Policy](SECURITY.md) for:

- Reporting vulnerabilities
- Security best practices
- Supported versions

**Never commit sensitive information** like API keys, passwords, or private keys.

## 📊 Project Status

- ✅ Core features implemented
- ✅ Authentication system complete
- ✅ Payment integration complete
- ✅ Admin dashboard complete
- ✅ AI agent system complete
- 🚧 Mobile app (in progress)
- 📋 Analytics dashboard (planned)

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and improvements.

## 📞 Support

- **Email**: support@advanciapayledger.com
- **Security**: security@advanciapayledger.com
- **GitHub Issues**: [Report a bug](https://github.com/muchaeljohn739337-cloud/personal-website/issues/new?template=bug_report.md)
- **Discussions**: [GitHub Discussions](https://github.com/muchaeljohn739337-cloud/personal-website/discussions)

## 📄 License

This project is private and proprietary. All rights reserved.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- Supabase for database infrastructure
- All contributors and supporters

---

**Built with ❤️ by the Advancia PayLedger Team**

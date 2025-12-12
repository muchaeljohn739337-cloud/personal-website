# 🚀 Quick Start Guide

## Project Setup Complete! ✅

Your project is now configured and ready to run.

## 📋 What Was Done

1. ✅ **Dependencies Installed** - All npm packages are installed
2. ✅ **Security Vulnerabilities Fixed** - All vulnerabilities resolved
3. ✅ **Prisma Client Generated** - Database client ready
4. ✅ **Development Server Started** - Running on http://localhost:3000

## 🎯 Quick Commands

### Start Development Server

```bash
npm run dev
```

Server runs at: **http://localhost:3000**

### Generate Prisma Client (if schema changes)

```bash
npx prisma generate
```

### Run Database Migrations

```bash
npm run prisma:migrate
```

### Open Prisma Studio (Database GUI)

```bash
npm run prisma:studio
```

### Generate Environment Secrets

```bash
node scripts/generate-secrets.js
```

## 🔐 Environment Variables

### Required Variables (in `.env.local` or `.env`)

```bash
# Core Secrets (generate with: node scripts/generate-secrets.js)
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here

# Database (from Supabase)
DATABASE_URL=postgresql://user:password@host:port/database

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

### Optional Variables

- `REDIS_URL` - For caching and rate limiting
- `STRIPE_SECRET_KEY` - For payment processing
- `SUPABASE_*` - For Supabase features
- `OPENAI_API_KEY` - For AI features
- `ANTHROPIC_API_KEY` - For Claude AI features

## 📁 Project Structure

```
personal-website/
├── app/              # Next.js app directory (pages & API routes)
├── components/       # React components
├── lib/              # Utility functions and configurations
├── prisma/           # Database schema and migrations
├── scripts/           # Setup and utility scripts
├── public/           # Static assets
└── .env.local        # Environment variables (create this)
```

## 🛠️ Common Tasks

### Create Admin User

```bash
npm run create-admin
```

### Run Tests

```bash
npm test              # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:watch    # Watch mode
```

### Linting & Formatting

```bash
npm run lint          # Check for errors
npm run lint:fix      # Auto-fix errors
npm run format        # Format code
```

### Build for Production

```bash
npm run build         # Build the application
npm start             # Start production server
```

## 🔍 Troubleshooting

### Server Won't Start

1. Check if port 3000 is available
2. Verify all required environment variables are set
3. Run `npm install` to ensure dependencies are installed
4. Run `npx prisma generate` to regenerate Prisma client

### Database Connection Issues

1. Verify `DATABASE_URL` is correct in `.env.local`
2. Check if database is accessible
3. Run `npm run test:db` to test connection

### Environment Variables Not Loading

- Use `.env.local` for local development (git-ignored)
- Restart the dev server after changing env vars
- Check variable names match exactly (case-sensitive)

## 📚 Additional Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Project README**: See `README.md` for more details

## 🎉 You're All Set!

Your development environment is configured and the server should be running at:
**http://localhost:3000**

Happy coding! 🚀

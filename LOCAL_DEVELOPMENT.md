# Local Development Setup Guide

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))
- **VS Code** (Recommended) ([Download](https://code.visualstudio.com/))

### 1. Install VS Code Extensions

Open VS Code and install recommended extensions:

```bash
# Press Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
# Type: "Extensions: Show Recommended Extensions"
# Click "Install All"
```

**Key Extensions:**

- GitLens (Git visualization)
- Docker (Container management)
- ESLint & Prettier (Code quality)
- Thunder Client (API testing)
- Database clients (Redis)
- Kubernetes Tools

### 2. Clone & Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/personal-website.git
cd personal-website

# Copy environment file
cp env.example .env

# Install dependencies
npm install
```

### 3. Start Infrastructure Services

```bash
# Start all services (PostgreSQL, Redis, MinIO, etc.)
docker-compose up -d

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Initialize Database

```bash
# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### 5. Start Development Servers

```bash
# Terminal 1: Start frontend (Next.js)
npm run dev

# Terminal 2: Start backend API
npm run api:dev

# Terminal 3: Start workers
npm run workers:dev
```

## 📦 Docker Services

### Running Services

| Service             | Port | URL                     | Credentials                |
| ------------------- | ---- | ----------------------- | -------------------------- |
| **Frontend**        | 3000 | <http://localhost:3000> | -                          |
| **API**             | 4000 | <http://localhost:4000> | -                          |
| **Redis**           | 6379 | localhost:6379          | devredispass               |
| **MinIO**           | 9000 | <http://localhost:9000> | minioadmin / minioadmin123 |
| **MinIO Console**   | 9001 | <http://localhost:9001> | minioadmin / minioadmin123 |
| **Mailhog**         | 8025 | <http://localhost:8025> | -                          |
| **Redis Commander** | 8081 | <http://localhost:8081> | -                          |
| **Prometheus**      | 9090 | <http://localhost:9090> | -                          |
| **Grafana**         | 3001 | <http://localhost:3001> | admin / admin123           |

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart redis

# View logs for a service
docker-compose logs -f redis

# Remove all data (WARNING: Deletes all volumes)
docker-compose down -v

# Rebuild services
docker-compose up -d --build

# Check service health
docker-compose ps
```

## 🗄️ Cache Management

### Redis

```bash
# Connect via CLI
docker exec -it dev-redis redis-cli -a devredispass

# Common commands
KEYS *              # List all keys
GET key_name        # Get value
SET key_name value  # Set value
DEL key_name        # Delete key
FLUSHALL            # Clear all data
```

**Via Redis Commander:**

- Open <http://localhost:8081>

## 🔧 Development Workflow

### Project Structure

```
personal-website/
├── app/                    # Next.js frontend
├── api/                    # Backend API (to be created)
├── workers/                # Background workers (to be created)
├── packages/               # Shared packages (to be created)
├── config/                 # Configuration files
├── docker-compose.yml      # Docker services
├── env.example             # Environment template
└── LOCAL_DEVELOPMENT.md    # This file
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- path/to/test.spec.ts
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

### API Testing

**Using Thunder Client (VS Code Extension):**

1. Install Thunder Client extension
2. Create new request
3. Set URL: <http://localhost:4000/api/>...
4. Add headers, body, etc.
5. Send request

**Using cURL:**

```bash
# Health check
curl http://localhost:4000/health

# API endpoint example
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## 🔐 Authentication Setup

### JWT Tokens

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update `.env`:

```env
JWT_SECRET=your-generated-secret
```

### OAuth Setup

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project
3. Enable Google+ API
4. Create OAuth credentials
5. Add to `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### GitHub OAuth

1. Go to [GitHub Settings > Developer settings](https://github.com/settings/developers)
2. Create OAuth App
3. Add to `.env`:

```env
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

## 💳 Stripe Setup (Billing)

1. Create account at [Stripe](https://stripe.com/)
2. Get test API keys
3. Add to `.env`:

```env
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

4. Install Stripe CLI:

```bash
# Windows (via Scoop)
scoop install stripe

# Listen to webhooks
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

## 📧 Email Testing

All emails are caught by Mailhog:

- Open <http://localhost:8025>
- View sent emails
- Test email templates

## 📊 Monitoring & Debugging

### Prometheus Metrics

- Open <http://localhost:9090>
- Query metrics: `http_requests_total`
- View targets: Status > Targets

### Grafana Dashboards

- Open <http://localhost:3001>
- Login: admin / admin123
- Import dashboards from `config/grafana/dashboards/`

### Application Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api

# Follow logs with timestamps
docker-compose logs -f --timestamps api
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Windows: Find process using port
netstat -ano | findstr :3000

# Kill process
taskkill /PID <process_id> /F
```

### Docker Issues

```bash
# Reset Docker
docker-compose down -v
docker system prune -a
docker-compose up -d

# Check Docker resources
docker stats
```

### Redis Connection Issues

```bash
# Test Redis connection
docker exec -it dev-redis redis-cli -a devredispass ping

# Should return: PONG
```

### Clear All Data

```bash
# WARNING: This deletes all data!
docker-compose down -v
rm -rf node_modules
npm install
docker-compose up -d
npm run db:migrate
npm run db:seed
```

## 🚀 Performance Tips

### Hot Reload

- Frontend: Automatic (Next.js Fast Refresh)
- Backend: Use `nodemon` (already configured)
- Workers: Restart manually or use `nodemon`

### Redis Caching

```typescript
// Example: Cache API response
const cacheKey = 'users:list';
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const users = await db.users.findMany();
await redis.setex(cacheKey, 3600, JSON.stringify(users));
return users;
```

## 📚 Additional Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Docker Docs](https://docs.docker.com/)
- [Redis Docs](https://redis.io/docs/)

### VS Code Shortcuts

- `Ctrl+Shift+P`: Command Palette
- `Ctrl+P`: Quick Open File
- `Ctrl+Shift+F`: Search in Files
- `Ctrl+Shift+D`: Debug View
- `Ctrl+J`: Toggle Terminal
- `Ctrl+B`: Toggle Sidebar

### Git Workflow

- See `GIT_SETUP.md` for complete Git workflow
- Use GitLens extension for visual Git history
- Create feature branches: `git checkout -b feature/name`

## 🆘 Getting Help

1. Check logs: `docker-compose logs -f`
2. Check service health: `docker-compose ps`
3. Review documentation in `docs/` folder
4. Check GitHub Issues
5. Ask in team chat/Slack

## ✅ Development Checklist

Before starting development:

- [ ] Docker Desktop is running
- [ ] All services are up: `docker-compose ps`
- [ ] Environment variables are set (`.env` file)
- [ ] Database is migrated: `npm run db:migrate`
- [ ] VS Code extensions are installed
- [ ] Frontend is running: <http://localhost:3000>
- [ ] API is running: <http://localhost:4000>
- [ ] Can access Redis Commander: <http://localhost:8081>

Happy coding! 🎉

# Advancia Pay Ledger - Backend API

Real-time transaction processing backend with WebSocket support and Prisma ORM.

## ✅ Setup Status

- ✅ Express.js server configured
- ✅ Socket.IO for real-time updates
- ✅ TypeScript compilation working
- ✅ Prisma schema created (5 models)
- ✅ Prisma client generated
- ⏸️ Database migration pending (see [PRISMA_SETUP.md](./PRISMA_SETUP.md))

## Quick Start

### 1. Install Dependencies

```powershell
npm install
```

### 2. Set Up Database

**See [PRISMA_SETUP.md](./PRISMA_SETUP.md) for detailed options.**

**Quick Docker Setup (Recommended):**

```powershell

# Start PostgreSQL container

docker run --name advancia-postgres `
  -e POSTGRES_USER=dev_user `
  -e POSTGRES_PASSWORD=dev_password `
  -e POSTGRES_DB=advancia_ledger `
  -p 5432:5432 `
  -d postgres:14-alpine

# Run database migration

npx prisma migrate dev --name init
```

**Alternative: SQLite (Quick Development)**

```powershell

# Edit prisma/schema.prisma - change provider to "sqlite"

# Then run:

npx prisma migrate dev --name init
```

### 3. Configure Environment

Create `.env` file (or copy from `.env.example`):

```env
DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/advancia_ledger?schema=public"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV=development

# Stripe (optional but required for payments route)

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Start Development Server

```powershell
npm run dev
```

Server starts on `[Link](http://localhost:4000`)

### 5. Verify Setup

```powershell

# Test health endpoint

curl http://localhost:4000/health

# Open database GUI

npx prisma studio
```

## API Endpoints

### Health Check

```http
GET /health
```

Returns server status and uptime.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

### Create Transaction

```http
POST /api/transaction
Content-Type: application/json

{
  "userId": "user-123",
  "amount": 50.00,
  "type": "credit",
  "description": "Salary deposit"
}
```

**Response:**

```json
{
  "id": "uuid",
  "userId": "user-123",
  "amount": 50.0,
  "type": "credit",
  "status": "pending",
  "description": "Salary deposit",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get Recent Transactions

```http
GET /api/transactions/recent/:userId
```

Returns the last 10 transactions for a user.

**Response:**

```json
[
  {
    "id": "uuid",
    "userId": "user-123",
    "amount": 50.0,
    "type": "credit",
    "status": "completed",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
]
```

### Get All User Transactions

```http
GET /api/transactions/user/:userId
```

Returns all transactions for a user.

### Get User Balance

```http
GET /api/transactions/balance/:userId
```

**Response:**

```json
{
  "userId": "user-123",
  "balance": 450.75
}
```

### Create Stripe Checkout Session

```http
POST /api/payments/checkout-session
Content-Type: application/json

{
  "amount": 49.99,
  "currency": "usd",
  "metadata": {
    "userId": "user-123",
    "email": "customer@example.com"
  }
}
```

**Response:**

```json
{
  "id": "cs_test_a1B2...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1B2..."
}
```

> Requires `STRIPE_SECRET_KEY` to be present. Returns 503 if payments are disabled.

### Save Recovery QR Snapshot

```http
POST /api/recovery/qr
Content-Type: application/json

{
  "walletId": "1",
  "address": "bc1q...",
  "qrDataUrl": "data:image/png;base64,iVBOR...",
  "userId": "user-123"
}
```

Currently stores payload in application logs (plug in secure storage later).

## WebSocket Events

### Client → Server

**Join User Room**

```javascript
socket.emit("join-room", userId);
```

### Server → Client

**New Transaction**

```javascript
socket.on("transaction-created", (transaction) => {
  console.log("New transaction:", transaction);
});
```

**Global Transaction Broadcast**

```javascript
socket.on("global-transaction", (transaction) => {
  console.log("Transaction broadcast:", transaction);
});
```

## Database Schema

The backend uses Prisma ORM with the following models:

### User

- Authentication and profile management
- Relations to transactions and debit cards

### Transaction

- Financial transaction records
- Decimal precision for amounts
- Status tracking (pending, completed, failed)

### DebitCard

- Virtual/physical card management
- Balance and daily limit tracking

### Session

- User session management
- Token-based authentication

### AuditLog

- Compliance and activity tracking
- JSON storage for flexible logging

See `prisma/schema.prisma` for full schema definition.

## Development

### Build Project

```powershell
npm run build
```

Compiles TypeScript to `dist/` folder.

### Start Production

```powershell
npm start
```

Runs compiled JavaScript from `dist/`.

### Prisma Commands

```powershell

# Generate Prisma Client (after schema changes)

npm run prisma:generate

# Create migration

npm run prisma:migrate

# Open Prisma Studio

npm run prisma:studio

# Reset database (⚠️ deletes all data)

npx prisma migrate reset
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Server entry point
│   ├── routes/
│   │   └── transaction.ts    # Transaction API routes
│   └── types/
│       └── transaction.ts    # TypeScript types
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Migration history
├── dist/                     # Compiled JavaScript
├── .env                      # Environment variables
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies

```

## Environment Variables

```env

# Database

DATABASE_URL="postgresql://user:password@localhost:5432/advancia_ledger"

# Server

PORT=4000
NODE_ENV=development

# Frontend CORS

FRONTEND_URL="http://localhost:3000"

# Optional: JWT & Session

JWT_SECRET="your-secret-key"
SESSION_SECRET="your-session-secret"
```

## Testing

Use the automated test suite:

```powershell

# From project root

.\START-HEALTH-TEST.bat
```

This will:

1. Start the backend server in a new terminal
2. Wait for startup
3. Run health checks
4. Test all API endpoints

## Troubleshooting

### Database Connection Failed

```
Error: P1000: Authentication failed
```

**Solution:**

- Verify PostgreSQL is running: `Get-Service postgresql*`
- Check DATABASE_URL in `.env`
- For Docker: `docker ps` to verify container is running
- See [PRISMA_SETUP.md](./PRISMA_SETUP.md) for setup help

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution:**

```powershell

# Find process using port 4000

netstat -ano | findstr :4000

# Kill process (replace PID)

taskkill /PID <pid> /F
```

### Prisma Client Not Generated

```
Error: Cannot find module '@prisma/client'
```

**Solution:**

```powershell
npx prisma generate
```

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.21
- **Language**: TypeScript 5.9
- **Database ORM**: Prisma 5.22
- **WebSocket**: Socket.IO 4.8
- **Database**: PostgreSQL 14+ (or SQLite for dev)

## API Documentation

For detailed API testing with Postman/Thunder Client, see the test collection in `START-HEALTH-TEST.bat`.

## Contributing

1. Make changes to source code in `src/`
2. Update schema if database changes needed
3. Run `npx prisma migrate dev --name <description>`
4. Test with `npm run dev`
5. Build with `npm run build`

## License

MIT

## Support

For issues and questions:

- **GitHub Repository**: [modular-saas-platform](https://github.com/muchaeljohn739337-cloud/modular-saas-platform)
- **Report Issues**: [GitHub Issues](https://github.com/muchaeljohn739337-cloud/modular-saas-platform/issues)
- **Documentation**: See `/docs` folder for detailed guides
- Check [PRISMA_SETUP.md](./PRISMA_SETUP.md) for database setup
- Review API endpoints documentation above
- Check environment variables are correct
- Verify all dependencies installed: `npm install`

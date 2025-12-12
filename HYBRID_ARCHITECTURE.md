# Hybrid Backend Architecture: Node.js + .NET 9

## Overview

The Advancia Pay Ledger platform now features a **hybrid backend architecture** combining:

- **Node.js/Express** for real-time features and lightweight operations
- **ASP.NET Core 9** for enterprise security and Azure-native integrations

Both backends share the same:

- PostgreSQL database
- Redis cache
- JWT authentication tokens
- CORS configuration

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│         (Next.js 14 - App Router + HTML/JS Pages)           │
└────────────────┬──────────────────┬─────────────────────────┘
                 │                  │
                 ▼                  ▼
    ┌────────────────────┐  ┌──────────────────────┐
    │   Node.js Backend  │  │   .NET Core Backend  │
    │   (Express + TS)   │  │   (ASP.NET Core 9)   │
    │   Port: 4000       │  │   Port: 5001         │
    │   Real-time/WS     │  │   Secure/Azure       │
    └──────────┬─────────┘  └──────────┬───────────┘
               │                       │
               └───────────┬───────────┘
                           ▼
              ┌────────────────────────┐
              │  Shared Data Layer     │
              │  • PostgreSQL (Prisma) │
              │  • Redis Cache         │
              │  • JWT Tokens          │
              └────────────────────────┘
```

## When to Use Each Backend

### Node.js Backend (`backend/`)

**Best for:**

- ✅ Real-time features (Socket.IO)
- ✅ WebSocket connections
- ✅ File uploads with Multer
- ✅ Push notifications
- ✅ Email services
- ✅ Lightweight API endpoints
- ✅ Stripe webhooks (raw body handling)

**Tech Stack:**

- Express.js + TypeScript
- Prisma ORM
- Socket.IO for real-time
- Nodemailer, web-push
- JWT (jsonwebtoken)

**Runs on:** http://localhost:4000 (dev)

### .NET Core Backend (`backend-dotnet/`)

**Best for:**

- ✅ High-security financial transactions
- ✅ Complex business logic
- ✅ Azure-native services (Key Vault, App Insights)
- ✅ Enterprise reporting
- ✅ Batch processing
- ✅ RBAC with Azure AD
- ✅ Compliance and audit logs

**Tech Stack:**

- ASP.NET Core 9
- Entity Framework Core
- Serilog logging
- Azure Identity
- JWT (Microsoft.IdentityModel.Tokens)
- BCrypt.Net

**Runs on:** https://localhost:5001 (dev)

## Shared Components

### 1. Database Schema (PostgreSQL)

Both backends access the same database:

- **Node.js**: Uses Prisma schema (`backend/prisma/schema.prisma`)
- **.NET**: Uses EF Core models (`backend-dotnet/AdvanciaApp/Models/Entities.cs`)

**Key Tables:**

- `User` - User accounts and authentication
- `Transaction` - Financial transactions
- `TokenWallet` - Cryptocurrency wallets
- `Reward` - User rewards and bonuses
- `AuditLog` - Security audit trail

### 2. JWT Authentication

Both backends generate and validate the same JWT tokens:

```typescript
// Node.js (backend/src/middleware/auth.ts)
const token = jwt.sign({ userId, email, role }, process.env.JWT_SECRET, {
  expiresIn: "24h",
});
```

```csharp
// .NET (backend-dotnet/AdvanciaApp/Services/AuthService.cs)
var token = tokenHandler.CreateToken(new SecurityTokenDescriptor {
    Subject = new ClaimsIdentity(new[] {
        new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
        new Claim(ClaimTypes.Email, email),
        new Claim(ClaimTypes.Role, role)
    }),
    Expires = DateTime.UtcNow.AddHours(24)
});
```

**Important:** `JWT_SECRET` must be identical in both backends!

### 3. Password Hashing (BCrypt)

Both backends use BCrypt with 10 salt rounds:

```typescript
// Node.js
const hash = await bcrypt.hash(password, 10);
```

```csharp
// .NET
var hash = BCrypt.Net.BCrypt.HashPassword(password, 10);
```

### 4. CORS Configuration

Both backends allow the same origins:

- `http://localhost:3000` (Next.js dev)
- `http://localhost:3001` (alternative dev)
- `https://advanciapayledger.com` (production)
- `https://www.advanciapayledger.com` (production)

## Integration Patterns

### Pattern 1: Authentication Flow

1. Frontend → Node.js `/api/auth/login`
2. Node.js validates credentials, generates JWT
3. Frontend can now call **either** backend with same token
4. Both backends validate JWT identically

### Pattern 2: Transaction Processing

1. User initiates transaction on frontend
2. Frontend → .NET `/api/transactions` (secure processing)
3. .NET creates transaction in shared database
4. Node.js Socket.IO emits real-time update
5. Frontend receives instant notification

### Pattern 3: File Upload + Processing

1. Frontend → Node.js `/api/files/upload` (Multer)
2. Node.js stores file, creates database record
3. .NET batch job processes uploaded files
4. .NET updates status in shared database

## Environment Configuration

### Node.js Backend (`.env`)

```bash
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/advancia_ledger
JWT_SECRET=your-shared-secret-here
REDIS_URL=redis://localhost:6379
```

### .NET Backend (`appsettings.json` + User Secrets)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=advancia_ledger;...",
    "Redis": "localhost:6379"
  }
}
```

```powershell
dotnet user-secrets set "JWT_SECRET" "your-shared-secret-here"
```

## Deployment Strategy

### Development

```powershell
# Terminal 1: Node.js backend
cd backend
npm run dev

# Terminal 2: .NET backend
cd backend-dotnet/AdvanciaApp
dotnet run

# Terminal 3: Frontend
cd frontend
npm run dev
```

### Production

#### Node.js (Render.com)

```yaml
# render.yaml
services:
  - name: advancia-api-nodejs
    type: web
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
```

#### .NET (Azure App Service)

```powershell
.\scripts\Deploy-DotNetToAzure.ps1 `
    -AppName "AdvanciaAppCore" `
    -ResourceGroup "advancia-resources"
```

## API Gateway Pattern (Optional)

For unified API access, consider adding an API Gateway:

```
Frontend → API Gateway (Nginx/Kong) → {
    /api/v1/node/* → Node.js Backend
    /api/v1/net/* → .NET Backend
}
```

Example Nginx config:

```nginx
location /api/v1/node/ {
    proxy_pass http://nodejs-backend:4000/api/;
}

location /api/v1/net/ {
    proxy_pass http://dotnet-backend:5001/api/;
}
```

## Monitoring & Observability

### Node.js

- **Logs**: Console + Morgan middleware
- **Errors**: Try-catch with response codes
- **Metrics**: Custom Socket.IO events

### .NET

- **Logs**: Serilog (console + files)
- **Errors**: ErrorHandlingMiddleware
- **Metrics**: Azure Application Insights (production)

### Shared Monitoring

- **Database**: PostgreSQL logs and metrics
- **Cache**: Redis INFO command
- **Health Checks**:
  - Node.js: `GET /api/health`
  - .NET: `GET /api/health`

## Migration Path

To gradually migrate features from Node.js to .NET:

1. **Phase 1**: Run both backends in parallel (current state)
2. **Phase 2**: Migrate high-security endpoints to .NET
3. **Phase 3**: Keep Node.js for real-time/WebSocket
4. **Phase 4**: Final architecture with clear separation

## Security Considerations

### Both Backends Must:

- ✅ Validate JWT tokens with same secret
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Log security events to AuditLog table
- ✅ Handle CORS properly
- ✅ Sanitize user input
- ✅ Use parameterized queries (Prisma/EF Core)

### .NET Specific Security:

- Azure Managed Identity for Key Vault
- Azure AD B2C integration
- Built-in CSRF protection
- Automatic HTTPS redirection

### Node.js Specific Security:

- Helmet.js for headers
- express-validator for input
- CORS with credentials
- Raw body handling for webhooks

## Testing Strategy

### Node.js

```bash
cd backend
npm test
```

### .NET

```powershell
cd backend-dotnet
dotnet test
```

### Integration Tests

Create tests that verify:

- JWT tokens work across both backends
- Database writes from one backend are visible to the other
- Real-time events trigger correctly

## Troubleshooting

### JWT Token Issues

**Problem**: Token valid in Node.js but fails in .NET
**Solution**: Verify `JWT_SECRET` is identical in both:

```powershell
# Compare secrets
echo $env:JWT_SECRET  # Node.js
dotnet user-secrets list  # .NET
```

### Database Connection Issues

**Problem**: EF Core can't connect but Prisma works
**Solution**: Check connection string format (EF Core uses different syntax):

```
Node.js: postgresql://user:pass@host:5432/db
.NET:    Host=host;Port=5432;Database=db;Username=user;Password=pass
```

### CORS Errors

**Problem**: Frontend can't call .NET backend
**Solution**: Ensure CORS origins match exactly:

```json
// Both backends
["http://localhost:3000", "https://advanciapayledger.com"]
```

## Performance Optimization

### Node.js

- Enable clustering for multi-core CPUs
- Use Redis for session storage
- Implement request caching

### .NET

- Enable response compression
- Use async/await everywhere
- Configure connection pooling

### Database

- Index frequently queried columns
- Use connection pooling (both backends support this)
- Regular VACUUM on PostgreSQL

## Future Enhancements

1. **API Gateway**: Unified entry point for both backends
2. **Service Mesh**: Istio/Linkerd for inter-service communication
3. **Event Bus**: RabbitMQ/Azure Service Bus for async messaging
4. **GraphQL Layer**: Federation over both backends
5. **Kubernetes**: Container orchestration for both services

## Questions & Support

For hybrid architecture questions:

- Check `backend/README.md` for Node.js specifics
- Check `backend-dotnet/README.md` for .NET specifics
- Review `DOCUMENTATION_INDEX.md` for all guides

---

**Built with ❤️ using Node.js + .NET 9**

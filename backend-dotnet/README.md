# Advancia .NET Core Backend (.NET 9)

Enterprise-grade ASP.NET Core 9 API backend for the Advancia Pay Ledger platform, designed for optimal Azure integration and security.

## 🏗️ Architecture Overview

This .NET backend complements the existing Node.js backend, providing:

- **Enhanced security** with Azure-native services
- **Enterprise scalability** with Azure App Service
- **High-performance** transaction processing
- **JWT authentication** compatible with Node.js backend
- **Shared PostgreSQL database** via Entity Framework Core

## 📁 Project Structure

```
backend-dotnet/
├── AdvanciaApp/
│   ├── Controllers/          # API endpoints
│   │   ├── AuthController.cs
│   │   ├── TransactionsController.cs
│   │   └── HealthController.cs
│   ├── Services/             # Business logic
│   │   ├── AuthService.cs
│   │   ├── UserService.cs
│   │   ├── TransactionService.cs
│   │   └── RedisCacheService.cs
│   ├── Models/               # Data models (EF Core)
│   │   └── Entities.cs
│   ├── Data/                 # Database context
│   │   └── AdvanciaDbContext.cs
│   ├── Middleware/           # Custom middleware
│   │   └── ErrorHandlingMiddleware.cs
│   ├── Program.cs            # Application entry point
│   ├── appsettings.json      # Configuration
│   └── AdvanciaApp.csproj    # Project file
└── AdvanciaApp.sln           # Solution file
```

## 🚀 Quick Start

### Prerequisites

- .NET 9 SDK: `winget install Microsoft.DotNet.SDK.9`
- Azure CLI: `winget install Microsoft.AzureCLI`
- PostgreSQL database (shared with Node.js backend)

### Local Development

1. **Restore dependencies:**

   ```powershell
   cd backend-dotnet/AdvanciaApp
   dotnet restore
   ```

2. **Configure environment:**

   ```powershell
   # Set user secrets for local development
   dotnet user-secrets set "JWT_SECRET" "your-jwt-secret-here"
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=advancia_ledger;Username=postgres;Password=your-password"
   ```

3. **Run migrations:**

   ```powershell
   dotnet ef database update
   ```

4. **Start the API:**

   ```powershell
   dotnet run
   ```

   API will be available at `https://localhost:5001`

### View API Documentation

Once running, access Swagger UI at: `https://localhost:5001/swagger`

## ☁️ Azure Deployment

### Option 1: Quick Deploy with Script

```powershell
# Deploy to Azure App Service (B1 tier)
.\scripts\Deploy-DotNetToAzure.ps1 `
    -ResourceGroup "advancia-resources" `
    -AppName "AdvanciaAppCore" `
    -Location "eastus" `
    -Sku "B1"
```

### Option 2: Manual Azure CLI

```powershell
# Build and publish
cd backend-dotnet/AdvanciaApp
dotnet publish -c Release -o ./publish

# Deploy to Azure
az webapp up `
    --sku B1 `
    --name AdvanciaAppCore `
    --resource-group advancia-resources `
    --location eastus
```

### Configure Production Secrets

```powershell
.\scripts\Configure-AzureSecrets.ps1 `
    -AppName "AdvanciaAppCore" `
    -ResourceGroup "advancia-resources" `
    -DatabaseUrl "Host=your-db.postgres.database.azure.com;Port=5432;Database=advancia_ledger;..." `
    -JwtSecret "your-production-jwt-secret" `
    -RedisUrl "your-redis.redis.cache.windows.net:6380,ssl=True"
```

## 🔐 Security Features

- **JWT Authentication**: Compatible with Node.js tokens
- **BCrypt password hashing**: Cross-compatible with Node.js bcrypt
- **Role-based authorization**: `[Authorize(Roles = "admin")]`
- **CORS protection**: Configured for production origins
- **HTTPS enforcement**: Automatic redirect
- **Azure Managed Identity**: No hardcoded credentials
- **Request logging**: Serilog integration
- **Error handling**: Secure exception middleware

## 🔄 Database Integration

### Shared Schema with Node.js Backend

Entity Framework Core models match the Prisma schema from Node.js backend:

- `User`, `Transaction`, `TokenWallet`, `TokenTransaction`
- `Reward`, `UserTier`, `AuditLog`, `Notification`

### Run Migrations

```powershell
# Create new migration
dotnet ef migrations add MigrationName

# Apply migrations
dotnet ef database update

# Revert migration
dotnet ef database update PreviousMigrationName
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user (requires auth)

### Transactions

- `GET /api/transactions` - List user transactions (requires auth)
- `GET /api/transactions/{id}` - Get transaction details (requires auth)
- `POST /api/transactions` - Create transaction (requires auth)
- `PATCH /api/transactions/{id}/status` - Update status (admin only)

### Health Checks

- `GET /api/health` - Application health
- `GET /health` - Liveness probe
- `GET /api/health/ready` - Readiness probe

## 🔧 Configuration

### appsettings.json

```json
{
  "AllowedOrigins": [
    "https://advanciapayledger.com",
    "https://www.advanciapayledger.com"
  ],
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=advancia_ledger;...",
    "Redis": "localhost:6379"
  }
}
```

### Environment Variables (Azure)

- `JWT_SECRET` - JWT signing key (must match Node.js backend)
- `ConnectionStrings__DefaultConnection` - PostgreSQL connection
- `ConnectionStrings__Redis` - Redis cache connection
- `ASPNETCORE_ENVIRONMENT` - Environment (Production/Development)

## 🧪 Testing

```powershell
# Run unit tests
dotnet test

# Test specific endpoint
Invoke-RestMethod -Uri "https://localhost:5001/api/health" -Method GET
```

## 🔄 Hybrid Architecture: Node.js + .NET

### When to Use .NET Backend

- ✅ High-security financial transactions
- ✅ Complex business logic
- ✅ Azure-native integrations
- ✅ Enterprise reporting
- ✅ Batch processing jobs

### When to Use Node.js Backend

- ✅ Real-time features (Socket.IO)
- ✅ WebSocket connections
- ✅ Lightweight API endpoints
- ✅ File uploads
- ✅ Notification services

### Shared Components

- **Database**: Same PostgreSQL instance
- **Redis**: Shared cache layer
- **JWT Tokens**: Cross-compatible authentication
- **CORS Origins**: Same allowed origins

## 📊 Monitoring & Logging

### Serilog Configuration

Logs are written to:

- Console (structured JSON in production)
- Files: `logs/advancia-{Date}.txt`

### Azure Application Insights

Automatically enabled in production for:

- Request telemetry
- Exception tracking
- Performance metrics
- Dependency tracking

## 🛠️ Development Tools

### VS Code Extensions (Recommended)

- C# Dev Kit
- Azure App Service
- REST Client

### Visual Studio 2022

Full support with solution file: `AdvanciaApp.sln`

## 📝 Adding BCrypt Package

The project requires BCrypt.Net for password hashing:

```powershell
cd backend-dotnet/AdvanciaApp
dotnet add package BCrypt.Net-Next
```

Update `.csproj`:

```xml
<PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
```

## 🚨 Troubleshooting

### Database Connection Issues

```powershell
# Test database connectivity
dotnet ef dbcontext info
```

### JWT Token Compatibility

Ensure `JWT_SECRET` matches Node.js backend exactly:

```powershell
dotnet user-secrets set "JWT_SECRET" "$(cat ../backend/.env | grep JWT_SECRET | cut -d '=' -f2)"
```

### CORS Errors

Add origin to `appsettings.json` `AllowedOrigins` array

## 📚 Additional Resources

- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core)
- [Entity Framework Core](https://docs.microsoft.com/ef/core)
- [Azure App Service](https://docs.microsoft.com/azure/app-service)
- [Serilog](https://serilog.net/)

## 🤝 Integration with Frontend

Frontend can call either backend:

```javascript
// Node.js backend (existing)
const response = await fetch(
  "https://api.advanciapayledger.com/api/auth/login",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }
);

// .NET backend (new)
const response = await fetch(
  "https://advanciaappcore.azurewebsites.net/api/auth/login",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }
);
```

JWT tokens are interchangeable between both backends.

---

**Built with ❤️ using ASP.NET Core 9 and Azure**

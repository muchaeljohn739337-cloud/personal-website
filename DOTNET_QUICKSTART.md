# 🚀 Quick Start: ASP.NET Core 9 Backend for Advancia

## Prerequisites

Install .NET 9 SDK:

```powershell
winget install Microsoft.DotNet.SDK.9
```

## Setup & Run (5 minutes)

1. **Navigate to .NET backend:**

   ```powershell
   cd backend-dotnet/AdvanciaApp
   ```

2. **Restore packages:**

   ```powershell
   dotnet restore
   ```

3. **Set JWT secret (match Node.js backend):**

   ```powershell
   dotnet user-secrets set "JWT_SECRET" "your-secret-from-node-backend"
   ```

4. **Configure database connection:**

   ```powershell
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=advancia_ledger;Username=postgres;Password=your-password"
   ```

5. **Run the API:**

   ```powershell
   dotnet run
   ```

6. **Test the API:**
   - Open browser: https://localhost:5001/swagger
   - Or test endpoint: https://localhost:5001/api/health

## Deploy to Azure (2 commands)

```powershell
# Login to Azure
az login

# Deploy with script
.\scripts\Deploy-DotNetToAzure.ps1 -AppName "AdvanciaAppCore"
```

## Architecture Summary

**Two backends, one database:**

- **Node.js** (`backend/`) → Real-time, WebSocket, file uploads
- **.NET 9** (`backend-dotnet/`) → Secure transactions, Azure services
- **Shared**: PostgreSQL, Redis, JWT tokens

See `HYBRID_ARCHITECTURE.md` for complete details.

## Key Files

- `Program.cs` - Application startup & middleware
- `Controllers/` - API endpoints
- `Services/` - Business logic
- `Models/Entities.cs` - Database models (matches Prisma)
- `Data/AdvanciaDbContext.cs` - EF Core context

## API Endpoints

```
POST   /api/auth/login          - Login user
POST   /api/auth/register       - Register user
GET    /api/auth/me            - Get current user (auth required)
GET    /api/transactions       - List transactions (auth required)
POST   /api/transactions       - Create transaction (auth required)
GET    /api/health             - Health check
```

## Next Steps

1. ✅ Review `backend-dotnet/README.md` for full documentation
2. ✅ Check `HYBRID_ARCHITECTURE.md` for integration patterns
3. ✅ Configure Azure secrets: `.\scripts\Configure-AzureSecrets.ps1`
4. ✅ Run migrations: `dotnet ef database update`

---

**Need help?** Check the main documentation or open an issue.

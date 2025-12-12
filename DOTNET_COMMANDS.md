# 🚀 .NET Backend Command Reference Card

## Quick Commands

### Start Development

```powershell
cd backend-dotnet/AdvanciaApp
dotnet run
```

**Access:** https://localhost:5001/swagger

### Install Dependencies

```powershell
dotnet restore
```

### Build Project

```powershell
dotnet build
```

### Run Tests

```powershell
dotnet test
```

## Configuration

### Set JWT Secret

```powershell
dotnet user-secrets set "JWT_SECRET" "your-secret-here"
```

### Set Database Connection

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=advancia_ledger;Username=postgres;Password=your-password"
```

### View All Secrets

```powershell
dotnet user-secrets list
```

## Database Migrations

### Create Migration

```powershell
dotnet ef migrations add MigrationName
```

### Apply Migrations

```powershell
dotnet ef database update
```

### Revert Migration

```powershell
dotnet ef database update PreviousMigrationName
```

### View Migration Status

```powershell
dotnet ef migrations list
```

### Remove Last Migration (if not applied)

```powershell
dotnet ef migrations remove
```

## Azure Deployment

### Quick Deploy

```powershell
.\scripts\Deploy-DotNetToAzure.ps1
```

### Custom Deploy

```powershell
.\scripts\Deploy-DotNetToAzure.ps1 `
    -AppName "MyAppName" `
    -ResourceGroup "my-resources" `
    -Location "eastus" `
    -Sku "B1"
```

### Configure Secrets

```powershell
.\scripts\Configure-AzureSecrets.ps1 `
    -AppName "MyAppName" `
    -DatabaseUrl "Host=..." `
    -JwtSecret "secret"
```

### View Azure Resources

```powershell
az resource list --resource-group advancia-resources
```

## Development Tools

### Hot Reload

```powershell
dotnet watch run
```

### Clean Build

```powershell
dotnet clean
dotnet build
```

### Publish for Production

```powershell
dotnet publish -c Release -o ./publish
```

## Debugging

### View Database Context Info

```powershell
dotnet ef dbcontext info
```

### Generate SQL Script from Migrations

```powershell
dotnet ef migrations script
```

### Scaffold DbContext from Existing Database

```powershell
dotnet ef dbcontext scaffold "Host=localhost;..." Npgsql.EntityFrameworkCore.PostgreSQL -o Models
```

## Package Management

### Add Package

```powershell
dotnet add package PackageName
```

### Update All Packages

```powershell
dotnet list package --outdated
dotnet add package PackageName  # Update specific package
```

### Remove Package

```powershell
dotnet remove package PackageName
```

## Testing & Health Checks

### Test Health Endpoint

```powershell
Invoke-RestMethod -Uri "https://localhost:5001/api/health" -Method GET
```

### Test Login Endpoint

```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost:5001/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### Test with Authorization

```powershell
$headers = @{
    Authorization = "Bearer YOUR_JWT_TOKEN"
}

Invoke-RestMethod -Uri "https://localhost:5001/api/auth/me" `
    -Method GET `
    -Headers $headers
```

## VS Code Tasks

Run these via `Ctrl+Shift+P` → "Tasks: Run Task"

- **▶️ Start .NET Backend (5001)** - Start API server
- **🔍 Type Check & Lint** - Validate code
- **📦 Build & Deploy** - Full deployment

## Common Issues

### Port Already in Use

```powershell
# Find process using port 5001
netstat -ano | findstr :5001

# Kill the process
taskkill /PID <PID> /F
```

### Database Connection Failed

```powershell
# Test connection string
dotnet ef database update --verbose
```

### JWT Token Invalid

```powershell
# Verify JWT_SECRET matches Node.js backend
dotnet user-secrets list
cat ..\backend\.env | Select-String JWT_SECRET
```

## Useful Links

- **Swagger UI**: https://localhost:5001/swagger
- **Health Check**: https://localhost:5001/api/health
- **EF Core Docs**: https://docs.microsoft.com/ef/core
- **ASP.NET Core**: https://docs.microsoft.com/aspnet/core

## Environment Variables

**Development (User Secrets):**

- `JWT_SECRET` - JWT signing key
- `ConnectionStrings:DefaultConnection` - PostgreSQL
- `ConnectionStrings:Redis` - Redis cache

**Production (Azure App Settings):**

- Same as above, plus:
- `ASPNETCORE_ENVIRONMENT=Production`
- `WEBSITE_RUN_FROM_PACKAGE=1`

---

**📋 Bookmark this page for quick reference!**

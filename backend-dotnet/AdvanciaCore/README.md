# AdvanciaCore - Minimal .NET 9 API

Lightweight ASP.NET Core 9 API for Advancia Pay Ledger.

## 🚀 Quick Start

### Run Locally

```powershell
cd backend-dotnet/AdvanciaCore
dotnet restore
dotnet run
```

**Access:**

- API: https://localhost:5001
- Swagger: https://localhost:5001/swagger
- Health: https://localhost:5001/health

### Deploy to Azure

**Option 1: Quick Deploy (Fastest)**

```powershell
.\scripts\Quick-Deploy-Azure.ps1
```

**Option 2: Full Deploy (More Control)**

```powershell
.\scripts\Deploy-AdvanciaCore-Azure.ps1
```

**Option 3: Azure CLI Commands**

```powershell
# Login
az login

# Create resources
az group create --name AdvanciaRG --location "southafricanorth"
az appservice plan create --name AdvanciaPlan --resource-group AdvanciaRG --sku B1 --is-linux
az webapp create --name AdvanciaCoreApp --resource-group AdvanciaRG --plan AdvanciaPlan --runtime "DOTNET:9.0"

# Quick deploy
cd backend-dotnet/AdvanciaCore
az webapp up --name AdvanciaCoreApp --resource-group AdvanciaRG --runtime "DOTNET:9.0"
```

## 📡 API Endpoints

```
GET  /              - API status
GET  /health        - Health check (JSON)
GET  /swagger       - API documentation
```

## 🌍 Deployment Info

- **Region**: South Africa North (southafricanorth)
- **Resource Group**: AdvanciaRG
- **App Service Plan**: AdvanciaPlan (B1 tier)
- **App Name**: AdvanciaCoreApp
- **Runtime**: .NET 9.0

## 🔧 Development

### Project Structure

```
AdvanciaCore/
├── Program.cs              # Main application
├── AdvanciaCore.csproj     # Project file
├── appsettings.json        # Configuration
└── Properties/
    └── launchSettings.json # Local dev settings
```

### Build Commands

```powershell
dotnet build              # Build project
dotnet run                # Run locally
dotnet publish -c Release # Build for production
```

### Testing

```powershell
# Test locally
curl https://localhost:5001
curl https://localhost:5001/health

# Test in Azure
curl https://advanciocoreapp.azurewebsites.net
curl https://advanciocoreapp.azurewebsites.net/health
```

## 🔗 Integration

This minimal API can be extended to work with:

- The full AdvanciaApp (.NET backend)
- Node.js backend for hybrid architecture
- Frontend applications (Next.js)

## 📚 Next Steps

1. ✅ Test locally: `dotnet run`
2. ✅ Deploy to Azure: `.\scripts\Quick-Deploy-Azure.ps1`
3. ✅ Add controllers as needed
4. ✅ Connect to database
5. ✅ Add authentication

---

**Simple, fast, and ready for Azure! 🚀**

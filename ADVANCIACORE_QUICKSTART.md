# 🚀 AdvanciaCore - Minimal API Quick Reference

## Run Locally (30 seconds)

```powershell
cd backend-dotnet/AdvanciaCore
dotnet run
```

**Open in browser:**

- Main: <https://localhost:5001>
- Swagger: <https://localhost:5001/swagger>
- Health: <https://localhost:5001/health>

## Deploy to Azure (3 commands)

### Quick Deploy (Recommended)

```powershell
.\scripts\Quick-Deploy-Azure.ps1
```

### Manual Azure CLI

```powershell
az login
az group create --name AdvanciaRG --location "southafricanorth"
cd backend-dotnet/AdvanciaCore
az webapp up --name AdvanciaCoreApp --resource-group AdvanciaRG --runtime "DOTNET:9.0"
```

## VS Code Task

Press `Ctrl+Shift+P` → "Tasks: Run Task" → **"🚀 Run AdvanciaCore (Minimal API)"**

## Test Deployed App

```powershell
# After deployment
curl https://advanciocoreapp.azurewebsites.net
curl https://advanciocoreapp.azurewebsites.net/health
```

## Architecture

```
AdvanciaCore (Minimal)    ← You are here (simple, fast)
      │
      ├─ For: Quick testing, lightweight APIs
      └─ Features: Basic endpoints, Swagger, health checks

AdvanciaApp (Full)        ← Enterprise version
      │
      ├─ For: Production, complex features
      └─ Features: Auth, database, Redis, Azure services
```

## Key Info

| Item        | Value                     |
| ----------- | ------------------------- |
| **Port**    | 5001 (HTTPS), 5000 (HTTP) |
| **Region**  | South Africa North        |
| **Runtime** | .NET 9.0                  |
| **Tier**    | B1 (Basic)                |

## Commands Cheat Sheet

```powershell
# Build
dotnet build

# Run
dotnet run

# Publish
dotnet publish -c Release

# Deploy
.\scripts\Quick-Deploy-Azure.ps1

# Check Azure resources
az resource list --resource-group AdvanciaRG
```

---

**Minimal, fast, and production-ready! ⚡**

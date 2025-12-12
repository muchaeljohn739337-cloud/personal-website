# Azure Deployment Checklist

## What You Need Before Running `Quick-Deploy-Azure-Simple.ps1`

### ✅ Prerequisites

1. **Azure CLI Installed**

   ```powershell
   # Check if installed
   az --version

   # If not installed, download from:
   # https://aka.ms/installazurecliwindows
   ```

2. **Logged into Azure**

   ```powershell
   az login

   # Verify login
   az account show
   ```

3. **Set Active Subscription (if you have multiple)**

   ```powershell
   # List subscriptions
   az account list --output table

   # Set active subscription
   az account set --subscription "YOUR_SUBSCRIPTION_NAME_OR_ID"
   ```

4. **Navigate to Project Root**
   ```powershell
   cd c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform
   ```

### 🚀 Deploy Commands

**Option 1: Simple Deploy (Your Script)**

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\Quick-Deploy-Azure-Simple.ps1
```

**Option 2: Deploy with Custom Parameters**

```powershell
.\scripts\Quick-Deploy-Azure-Simple.ps1 -name "MyAppName" -resourceGroup "MyRG" -location "westus2"
```

**Option 3: From AdvanciaCore Directory**

```powershell
cd backend-dotnet/AdvanciaCore
az webapp up --name AdvanciaCoreApp --resource-group AdvanciaRG --location eastus --runtime "DOTNET|9.0"
```

### 📋 What Your Script Does

1. **Creates Resource Group** (if doesn't exist)

   - Name: `AdvanciaRG`
   - Location: `eastus`

2. **Creates App Service Plan** (if doesn't exist)

   - Name: `AdvanciaCoreApp-Plan`
   - SKU: `B1` (Basic tier - ~$13/month)

3. **Creates Web App** (if doesn't exist)

   - Name: `AdvanciaCoreApp`
   - Runtime: `.NET 9.0`

4. **Deploys Code**
   - Deploys from current directory
   - Must be run from `backend-dotnet/AdvanciaCore` OR script needs to navigate there

### ⚠️ Common Issues

**Issue 1: Script runs but doesn't deploy code**

- **Problem**: `az webapp up` needs to run from the project directory
- **Fix**: Add this to your script:
  ```powershell
  Set-Location "$PSScriptRoot\..\backend-dotnet\AdvanciaCore"
  ```

**Issue 2: App name already taken**

- **Problem**: Azure app names must be globally unique
- **Fix**: Change the name parameter:
  ```powershell
  .\scripts\Quick-Deploy-Azure-Simple.ps1 -name "AdvanciaCore$(Get-Random -Max 9999)"
  ```

**Issue 3: Location not recognized**

- **Problem**: Invalid Azure region name
- **Fix**: Use one of these:
  - `eastus`, `eastus2`, `westus`, `westus2`, `centralus`
  - `northeurope`, `westeurope`, `uksouth`
  - `southeastasia`, `eastasia`

**Issue 4: Runtime error**

- **Problem**: .NET 9 might not be available in all regions yet
- **Fix**: Use .NET 8 instead:
  ```powershell
  --runtime "DOTNET|8.0"
  ```

### 🔧 Enhanced Script (Recommended)

Save as `scripts/Quick-Deploy-Azure-Enhanced.ps1`:

```powershell
param(
    [string]$name = "AdvanciaCoreApp",
    [string]$resourceGroup = "AdvanciaRG",
    [string]$location = "eastus"
)

Write-Host "🚀 Deploying AdvanciaCore to Azure..." -ForegroundColor Cyan
Write-Host ""

# Check Azure login
$account = az account show 2>$null
if (-not $account) {
    Write-Host "⚠️  Not logged in. Opening Azure login..." -ForegroundColor Yellow
    az login
}

# Navigate to project
$projectPath = "$PSScriptRoot\..\backend-dotnet\AdvanciaCore"
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ Project not found at: $projectPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath
Write-Host "✅ Found project at: $projectPath" -ForegroundColor Green
Write-Host ""

# Create resources and deploy
Write-Host "📦 Creating Azure resources..." -ForegroundColor Yellow
az group create --name $resourceGroup --location $location | Out-Null
az appservice plan create --name "$name-Plan" --resource-group $resourceGroup --sku B1 | Out-Null
az webapp create --name $name --resource-group $resourceGroup --plan "$name-Plan" --runtime "DOTNET|9.0" | Out-Null

Write-Host "🚢 Deploying application..." -ForegroundColor Yellow
az webapp up --name $name --resource-group $resourceGroup --runtime "DOTNET|9.0"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is live at:" -ForegroundColor Cyan
    Write-Host "  https://$name.azurewebsites.net" -ForegroundColor White
    Write-Host "  https://$name.azurewebsites.net/health" -ForegroundColor White
    Write-Host "  https://$name.azurewebsites.net/swagger" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
```

### 🎯 Quick Start

```powershell
# 1. Install Azure CLI (if needed)
winget install Microsoft.AzureCLI

# 2. Login to Azure
az login

# 3. Deploy
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\Quick-Deploy-Azure-Simple.ps1
```

### 📊 Cost Estimate

- **B1 App Service Plan**: ~$13/month
- **Free tier options**: Use `--sku F1` for free tier (limited resources)

### 🔗 Useful Links

- [Azure App Service Pricing](https://azure.microsoft.com/pricing/details/app-service/)
- [Azure CLI Install](https://aka.ms/installazurecliwindows)
- [Azure Regions List](https://azure.microsoft.com/global-infrastructure/geographies/)

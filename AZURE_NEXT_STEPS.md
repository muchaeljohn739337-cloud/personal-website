# 🎯 Azure Deployment - What's Next?

## ✅ What You've Accomplished

1. ✅ Created Azure Resource Group: `AdvanciaRG`
2. ✅ Created App Service Plan: `AdvanciaCoreApp-Plan` (B1 tier)
3. ✅ Deployed .NET 9 API: `AdvanciaCoreApp`
4. ✅ App is live at: https://advanciacoreapp.azurewebsites.net

---

## 🚀 Immediate Next Steps

### 1. Test Your Live API

```powershell
# Test root endpoint
curl https://advanciacoreapp.azurewebsites.net

# Test health endpoint
curl https://advanciacoreapp.azurewebsites.net/health

# Open Swagger UI in browser
start https://advanciacoreapp.azurewebsites.net/swagger
```

### 2. Configure Environment Variables

Your app needs configuration for production:

```powershell
# Set environment to Production
az webapp config appsettings set --name AdvanciaCoreApp --resource-group AdvanciaRG --settings `
  ASPNETCORE_ENVIRONMENT=Production

# Add database connection (when ready)
az webapp config appsettings set --name AdvanciaCoreApp --resource-group AdvanciaRG --settings `
  DATABASE_URL="your-connection-string"

# Add Stripe keys (when ready)
az webapp config appsettings set --name AdvanciaCoreApp --resource-group AdvanciaRG --settings `
  STRIPE_SECRET_KEY="sk_live_..." `
  STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

### 3. Enable Application Insights (Monitoring)

```powershell
# Create Application Insights
az monitor app-insights component create --app AdvanciaCoreAppInsights --location eastus --resource-group AdvanciaRG

# Link to your web app
$instrumentationKey = az monitor app-insights component show --app AdvanciaCoreAppInsights --resource-group AdvanciaRG --query instrumentationKey -o tsv

az webapp config appsettings set --name AdvanciaCoreApp --resource-group AdvanciaRG --settings `
  APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$instrumentationKey"
```

### 4. Set Up Continuous Deployment

**Option A: From GitHub**

```powershell
# Connect to your GitHub repo
az webapp deployment source config --name AdvanciaCoreApp --resource-group AdvanciaRG `
  --repo-url https://github.com/muchaeljohn739337-cloud/-modular-saas-platform `
  --branch main `
  --manual-integration
```

**Option B: Local Git**

```powershell
# Enable local git deployment
az webapp deployment source config-local-git --name AdvanciaCoreApp --resource-group AdvanciaRG

# Get the git URL
$gitUrl = az webapp deployment source show --name AdvanciaCoreApp --resource-group AdvanciaRG --query repoUrl -o tsv
Write-Host "Git URL: $gitUrl"

# Add as remote and push
cd backend-dotnet/AdvanciaCore
git init
git add .
git commit -m "Initial deployment"
git remote add azure $gitUrl
git push azure main
```

### 5. Configure Custom Domain (Optional)

```powershell
# Add custom domain
az webapp config hostname add --webapp-name AdvanciaCoreApp --resource-group AdvanciaRG --hostname api.yourdomain.com

# Enable HTTPS
az webapp config ssl bind --certificate-thumbprint <thumbprint> --ssl-type SNI --name AdvanciaCoreApp --resource-group AdvanciaRG
```

---

## 🔧 Advanced Configuration

### Scale Your App

```powershell
# Scale UP (more powerful instance)
az appservice plan update --name AdvanciaCoreApp-Plan --resource-group AdvanciaRG --sku S1

# Scale OUT (more instances)
az appservice plan update --name AdvanciaCoreApp-Plan --resource-group AdvanciaRG --number-of-workers 2
```

### Configure CORS

```powershell
# Allow your frontend domain
az webapp cors add --name AdvanciaCoreApp --resource-group AdvanciaRG --allowed-origins `
  https://yourdomain.com `
  https://www.yourdomain.com `
  https://advanciapayledger.com
```

### Set Up Database

```powershell
# Create Azure SQL Database
az sql server create --name advancia-sql-server --resource-group AdvanciaRG --location eastus --admin-user sqladmin --admin-password "YourPassword123!"

az sql db create --resource-group AdvanciaRG --server advancia-sql-server --name advanciadb --service-objective S0

# Get connection string
az sql db show-connection-string --server advancia-sql-server --name advanciadb --client ado.net
```

### Enable Logging

```powershell
# Enable application logging
az webapp log config --name AdvanciaCoreApp --resource-group AdvanciaRG `
  --application-logging filesystem `
  --detailed-error-messages true `
  --failed-request-tracing true `
  --web-server-logging filesystem

# Enable Docker container logging
az webapp log config --name AdvanciaCoreApp --resource-group AdvanciaRG --docker-container-logging filesystem
```

---

## 📊 Monitoring & Debugging

### View Live Logs

```powershell
# Stream logs
az webapp log tail --name AdvanciaCoreApp --resource-group AdvanciaRG

# Download logs
az webapp log download --name AdvanciaCoreApp --resource-group AdvanciaRG --log-file app-logs.zip
```

### Check Deployment Status

```powershell
# View deployment history
az webapp deployment list --name AdvanciaCoreApp --resource-group AdvanciaRG --output table

# View deployment logs
az webapp log deployment show --name AdvanciaCoreApp --resource-group AdvanciaRG
```

### Performance Metrics

```powershell
# View CPU usage
az monitor metrics list --resource "/subscriptions/<subscription-id>/resourceGroups/AdvanciaRG/providers/Microsoft.Web/sites/AdvanciaCoreApp" --metric "CpuPercentage"

# View memory usage
az monitor metrics list --resource "/subscriptions/<subscription-id>/resourceGroups/AdvanciaRG/providers/Microsoft.Web/sites/AdvanciaCoreApp" --metric "MemoryPercentage"
```

---

## 🔒 Security Best Practices

### 1. Restrict Access

```powershell
# Add IP restrictions
az webapp config access-restriction add --name AdvanciaCoreApp --resource-group AdvanciaRG --rule-name "Office" --action Allow --ip-address "203.0.113.0/24" --priority 100
```

### 2. Enable Managed Identity

```powershell
# Enable system-assigned managed identity
az webapp identity assign --name AdvanciaCoreApp --resource-group AdvanciaRG
```

### 3. Configure Key Vault Integration

```powershell
# Create Key Vault
az keyvault create --name advancia-keyvault --resource-group AdvanciaRG --location eastus

# Grant app access to Key Vault
$identityId = az webapp identity show --name AdvanciaCoreApp --resource-group AdvanciaRG --query principalId -o tsv
az keyvault set-policy --name advancia-keyvault --object-id $identityId --secret-permissions get list
```

---

## 💰 Cost Optimization

### Current Cost: ~$13/month (B1 tier)

**To reduce costs:**

```powershell
# Switch to Free tier (F1) - limited resources
az appservice plan update --name AdvanciaCoreApp-Plan --resource-group AdvanciaRG --sku F1

# Stop app when not in use
az webapp stop --name AdvanciaCoreApp --resource-group AdvanciaRG
```

**To increase performance:**

```powershell
# Switch to Standard tier (S1) - ~$70/month
az appservice plan update --name AdvanciaCoreApp-Plan --resource-group AdvanciaRG --sku S1

# Switch to Premium tier (P1V2) - ~$146/month
az appservice plan update --name AdvanciaCoreApp-Plan --resource-group AdvanciaRG --sku P1V2
```

---

## 🔄 Deployment Workflow

### Quick Redeploy After Code Changes

```powershell
# Navigate to project
cd c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform

# Run deployment script
.\scripts\Quick-Deploy-Azure-Simple.ps1
```

### Or deploy manually

```powershell
cd backend-dotnet/AdvanciaCore
az webapp up --name AdvanciaCoreApp --resource-group AdvanciaRG --runtime "DOTNET|9.0"
```

---

## 🧹 Cleanup (When Done Testing)

```powershell
# Stop the app (keeps it but stops billing compute)
az webapp stop --name AdvanciaCoreApp --resource-group AdvanciaRG

# Delete just the app
az webapp delete --name AdvanciaCoreApp --resource-group AdvanciaRG

# Delete entire resource group (everything)
az group delete --name AdvanciaRG --yes --no-wait
```

---

## 📞 Support & Resources

- **Azure Portal**: https://portal.azure.com
- **App Dashboard**: https://portal.azure.com/#@/resource/subscriptions/.../resourceGroups/AdvanciaRG/providers/Microsoft.Web/sites/AdvanciaCoreApp
- **Azure CLI Docs**: https://docs.microsoft.com/cli/azure/webapp
- **App Service Docs**: https://docs.microsoft.com/azure/app-service/

---

## 🎯 Recommended Next Action

**Start here:**

1. Test your live API endpoints
2. Configure environment variables for your app
3. Enable Application Insights for monitoring
4. Set up continuous deployment from GitHub

Run these commands:

```powershell
# Quick test
curl https://advanciacoreapp.azurewebsites.net/health

# View current settings
az webapp config appsettings list --name AdvanciaCoreApp --resource-group AdvanciaRG --output table

# Next: Configure your environment variables based on your needs
```

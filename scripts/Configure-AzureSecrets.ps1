# Configure Azure Secrets for Advancia .NET API
# Sets up environment variables and Key Vault secrets

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "advancia-resources",
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "AdvanciaAppCore",
    
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$JwtSecret,
    
    [Parameter(Mandatory=$false)]
    [string]$RedisUrl = "localhost:6379"
)

Write-Host "🔐 Configuring Azure secrets for $AppName..." -ForegroundColor Cyan

# Set application settings securely
Write-Host "Setting secure app settings..." -ForegroundColor Yellow

az webapp config appsettings set `
    --name $AppName `
    --resource-group $ResourceGroup `
    --settings `
        JWT_SECRET="$JwtSecret" `
        ConnectionStrings__DefaultConnection="$DatabaseUrl" `
        ConnectionStrings__Redis="$RedisUrl" `
        ASPNETCORE_ENVIRONMENT="Production" `
    --output none

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set app settings!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Secure app settings configured" -ForegroundColor Green

# Enable system-assigned managed identity
Write-Host "Enabling managed identity..." -ForegroundColor Yellow
az webapp identity assign `
    --name $AppName `
    --resource-group $ResourceGroup `
    --output none

Write-Host "✅ Managed identity enabled" -ForegroundColor Green

Write-Host "" -ForegroundColor Green
Write-Host "🎉 Configuration complete!" -ForegroundColor Green
Write-Host "⚠️  Remember to:" -ForegroundColor Yellow
Write-Host "   1. Configure CORS origins in Azure Portal" -ForegroundColor Yellow
Write-Host "   2. Set up custom domain if needed" -ForegroundColor Yellow
Write-Host "   3. Configure Application Insights" -ForegroundColor Yellow

# Azure Deployment Script for Advancia .NET API
# Deploys ASP.NET Core 9 application to Azure App Service

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "advancia-resources",
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "AdvanciaAppCore",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$Sku = "B1"
)

Write-Host "🚀 Starting Azure deployment for Advancia .NET API..." -ForegroundColor Cyan

# Check if logged into Azure
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
$azAccount = az account show 2>$null
if (-not $azAccount) {
    Write-Host "❌ Not logged into Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Azure login confirmed" -ForegroundColor Green

# Create resource group if it doesn't exist
Write-Host "Ensuring resource group exists..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none
Write-Host "✅ Resource group ready: $ResourceGroup" -ForegroundColor Green

# Create App Service Plan if it doesn't exist
Write-Host "Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create `
    --name "$AppName-plan" `
    --resource-group $ResourceGroup `
    --sku $Sku `
    --is-linux `
    --output none

Write-Host "✅ App Service Plan created" -ForegroundColor Green

# Create Web App
Write-Host "Creating Web App..." -ForegroundColor Yellow
az webapp create `
    --name $AppName `
    --resource-group $ResourceGroup `
    --plan "$AppName-plan" `
    --runtime "DOTNET|9.0" `
    --output none

Write-Host "✅ Web App created: $AppName" -ForegroundColor Green

# Configure app settings
Write-Host "Configuring app settings..." -ForegroundColor Yellow
az webapp config appsettings set `
    --name $AppName `
    --resource-group $ResourceGroup `
    --settings `
        ASPNETCORE_ENVIRONMENT=Production `
        WEBSITE_RUN_FROM_PACKAGE=1 `
    --output none

Write-Host "✅ App settings configured" -ForegroundColor Green

# Enable HTTPS only
Write-Host "Enabling HTTPS only..." -ForegroundColor Yellow
az webapp update `
    --name $AppName `
    --resource-group $ResourceGroup `
    --https-only true `
    --output none

Write-Host "✅ HTTPS enforced" -ForegroundColor Green

# Build and publish the application
Write-Host "Building .NET application..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\backend-dotnet\AdvanciaApp"
dotnet publish -c Release -o ./publish

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
$publishPath = ".\publish"
$zipPath = "..\AdvanciaApp.zip"

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "$publishPath\*" -DestinationPath $zipPath

Write-Host "✅ Deployment package created" -ForegroundColor Green

# Deploy to Azure
Write-Host "Deploying to Azure App Service..." -ForegroundColor Yellow
az webapp deployment source config-zip `
    --name $AppName `
    --resource-group $ResourceGroup `
    --src $zipPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment successful!" -ForegroundColor Green

# Get the URL
$appUrl = az webapp show --name $AppName --resource-group $ResourceGroup --query "defaultHostName" -o tsv
Write-Host "" -ForegroundColor Green
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "📍 App URL: https://$appUrl" -ForegroundColor Cyan
Write-Host "📍 Health Check: https://$appUrl/api/health" -ForegroundColor Cyan
Write-Host "📍 Swagger: https://$appUrl/swagger" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Green

# Clean up
Remove-Item $zipPath -Force

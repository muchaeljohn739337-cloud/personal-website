# Deploy AdvanciaCore to Azure - East US Region (Optimized for Stripe & Payment Processing)
# Simple deployment script for ASP.NET Core 9 minimal API

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "AdvanciaRG",
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "AdvanciaCoreApp",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$PlanName = "AdvanciaPlan",
    
    [Parameter(Mandatory=$false)]
    [string]$Sku = "B1"
)

Write-Host "🚀 Deploying AdvanciaCore to Azure..." -ForegroundColor Cyan
Write-Host "📍 Region: East US (Optimized for Stripe & payment processing)" -ForegroundColor Yellow
Write-Host ""

# Check Azure login
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
$azAccount = az account show 2>$null
if (-not $azAccount) {
    Write-Host "❌ Not logged into Azure. Logging in..." -ForegroundColor Red
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Azure login failed!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Azure login confirmed" -ForegroundColor Green
Write-Host ""

# Create resource group
Write-Host "Creating resource group: $ResourceGroup" -ForegroundColor Yellow
az group create `
    --name $ResourceGroup `
    --location $Location `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Resource group ready" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create resource group" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Create App Service Plan
Write-Host "Creating App Service Plan: $PlanName ($Sku)" -ForegroundColor Yellow
az appservice plan create `
    --name $PlanName `
    --resource-group $ResourceGroup `
    --sku $Sku `
    --is-linux `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App Service Plan created" -ForegroundColor Green
} else {
    Write-Host "⚠️  App Service Plan may already exist (continuing...)" -ForegroundColor Yellow
}
Write-Host ""

# Create Web App
Write-Host "Creating Web App: $AppName" -ForegroundColor Yellow
az webapp create `
    --name $AppName `
    --resource-group $ResourceGroup `
    --plan $PlanName `
    --runtime "DOTNET:9.0" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Web App created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Web App may already exist (continuing...)" -ForegroundColor Yellow
}
Write-Host ""

# Build and publish the application
Write-Host "Building AdvanciaCore application..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\backend-dotnet\AdvanciaCore"

dotnet publish -c Release -o ./publish

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green
Write-Host ""

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
$publishPath = ".\publish"
$zipPath = "..\AdvanciaCore.zip"

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "$publishPath\*" -DestinationPath $zipPath
Write-Host "✅ Deployment package created" -ForegroundColor Green
Write-Host ""

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
Write-Host ""

# Enable HTTPS
Write-Host "Enabling HTTPS only..." -ForegroundColor Yellow
az webapp update `
    --name $AppName `
    --resource-group $ResourceGroup `
    --https-only true `
    --output none
Write-Host "✅ HTTPS enforced" -ForegroundColor Green
Write-Host ""

# Get the URL
$appUrl = az webapp show `
    --name $AppName `
    --resource-group $ResourceGroup `
    --query "defaultHostName" `
    -o tsv

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📍 App URL:        https://$appUrl" -ForegroundColor Cyan
Write-Host "📍 Health Check:   https://$appUrl/health" -ForegroundColor Cyan
Write-Host "📍 Swagger UI:     https://$appUrl/swagger" -ForegroundColor Cyan
Write-Host "📍 Region:         $Location" -ForegroundColor Cyan
Write-Host "📍 Resource Group: $ResourceGroup" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test with:" -ForegroundColor Yellow
Write-Host "  curl https://$appUrl" -ForegroundColor White
Write-Host "  curl https://$appUrl/health" -ForegroundColor White
Write-Host ""

# Clean up
Remove-Item $zipPath -Force
Write-Host "✅ Cleanup completed" -ForegroundColor Green

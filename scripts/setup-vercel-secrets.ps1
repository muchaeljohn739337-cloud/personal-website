#!/usr/bin/env pwsh
# Vercel Environment Variables Setup Script
# This script helps you configure environment variables in Vercel

Write-Host "🔐 Vercel Environment Variables Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host "📋 This script will guide you through setting up environment variables in Vercel" -ForegroundColor Green
Write-Host ""

# Confirm project
Write-Host "1️⃣  First, let's link your Vercel project" -ForegroundColor Cyan
$linkProject = Read-Host "Link Vercel project? (y/n)"
if ($linkProject -eq 'y') {
    vercel link
}

Write-Host ""
Write-Host "2️⃣  Generate new secrets" -ForegroundColor Cyan
Write-Host "Generating secure secrets..." -ForegroundColor Gray

$jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
$sessionSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
$nextauthSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

Write-Host ""
Write-Host "✅ Generated secrets (save these securely!):" -ForegroundColor Green
Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Yellow
Write-Host "SESSION_SECRET=$sessionSecret" -ForegroundColor Yellow
Write-Host "NEXTAUTH_SECRET=$nextauthSecret" -ForegroundColor Yellow
Write-Host ""

# Prompt for database password
Write-Host "3️⃣  Database Configuration" -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANT: Reset your Supabase password first!" -ForegroundColor Red
Write-Host "   Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/database" -ForegroundColor Gray
Write-Host ""
$dbPassword = Read-Host "Enter NEW Supabase database password (or press Enter to skip)"

# Prompt for production URL
Write-Host ""
Write-Host "4️⃣  Production Configuration" -ForegroundColor Cyan
$productionUrl = Read-Host "Enter your production URL (e.g., https://yourdomain.com)"
if ([string]::IsNullOrEmpty($productionUrl)) {
    $productionUrl = "https://your-project.vercel.app"
}

# Environment selection
Write-Host ""
Write-Host "5️⃣  Select environments to configure:" -ForegroundColor Cyan
Write-Host "   1. Production only"
Write-Host "   2. Production + Preview"
Write-Host "   3. All (Production + Preview + Development)"
$envChoice = Read-Host "Enter choice (1-3)"

$environments = @("production")
if ($envChoice -eq "2") {
    $environments += "preview"
} elseif ($envChoice -eq "3") {
    $environments += @("preview", "development")
}

Write-Host ""
Write-Host "6️⃣  Adding environment variables to Vercel..." -ForegroundColor Cyan

foreach ($env in $environments) {
    Write-Host ""
    Write-Host "Configuring $env environment..." -ForegroundColor Gray
    
    # Core variables
    $appUrl = if ($env -eq "production") { $productionUrl } elseif ($env -eq "preview") { "https://preview.vercel.app" } else { "http://localhost:3000" }
    
    Write-Host "  - NODE_ENV" -ForegroundColor DarkGray
    echo $env | vercel env add NODE_ENV $env --force
    
    Write-Host "  - NEXT_PUBLIC_APP_URL" -ForegroundColor DarkGray
    echo $appUrl | vercel env add NEXT_PUBLIC_APP_URL $env --force
    
    Write-Host "  - NEXTAUTH_URL" -ForegroundColor DarkGray
    echo $appUrl | vercel env add NEXTAUTH_URL $env --force
    
    # Secrets
    Write-Host "  - JWT_SECRET" -ForegroundColor DarkGray
    echo $jwtSecret | vercel env add JWT_SECRET $env --force
    
    Write-Host "  - SESSION_SECRET" -ForegroundColor DarkGray
    echo $sessionSecret | vercel env add SESSION_SECRET $env --force
    
    Write-Host "  - NEXTAUTH_SECRET" -ForegroundColor DarkGray
    echo $nextauthSecret | vercel env add NEXTAUTH_SECRET $env --force
    
    # Database (if password provided)
    if (-not [string]::IsNullOrEmpty($dbPassword)) {
        $dbUrl = "postgresql://postgres:$dbPassword@db.xesecqcqzykvmrtxrzqi.supabase.co:5432/postgres"
        Write-Host "  - DATABASE_URL" -ForegroundColor DarkGray
        echo $dbUrl | vercel env add DATABASE_URL $env --force
    }
    
    # Cloudflare
    Write-Host "  - CLOUDFLARE_ACCOUNT_ID" -ForegroundColor DarkGray
    echo "74ecde4d46d4b399c7295cf599d2886b" | vercel env add CLOUDFLARE_ACCOUNT_ID $env --force
    
    Write-Host "  - CLOUDFLARE_R2_BUCKET_NAME" -ForegroundColor DarkGray
    echo "uploads" | vercel env add CLOUDFLARE_R2_BUCKET_NAME $env --force
    
    # Email
    Write-Host "  - EMAIL_FROM" -ForegroundColor DarkGray
    echo "noreply@advanciapayledger.com" | vercel env add EMAIL_FROM $env --force
    
    Write-Host "  - EMAIL_FROM_NAME" -ForegroundColor DarkGray
    echo "Advancia PayLedger" | vercel env add EMAIL_FROM_NAME $env --force
}

Write-Host ""
Write-Host "✅ Environment variables configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Verify variables in Vercel Dashboard:" -ForegroundColor Gray
Write-Host "      https://vercel.com/your-project/settings/environment-variables" -ForegroundColor Gray
Write-Host "   2. Deploy your application: vercel --prod" -ForegroundColor Gray
Write-Host "   3. Test the deployment" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Security reminders:" -ForegroundColor Yellow
Write-Host "   - Save the generated secrets in a secure password manager" -ForegroundColor Gray
Write-Host "   - Never commit secrets to git" -ForegroundColor Gray
Write-Host "   - Rotate secrets quarterly" -ForegroundColor Gray
Write-Host ""

# Save secrets to secure file (optional)
$saveSecrets = Read-Host "Save secrets to encrypted file? (y/n)"
if ($saveSecrets -eq 'y') {
    $secretsFile = ".vercel-secrets.txt"
    @"
VERCEL ENVIRONMENT SECRETS
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
========================================

JWT_SECRET=$jwtSecret
SESSION_SECRET=$sessionSecret
NEXTAUTH_SECRET=$nextauthSecret
PRODUCTION_URL=$productionUrl

⚠️  KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT
"@ | Out-File -FilePath $secretsFile
    
    Write-Host "✅ Secrets saved to $secretsFile" -ForegroundColor Green
    Write-Host "⚠️  This file is in .gitignore - keep it secure!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green

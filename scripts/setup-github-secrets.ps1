#!/usr/bin/env pwsh
# GitHub Secrets Setup Script
# This script helps you set up required GitHub secrets for CI/CD

Write-Host "🔐 GitHub Secrets Setup" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will guide you through setting up GitHub secrets." -ForegroundColor Gray
Write-Host "You'll need GitHub CLI (gh) installed or you can add them manually." -ForegroundColor Gray
Write-Host ""

# Check if GitHub CLI is installed
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if (-not $ghInstalled) {
    Write-Host "⚠️  GitHub CLI not found." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Install GitHub CLI:" -ForegroundColor Cyan
    Write-Host "   Windows: winget install --id GitHub.cli" -ForegroundColor Gray
    Write-Host "   macOS: brew install gh" -ForegroundColor Gray
    Write-Host "   Linux: See https://cli.github.com/manual/installation" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or add secrets manually at:" -ForegroundColor Yellow
    Write-Host "https://github.com/muchaeljohn739337-cloud/personal-website/settings/secrets/actions" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "📝 Required GitHub Secrets:" -ForegroundColor Cyan
Write-Host ""

$secrets = @(
    @{
        Name = "VERCEL_TOKEN"
        Description = "Vercel authentication token"
        HowToGet = "https://vercel.com/account/tokens"
        Required = $true
    },
    @{
        Name = "VERCEL_ORG_ID"
        Description = "Vercel organization ID"
        HowToGet = "Run: vercel project list"
        Required = $true
    },
    @{
        Name = "VERCEL_PROJECT_ID"
        Description = "Vercel project ID"
        HowToGet = "Run: vercel project list"
        Required = $true
    },
    @{
        Name = "DATABASE_URL"
        Description = "Production database URL"
        HowToGet = "Supabase dashboard > Settings > Database"
        Required = $true
    },
    @{
        Name = "NEXTAUTH_SECRET"
        Description = "NextAuth.js secret"
        HowToGet = "Run: node -e `"console.log(require('crypto').randomBytes(32).toString('base64'))`""
        Required = $true
    },
    @{
        Name = "JWT_SECRET"
        Description = "JWT secret for token generation"
        HowToGet = "Run: node -e `"console.log(require('crypto').randomBytes(32).toString('base64'))`""
        Required = $true
    },
    @{
        Name = "SESSION_SECRET"
        Description = "Session secret"
        HowToGet = "Run: node -e `"console.log(require('crypto').randomBytes(32).toString('base64'))`""
        Required = $true
    },
    @{
        Name = "NEXT_PUBLIC_WEB3AUTH_CLIENT_ID"
        Description = "Web3Auth client ID"
        HowToGet = "https://dashboard.web3auth.io/"
        Required = $false
    },
    @{
        Name = "WEB3AUTH_NETWORK"
        Description = "Web3Auth network (mainnet/testnet)"
        HowToGet = "mainnet or testnet"
        Required = $false
    },
    @{
        Name = "WEB3AUTH_VERIFIER_NAME"
        Description = "Web3Auth verifier name"
        HowToGet = "From Web3Auth dashboard"
        Required = $false
    },
    @{
        Name = "STRIPE_SECRET_KEY"
        Description = "Stripe secret key"
        HowToGet = "https://dashboard.stripe.com/apikeys"
        Required = $false
    },
    @{
        Name = "STRIPE_WEBHOOK_SECRET"
        Description = "Stripe webhook secret"
        HowToGet = "https://dashboard.stripe.com/webhooks"
        Required = $false
    },
    @{
        Name = "CLOUDFLARE_API_TOKEN"
        Description = "Cloudflare API token"
        HowToGet = "https://dash.cloudflare.com/profile/api-tokens"
        Required = $false
    },
    @{
        Name = "SENTRY_DSN"
        Description = "Sentry Data Source Name"
        HowToGet = "https://sentry.io/settings/"
        Required = $false
    },
    @{
        Name = "SENTRY_AUTH_TOKEN"
        Description = "Sentry authentication token"
        HowToGet = "https://sentry.io/settings/account/api/auth-tokens/"
        Required = $false
    }
)

foreach ($secret in $secrets) {
    $required = if ($secret.Required) { "[REQUIRED]" } else { "[OPTIONAL]" }
    Write-Host "$($required) $($secret.Name)" -ForegroundColor $(if ($secret.Required) { "Yellow" } else { "Gray" })
    Write-Host "   Description: $($secret.Description)" -ForegroundColor Gray
    Write-Host "   How to get: $($secret.HowToGet)" -ForegroundColor DarkGray
    Write-Host ""
}

if ($ghInstalled) {
    Write-Host "🚀 Would you like to add secrets now? (You'll be prompted for each value)" -ForegroundColor Cyan
    $proceed = Read-Host "Continue? (y/n)"
    
    if ($proceed -eq 'y') {
        # Check if authenticated
        Write-Host "🔑 Checking GitHub authentication..." -ForegroundColor Gray
        $ghAuth = gh auth status 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Not authenticated with GitHub CLI" -ForegroundColor Yellow
            Write-Host "   Run: gh auth login" -ForegroundColor Gray
            exit 1
        }
        
        Write-Host "✅ Authenticated with GitHub" -ForegroundColor Green
        Write-Host ""
        
        foreach ($secret in $secrets) {
            if (-not $secret.Required) {
                $add = Read-Host "Add $($secret.Name)? (y/n/skip)"
                if ($add -ne 'y') {
                    continue
                }
            }
            
            Write-Host ""
            Write-Host "Setting up: $($secret.Name)" -ForegroundColor Cyan
            Write-Host "Description: $($secret.Description)" -ForegroundColor Gray
            Write-Host "How to get: $($secret.HowToGet)" -ForegroundColor Gray
            Write-Host ""
            
            # Special handling for auto-generated secrets
            if ($secret.Name -in @("NEXTAUTH_SECRET", "JWT_SECRET", "SESSION_SECRET")) {
                $generate = Read-Host "Generate automatically? (y/n)"
                if ($generate -eq 'y') {
                    $value = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
                    Write-Host "Generated: $value" -ForegroundColor Green
                } else {
                    $value = Read-Host "Enter value"
                }
            } else {
                $value = Read-Host "Enter value (or press Enter to skip)"
                if ([string]::IsNullOrEmpty($value)) {
                    Write-Host "Skipped" -ForegroundColor Gray
                    continue
                }
            }
            
            # Set the secret
            Write-Host "Setting secret..." -ForegroundColor Gray
            echo $value | gh secret set $secret.Name
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $($secret.Name) set successfully" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to set $($secret.Name)" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "🎉 GitHub secrets setup complete!" -ForegroundColor Green
    }
} else {
    Write-Host "📋 Manual Setup Instructions:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Go to: https://github.com/muchaeljohn739337-cloud/personal-website/settings/secrets/actions" -ForegroundColor Gray
    Write-Host "2. Click 'New repository secret'" -ForegroundColor Gray
    Write-Host "3. Add each secret from the list above" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   GitHub Secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets" -ForegroundColor Gray
Write-Host "   Vercel Tokens: https://vercel.com/docs/rest-api#authentication" -ForegroundColor Gray
Write-Host "   Web3Auth Setup: https://web3auth.io/docs/dashboard-setup" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Setup script complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Verify all required secrets are set" -ForegroundColor Gray
Write-Host "   2. Push code to trigger GitHub Actions" -ForegroundColor Gray
Write-Host "   3. Check workflow runs in GitHub Actions tab" -ForegroundColor Gray

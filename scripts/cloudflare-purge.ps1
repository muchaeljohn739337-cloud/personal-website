# Cloudflare Cache Purge Script
# Purges Cloudflare CDN cache after deployment

param(
    [string]$ZoneId = $env:CLOUDFLARE_ZONE_ID,
    [string]$ApiToken = $env:CLOUDFLARE_API_TOKEN,
    [switch]$PurgeAll = $false,
    [string[]]$Files = @()
)

$ErrorActionPreference = "Stop"

Write-Host "`n🌐 Cloudflare Cache Purge Tool" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Validate credentials
if (-not $ZoneId -or -not $ApiToken) {
    Write-Host "❌ Missing Cloudflare credentials!" -ForegroundColor Red
    Write-Host "   Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN environment variables" -ForegroundColor Yellow
    Write-Host "`n   Example:" -ForegroundColor Gray
    Write-Host "   `$env:CLOUDFLARE_ZONE_ID = 'your_zone_id'" -ForegroundColor Gray
    Write-Host "   `$env:CLOUDFLARE_API_TOKEN = 'your_api_token'`n" -ForegroundColor Gray
    exit 1
}

# Cloudflare API endpoint
$apiUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/purge_cache"

# Build request headers
$headers = @{
    "Authorization" = "Bearer $ApiToken"
    "Content-Type" = "application/json"
}

# Build request body
if ($PurgeAll) {
    Write-Host "⚠️  Purging ALL cache files..." -ForegroundColor Yellow
    $body = @{
        purge_everything = $true
    } | ConvertTo-Json
} elseif ($Files.Count -gt 0) {
    Write-Host "📁 Purging specific files..." -ForegroundColor Cyan
    $Files | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
    $body = @{
        files = $Files
    } | ConvertTo-Json
} else {
    # Default: purge common assets
    Write-Host "🎯 Purging common assets..." -ForegroundColor Cyan
    $commonFiles = @(
        "https://advanciapayledger.com/*"
        "https://api.advanciapayledger.com/*"
    )
    $commonFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
    $body = @{
        files = $commonFiles
    } | ConvertTo-Json
}

# Make API request
try {
    Write-Host "`n🚀 Sending purge request..." -NoNewline
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $body
    
    if ($response.success) {
        Write-Host " ✅ Success!" -ForegroundColor Green
        Write-Host "`n✨ Cache purged successfully" -ForegroundColor Green
        
        if ($response.result.id) {
            Write-Host "   Purge ID: $($response.result.id)" -ForegroundColor Gray
        }
        
        return 0
    } else {
        Write-Host " ❌ Failed!" -ForegroundColor Red
        Write-Host "`nErrors:" -ForegroundColor Red
        $response.errors | ForEach-Object {
            Write-Host "   - [$($_.code)] $($_.message)" -ForegroundColor Red
        }
        return 1
    }
} catch {
    Write-Host " ❌ Failed!" -ForegroundColor Red
    Write-Host "`n❌ HTTP Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode" -ForegroundColor Yellow
        
        if ($statusCode -eq 403) {
            Write-Host "`n💡 Tip: Check that your API token has 'Zone.Cache Purge' permission" -ForegroundColor Yellow
        } elseif ($statusCode -eq 401) {
            Write-Host "`n💡 Tip: Your API token may be invalid or expired" -ForegroundColor Yellow
        }
    }
    
    return 1
}

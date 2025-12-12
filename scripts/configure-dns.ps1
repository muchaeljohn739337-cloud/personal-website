# DNS Configuration Script for Advancia Pay Ledger
# This script clears DNS cache and sets Google DNS servers (8.8.8.8, 8.8.4.4) and Cloudflare DNS (1.1.1.1, 1.0.0.1)

Write-Host "🔧 Advancia Pay Ledger - DNS Configuration Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Function to clear DNS cache
function Clear-DnsCache {
    Write-Host "🧹 Clearing DNS cache..." -ForegroundColor Yellow
    try {
        $result = ipconfig /flushdns
        Write-Host "✅ DNS cache cleared successfully" -ForegroundColor Green
        Write-Host "Output: $result" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Failed to clear DNS cache: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to set DNS servers
function Set-DnsServers {
    Write-Host "🌐 Setting DNS servers to Google (8.8.8.8, 8.8.4.4) and Cloudflare (1.1.1.1, 1.0.0.1)..." -ForegroundColor Yellow

    # Get network adapters
    $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }

    if ($adapters.Count -eq 0) {
        Write-Host "❌ No active network adapters found" -ForegroundColor Red
        return
    }

    foreach ($adapter in $adapters) {
        Write-Host "Configuring adapter: $($adapter.Name)" -ForegroundColor Blue

        try {
            # Set DNS servers (Google primary, Cloudflare secondary)
            Set-DnsClientServerAddress -InterfaceAlias $adapter.Name -ServerAddresses ("8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1")
            Write-Host "✅ DNS servers set for $($adapter.Name)" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to set DNS for $($adapter.Name): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Function to verify DNS settings
function Verify-DnsSettings {
    Write-Host "🔍 Verifying DNS settings..." -ForegroundColor Yellow

    $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }

    foreach ($adapter in $adapters) {
        Write-Host "Adapter: $($adapter.Name)" -ForegroundColor Blue
        $dnsServers = Get-DnsClientServerAddress -InterfaceAlias $adapter.Name -AddressFamily IPv4
        if ($dnsServers.ServerAddresses) {
            Write-Host "  DNS Servers: $($dnsServers.ServerAddresses -join ', ')" -ForegroundColor Green
        } else {
            Write-Host "  No DNS servers configured" -ForegroundColor Red
        }
    }
}

# Main execution
Write-Host "Starting DNS configuration process..." -ForegroundColor Cyan
Write-Host ""

# Clear DNS cache
Clear-DnsCache
Write-Host ""

# Set DNS servers
Set-DnsServers
Write-Host ""

# Verify settings
Verify-DnsSettings
Write-Host ""

Write-Host "🎉 DNS configuration completed!" -ForegroundColor Green
Write-Host "Note: You may need to restart your browser or flush browser DNS cache for changes to take effect." -ForegroundColor Yellow
Write-Host ""

# Instructions for Chrome DNS
Write-Host "🌐 Chrome DNS Configuration:" -ForegroundColor Cyan
Write-Host "1. Open Chrome and go to: chrome://net-internals/#dns" -ForegroundColor White
Write-Host "2. Click 'Clear host cache' button" -ForegroundColor White
Write-Host "3. Alternatively, you can use Chrome flags:" -ForegroundColor White
Write-Host "   - chrome://flags/#enable-async-dns" -ForegroundColor White
Write-Host "   - chrome://flags/#dns-over-https" -ForegroundColor White
Write-Host ""

Write-Host "🔄 If issues persist, try:" -ForegroundColor Yellow
Write-Host "1. Restart your computer" -ForegroundColor White
Write-Host "2. Disable/re-enable your network adapter" -ForegroundColor White
Write-Host "3. Use 'ipconfig /renew' to renew IP address" -ForegroundColor White
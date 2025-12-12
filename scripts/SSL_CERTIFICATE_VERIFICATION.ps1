# SSL Certificate Verification Script for Advancia Pay Ledger
# Tests HTTPS connections and SSL certificate validity

Write-Host "`n🔒 SSL CERTIFICATE VERIFICATION - ADVANCIA PAY LEDGER" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

$ErrorActionPreference = "Continue"

# Production URLs to test
$frontendUrl = "https://modular-saas-platform-frontend.vercel.app"
$backendUrl = "https://advancia-backend-upnrf.onrender.com"
$apiHealthUrl = "https://advancia-backend-upnrf.onrender.com/api/health"

# Custom domain URLs (when configured)
$customFrontendUrl = "https://advanciapayledger.com"
$customApiUrl = "https://api.advanciapayledger.com"
$customApiHealthUrl = "https://api.advanciapayledger.com/api/health"

$results = @{}

function Test-SSL-Certificate {
    param(
        [string]$Url,
        [string]$Name
    )

    Write-Host "`n🔍 Testing SSL for: $Name" -ForegroundColor Yellow
    Write-Host "   URL: $Url" -ForegroundColor Gray

    try {
        # Test HTTPS connection
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ HTTPS Connection: SUCCESS" -ForegroundColor Green
            Write-Host "   📊 Status Code: $($response.StatusCode)" -ForegroundColor Green

            # Check for SSL certificate info
            $certInfo = $null
            try {
                $webRequest = [System.Net.WebRequest]::Create($Url)
                $webRequest.Timeout = 30000
                $response = $webRequest.GetResponse()
                $cert = $response.GetResponseStream().Socket.Client.RemoteCertificate
                if ($cert) {
                    $certInfo = @{
                        Subject = $cert.Subject
                        Issuer = $cert.Issuer
                        ValidFrom = $cert.GetEffectiveDateString()
                        ValidTo = $cert.GetExpirationDateString()
                        Thumbprint = $cert.GetCertHashString()
                    }
                }
                $response.Close()
            } catch {
                Write-Host "   ⚠️  Certificate details unavailable" -ForegroundColor Yellow
            }

            if ($certInfo) {
                Write-Host "   🔐 SSL Certificate Details:" -ForegroundColor Cyan
                Write-Host "      Subject: $($certInfo.Subject)" -ForegroundColor White
                Write-Host "      Issuer: $($certInfo.Issuer)" -ForegroundColor White
                Write-Host "      Valid From: $($certInfo.ValidFrom)" -ForegroundColor White
                Write-Host "      Valid To: $($certInfo.ValidTo)" -ForegroundColor White
                Write-Host "      Thumbprint: $($certInfo.Thumbprint)" -ForegroundColor White
            }

            $results[$Name] = @{
                Status = "SUCCESS"
                Url = $Url
                StatusCode = $response.StatusCode
                Certificate = $certInfo
            }

            return $true
        } else {
            Write-Host "   ❌ HTTPS Connection: FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
            $results[$Name] = @{
                Status = "FAILED"
                Url = $Url
                StatusCode = $response.StatusCode
                Error = "HTTP $($response.StatusCode)"
            }
            return $false
        }
    }
    catch {
        Write-Host "   ❌ SSL Test Failed: $($_.Exception.Message)" -ForegroundColor Red
        $results[$Name] = @{
            Status = "ERROR"
            Url = $Url
            Error = $_.Exception.Message
        }
        return $false
    }
}

function Test-HTTP-Redirect {
    param(
        [string]$HttpUrl,
        [string]$HttpsUrl,
        [string]$Name
    )

    Write-Host "`n🔄 Testing HTTP to HTTPS redirect for: $Name" -ForegroundColor Yellow

    try {
        # Test HTTP URL (should redirect to HTTPS)
        $httpResponse = Invoke-WebRequest -Uri $HttpUrl -UseBasicParsing -TimeoutSec 10 -MaximumRedirection 0 -ErrorAction Stop

        if ($httpResponse.StatusCode -eq 301 -or $httpResponse.StatusCode -eq 302) {
            $location = $httpResponse.Headers['Location']
            if ($location -and $location -like "https://*") {
                Write-Host "   ✅ HTTP Redirect: SUCCESS (→ $location)" -ForegroundColor Green
                return $true
            } else {
                Write-Host "   ⚠️  HTTP Redirect: Partial (redirects but not to HTTPS)" -ForegroundColor Yellow
                return $false
            }
        } else {
            Write-Host "   ❌ HTTP Redirect: No redirect detected" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "   ⚠️  HTTP Redirect Test: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# ═══════════════════════════════════════════════════════════
# TEST CURRENT PRODUCTION URLS
# ═══════════════════════════════════════════════════════════

Write-Host "`n🌐 TESTING CURRENT PRODUCTION URLS" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Magenta

$frontendSuccess = Test-SSL-Certificate -Url $frontendUrl -Name "Frontend (Vercel)"
$backendSuccess = Test-SSL-Certificate -Url $backendUrl -Name "Backend (Render)"
$apiHealthSuccess = Test-SSL-Certificate -Url $apiHealthUrl -Name "API Health (Render)"

# ═══════════════════════════════════════════════════════════
# TEST CUSTOM DOMAIN URLS (IF CONFIGURED)
# ═══════════════════════════════════════════════════════════

Write-Host "`n🏠 TESTING CUSTOM DOMAIN URLS (IF CONFIGURED)" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Magenta

# Test custom domain (may not be configured yet)
$customFrontendSuccess = Test-SSL-Certificate -Url $customFrontendUrl -Name "Custom Frontend"
$customApiSuccess = Test-SSL-Certificate -Url $customApiUrl -Name "Custom API"
$customApiHealthSuccess = Test-SSL-Certificate -Url $customApiHealthUrl -Name "Custom API Health"

# ═══════════════════════════════════════════════════════════
# TEST HTTP REDIRECTS
# ═══════════════════════════════════════════════════════════

Write-Host "`n🔄 TESTING HTTP TO HTTPS REDIRECTS" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Magenta

$httpFrontendUrl = "http://modular-saas-platform-frontend.vercel.app"
$httpBackendUrl = "http://advancia-backend-upnrf.onrender.com"

Test-HTTP-Redirect -HttpUrl $httpFrontendUrl -HttpsUrl $frontendUrl -Name "Frontend HTTP Redirect"
Test-HTTP-Redirect -HttpUrl $httpBackendUrl -HttpsUrl $backendUrl -Name "Backend HTTP Redirect"

# ═══════════════════════════════════════════════════════════
# SSL CERTIFICATE VALIDATION SUMMARY
# ═══════════════════════════════════════════════════════════

Write-Host "`n📊 SSL CERTIFICATE VALIDATION SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

$successCount = 0
$totalTests = 0

foreach ($test in $results.GetEnumerator()) {
    $totalTests++
    $status = $test.Value.Status

    if ($status -eq "SUCCESS") {
        Write-Host "✅ $($test.Key): $status" -ForegroundColor Green
        $successCount++
    } elseif ($status -eq "FAILED") {
        Write-Host "❌ $($test.Key): $status ($($test.Value.Error))" -ForegroundColor Red
    } else {
        Write-Host "⚠️  $($test.Key): $status ($($test.Value.Error))" -ForegroundColor Yellow
    }
}

$successRate = if ($totalTests -gt 0) { [math]::Round(($successCount / $totalTests) * 100, 1) } else { 0 }

Write-Host "`n📈 SUCCESS RATE: $successCount/$totalTests ($successRate%)" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 50) { "Yellow" } else { "Red" })

# ═══════════════════════════════════════════════════════════
# RECOMMENDATIONS
# ═══════════════════════════════════════════════════════════

Write-Host "`n💡 SSL CERTIFICATE RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

if ($frontendSuccess -and $backendSuccess) {
    Write-Host "✅ Current production SSL certificates are working!" -ForegroundColor Green
    Write-Host "   • Vercel provides automatic SSL via Let's Encrypt" -ForegroundColor White
    Write-Host "   • Render provides automatic SSL via Let's Encrypt" -ForegroundColor White
} else {
    Write-Host "⚠️  Some SSL certificates are not working properly" -ForegroundColor Yellow
}

if ($customFrontendSuccess -and $customApiSuccess) {
    Write-Host "✅ Custom domain SSL certificates are active!" -ForegroundColor Green
} elseif ($customFrontendSuccess -or $customApiSuccess) {
    Write-Host "⚠️  Partial custom domain SSL configuration" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  Custom domain SSL not yet configured (DNS may still be propagating)" -ForegroundColor Blue
    Write-Host "   • DNS propagation takes 24-48 hours" -ForegroundColor White
    Write-Host "   • SSL certificates are automatic once DNS is configured" -ForegroundColor White
}

Write-Host "`n🔍 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. If custom domains aren't working, check DNS configuration" -ForegroundColor White
Write-Host "2. Wait 24-48 hours for DNS propagation if recently changed" -ForegroundColor White
Write-Host "3. Verify domain settings in Vercel and Render dashboards" -ForegroundColor White
Write-Host "4. Test SSL using: https://www.sslshopper.com/ssl-checker.html" -ForegroundColor White

Write-Host "`n✨ SSL verification complete!" -ForegroundColor Green
Write-Host "   Current SSL Status: $(if ($successRate -ge 80) { "EXCELLENT" } elseif ($successRate -ge 50) { "GOOD" } else { "NEEDS ATTENTION" })" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 50) { "Yellow" } else { "Red" })
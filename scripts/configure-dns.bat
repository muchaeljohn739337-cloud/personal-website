@echo off
REM DNS Configuration Batch Script for Advancia Pay Ledger
REM Clears DNS cache and provides instructions for DNS server configuration

echo ================================================
echo 🔧 Advancia Pay Ledger - DNS Configuration
echo ================================================
echo.

echo 🧹 Clearing DNS cache...
ipconfig /flushdns
if %errorlevel% equ 0 (
    echo ✅ DNS cache cleared successfully
) else (
    echo ❌ Failed to clear DNS cache
)
echo.

echo 🌐 To set DNS servers to Google (8.8.8.8) and Cloudflare (1.1.1.1):
echo 1. Right-click network icon in system tray
echo 2. Open Network & Internet settings
echo 3. Change adapter options
echo 4. Right-click your network adapter ^> Properties
echo 5. Select "Internet Protocol Version 4" ^> Properties
echo 6. Click "Use the following DNS server addresses:"
echo    Preferred DNS server: 8.8.8.8
echo    Alternate DNS server: 8.8.4.4
echo    (Or use 1.1.1.1 and 1.0.0.1 for Cloudflare)
echo 7. Click OK to save
echo.

echo 🌐 Chrome DNS Configuration:
echo 1. Open Chrome and navigate to: chrome://net-internals/#dns
echo 2. Click the "Clear host cache" button
echo 3. For additional DNS options, visit:
echo    - chrome://flags/#enable-async-dns
echo    - chrome://flags/#dns-over-https
echo.

echo 🔄 Additional troubleshooting:
echo - Restart your computer
echo - Disable/re-enable your network adapter
echo - Run: ipconfig /renew
echo.

echo 🎉 DNS cache cleared! Configure DNS servers as instructed above.
pause
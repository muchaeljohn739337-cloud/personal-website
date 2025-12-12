@echo off
echo 🚀 Starting Cloudflare Pages Deployment and Testing
echo.

cd /d "%~dp0"

echo 📦 Checking Node.js and npm...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo.
echo 🔐 Checking Wrangler authentication...
npx wrangler whoami
if %errorlevel% neq 0 (
    echo ❌ Wrangler not authenticated. Please run: npx wrangler auth login
    pause
    exit /b 1
)

echo.
echo 📦 Deploying to Cloudflare Pages...
cd frontend
npx wrangler pages deploy . --project-name advancia-platform --compatibility-date 2024-01-01
if %errorlevel% neq 0 (
    echo ❌ Deployment failed.
    cd ..
    pause
    exit /b 1
)

cd ..
echo.
echo ⏳ Waiting for deployment to propagate (30 seconds)...
timeout /t 30 /nobreak > nul

echo.
echo 🧪 Testing KV functionality...
node deploy-and-test.js
if %errorlevel% neq 0 (
    echo ❌ Testing failed.
    pause
    exit /b 1
)

echo.
echo 🎉 Deployment and testing completed successfully!
echo 🌐 Your site is live at: https://advancia-platform.workers.dev
echo 🔗 Test KV functions at: https://advancia-platform.workers.dev/functions/test-kv
echo.
pause
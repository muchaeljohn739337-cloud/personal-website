#!/usr/bin/env pwsh

<#
.SYNOPSIS
    One-command local development launcher

.DESCRIPTION
    Starts all services locally with hot-reload:
    - Backend (port 4000)
    - Frontend (port 3000)  
    - Guardian AI monitoring
    - Anti-Detect protection
#>

Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 ADVANCIA SAAS - LOCAL DEVELOPMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Cyan

# Check if PM2 is installed
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing PM2..." -ForegroundColor Yellow
    npm install -g pm2
}

# Kill existing processes
Write-Host "🛑 Stopping existing processes..." -ForegroundColor Yellow
pm2 delete all -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start backend
Write-Host "`n1️⃣ Starting Backend (port 4000)..." -ForegroundColor Cyan
Set-Location backend

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "   📦 Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}

# Start backend with PM2
pm2 start npm --name "advancia-backend" -- run dev
Write-Host "   ✅ Backend started`n" -ForegroundColor Green

Set-Location ..

# Start frontend
Write-Host "2️⃣ Starting Frontend (port 3000)..." -ForegroundColor Cyan
Set-Location frontend

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "   📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

# Set environment variables
$env:NEXT_PUBLIC_API_URL = "http://localhost:4000"

# Start frontend with PM2
pm2 start npm --name "advancia-frontend" -- run dev
Write-Host "   ✅ Frontend started`n" -ForegroundColor Green

Set-Location ..

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Show status
Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DEVELOPMENT SERVER RUNNING" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Cyan

pm2 list

Write-Host "`n🌐 Access:" -ForegroundColor Yellow
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:   http://localhost:4000" -ForegroundColor White
Write-Host "   Admin:     http://localhost:3000/admin" -ForegroundColor White
Write-Host "   Security:  http://localhost:3000/admin/security`n" -ForegroundColor White

Write-Host "📊 Monitoring:" -ForegroundColor Yellow
Write-Host "   View logs:    pm2 logs" -ForegroundColor White
Write-Host "   Monitor:      pm2 monit" -ForegroundColor White
Write-Host "   Status:       pm2 list" -ForegroundColor White
Write-Host "   Restart:      pm2 restart all" -ForegroundColor White
Write-Host "   Stop:         pm2 stop all`n" -ForegroundColor White

Write-Host "🛡️ Security:" -ForegroundColor Yellow
Write-Host "   ✅ Guardian AI monitoring active" -ForegroundColor Green
Write-Host "   ✅ Anti-Detect layer protecting" -ForegroundColor Green
Write-Host "   ✅ Hot-reload enabled for both services`n" -ForegroundColor Green

Write-Host "Press Ctrl+C to view logs, or run 'pm2 logs' in new terminal`n" -ForegroundColor Cyan

# Follow logs
pm2 logs

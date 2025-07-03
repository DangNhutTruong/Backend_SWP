#!/usr/bin/env powershell

# NoSmoke App - Development Startup Script

Write-Host "🚭 Starting NoSmoke Development Environment..." -ForegroundColor Green

# Check if .env exists
if (!(Test-Path "server\.env")) {
    Write-Host "❌ server\.env file not found!" -ForegroundColor Red
    Write-Host "Please create server\.env with Gmail and database configuration" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Required variables:" -ForegroundColor Yellow
    Write-Host "- EMAIL_USER=your-gmail@gmail.com" -ForegroundColor Cyan
    Write-Host "- EMAIL_PASS=your-app-password" -ForegroundColor Cyan
    Write-Host "- DATABASE_URL=your-railway-mysql-url" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Environment file found" -ForegroundColor Green

# Install dependencies if needed
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing all dependencies..." -ForegroundColor Yellow
    npm run install:all
}

Write-Host "🚀 Starting development servers..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "⚡ Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Start both servers
npm run dev

#!/usr/bin/env powershell

# NoSmoke App - Production Startup Script

Write-Host "🚭 Starting NoSmoke Application..." -ForegroundColor Green

# Check Node.js version
$nodeVersion = node --version
Write-Host "📦 Node.js Version: $nodeVersion" -ForegroundColor Blue

# Check if .env exists
if (!(Test-Path "server\.env")) {
    Write-Host "❌ server\.env file not found!" -ForegroundColor Red
    Write-Host "Please create server\.env with your configuration" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment file found" -ForegroundColor Green

# Install dependencies if needed
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm run install:all
}

# Build frontend for production
Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
cd client
npm run build
cd ..

# Start production server
Write-Host "🚀 Starting production server..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

npm run production

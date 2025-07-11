# PowerShell script để chạy production mode
# Sử dụng: .\run-prod.ps1

Write-Host "🚀 Starting NoSmoke Production Environment..." -ForegroundColor Green

# Kiểm tra dependencies
if (-not (Test-Path ".\server\node_modules")) {
    Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
    Push-Location .\server
    npm install
    Pop-Location
}

if (-not (Test-Path ".\client\node_modules")) {
    Write-Host "📦 Installing client dependencies..." -ForegroundColor Yellow
    Push-Location .\client
    npm install
    Pop-Location
}

# Build client cho production
Write-Host "🏗️ Building client for production..." -ForegroundColor Cyan
Push-Location .\client
npm run build
Pop-Location

# Chạy server production
Write-Host "🖥️ Starting Production Server..." -ForegroundColor Cyan
Push-Location .\server
$env:NODE_ENV = "production"
npm start
Pop-Location

Write-Host "✅ Production server started!" -ForegroundColor Green

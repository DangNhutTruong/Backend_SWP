# PowerShell script để chạy development mode
# Sử dụng: .\run-dev.ps1

Write-Host "🚀 Starting NoSmoke Development Environment..." -ForegroundColor Green

# Kiểm tra nếu node_modules chưa được cài
if (-not (Test-Path ".\node_modules")) {
    Write-Host "📦 Installing dependencies first..." -ForegroundColor Yellow
    .\install-all.ps1
}

# Kiểm tra server dependencies
if (-not (Test-Path ".\server\node_modules")) {
    Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
    Push-Location .\server
    npm install
    Pop-Location
}

# Kiểm tra client dependencies  
if (-not (Test-Path ".\client\node_modules")) {
    Write-Host "📦 Installing client dependencies..." -ForegroundColor Yellow
    Push-Location .\client
    npm install
    Pop-Location
}

Write-Host "🖥️ Starting Backend Server (Port 5000)..." -ForegroundColor Cyan
Write-Host "🌐 Starting Frontend Client (Port 3000)..." -ForegroundColor Cyan
Write-Host "📡 Starting concurrent development servers..." -ForegroundColor Yellow

# Chạy cả server và client đồng thời bằng concurrently
npm run dev

Write-Host "✅ Development servers started!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor White  
Write-Host "🖥️ Backend: http://localhost:5000" -ForegroundColor White

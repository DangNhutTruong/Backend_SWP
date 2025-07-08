# PowerShell script để cài đặt tất cả dependencies
# Sử dụng: .\install-all.ps1

Write-Host "📦 Installing NoSmoke Dependencies..." -ForegroundColor Green

# Install root dependencies
Write-Host "🔧 Installing root dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Root dependencies installation failed!" -ForegroundColor Red
    exit 1
}

# Install server dependencies  
Write-Host "🖥️ Installing server dependencies..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\server"
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Server dependencies installation failed!" -ForegroundColor Red
    exit 1
}

# Install client dependencies
Write-Host "🌐 Installing client dependencies..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\client"
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Client dependencies installation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All dependencies installed successfully!" -ForegroundColor Green
Write-Host "🚀 You can now run: .\run-dev.ps1" -ForegroundColor White

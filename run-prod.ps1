# PowerShell script để chạy production environment
# Sử dụng: .\run-prod.ps1

Write-Host "🚀 Starting NoSmoke Production Environment..." -ForegroundColor Green

# Function để kiểm tra port có đang được sử dụng không
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Kill processes nếu cần
if (Test-Port 5000) {
    Write-Host "⚠️ Port 5000 is in use, attempting to free it..." -ForegroundColor Yellow
    Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Build frontend
Write-Host "🔨 Building Frontend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\client"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

# Chạy backend production
Write-Host "🖥️ Starting Production Server..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\server"
npm start

Write-Host "✅ Production server started on http://localhost:5000" -ForegroundColor Green

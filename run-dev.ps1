# PowerShell script để chạy development environment
# Sử dụng: .\run-dev.ps1

Write-Host "🚀 Starting NoSmoke Development Environment..." -ForegroundColor Green

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

# Kiểm tra và kill các process đang sử dụng port 5000 và 5175
Write-Host "🔍 Checking for running processes..." -ForegroundColor Yellow

if (Test-Port 5000) {
    Write-Host "⚠️ Port 5000 is in use, attempting to free it..." -ForegroundColor Yellow
    Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

if (Test-Port 5175) {
    Write-Host "⚠️ Port 5175 is in use, attempting to free it..." -ForegroundColor Yellow
    Get-NetTCPConnection -LocalPort 5175 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Chuyển vào thư mục server và chạy backend
Write-Host "🖥️ Starting Backend Server (Port 5000)..." -ForegroundColor Cyan
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; npm start" -WindowStyle Normal

# Đợi 3 giây để backend khởi động
Start-Sleep -Seconds 3

# Chuyển vào thư mục client và chạy frontend  
Write-Host "🌐 Starting Frontend Server (Port 5175)..." -ForegroundColor Cyan
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; npm run dev" -WindowStyle Normal

Write-Host "✅ Both servers are starting up!" -ForegroundColor Green
Write-Host "🔗 Backend: http://localhost:5000" -ForegroundColor White
Write-Host "🔗 Frontend: http://localhost:5175" -ForegroundColor White
Write-Host "📝 Press any key to exit this script (servers will keep running)..." -ForegroundColor Gray

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

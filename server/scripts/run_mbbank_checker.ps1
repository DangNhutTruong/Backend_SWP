# MBBank Real Checker Setup and Run Script for Windows
Write-Host "🚀 Setting up MBBank Real Transaction Checker..." -ForegroundColor Green

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python is not installed. Please install Python 3.8 or higher." -ForegroundColor Red
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Check if .env.mbbank exists
if (-not (Test-Path ".env.mbbank")) {
    Write-Host "⚠️ Creating .env.mbbank file from example..." -ForegroundColor Yellow
    Copy-Item ".env.mbbank.example" ".env.mbbank"
    Write-Host "📝 Please edit .env.mbbank file and add your MBBank credentials before running the checker." -ForegroundColor Cyan
    Write-Host "🔐 Required: MBBANK_USERNAME, MBBANK_PASSWORD" -ForegroundColor Cyan
    exit 1
}

# Load environment variables from .env.mbbank
if (Test-Path ".env.mbbank") {
    Get-Content ".env.mbbank" | ForEach-Object {
        if ($_ -match "^([^#][^=]*)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Check if required environment variables are set
if (-not $env:MBBANK_USERNAME -or -not $env:MBBANK_PASSWORD) {
    Write-Host "❌ MBBank credentials not found in .env.mbbank file" -ForegroundColor Red
    Write-Host "📝 Please edit .env.mbbank and set MBBANK_USERNAME and MBBANK_PASSWORD" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "🚀 Starting MBBank Real Transaction Checker..." -ForegroundColor Green
python mbbank_real_checker.py

@echo off
echo ========================================
echo      RAILWAY DATABASE CONNECTION TEST
echo ========================================
echo.

echo 📁 Navigating to server directory...
cd /d "%~dp0"

echo 📋 Checking .env file...
if exist .env (
    echo ✅ .env file found
    echo.
    echo 🔍 Checking DATABASE_URL...
    findstr "DATABASE_URL" .env
    echo.
) else (
    echo ❌ .env file not found!
    echo Please create .env file first
    pause
    exit /b 1
)

echo 📦 Checking dependencies...
if not exist node_modules (
    echo ⚠️ Installing dependencies...
    npm install
)

echo.
echo 🚀 Starting server with Railway database...
echo ⚠️ Look for these success messages:
echo   ✅ Database connected successfully
echo   📍 Connected to Railway MySQL via connection string
echo   🌐 Database host: containers-us-west-xxx.railway.app
echo.
echo Press Ctrl+C to stop server
echo.

npm start

pause

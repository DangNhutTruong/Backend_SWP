@echo off
echo ========================================
echo         NOSMOKE SERVER STARTUP TEST
echo ========================================
echo.

echo 📁 Checking current directory...
cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo 📦 Checking package.json...
if exist package.json (
    echo ✅ package.json found
) else (
    echo ❌ package.json not found
    pause
    exit /b 1
)
echo.

echo 🔍 Checking node_modules...
if exist node_modules (
    echo ✅ node_modules found
) else (
    echo ⚠️ node_modules not found, installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ npm install failed
        pause
        exit /b 1
    )
)
echo.

echo 📋 Checking .env file...
if exist .env (
    echo ✅ .env file found
    echo.
    echo 🔧 Environment variables:
    findstr /V "PASSWORD\|SECRET\|API_KEY" .env 2>nul || echo No .env variables to display safely
) else (
    echo ⚠️ .env file not found, creating from template...
    echo DATABASE_URL=mysql://user:password@localhost:3306/nosmoke > .env
    echo JWT_SECRET=your-secret-key-here >> .env
    echo JWT_EXPIRES_IN=24h >> .env
    echo JWT_REFRESH_EXPIRES_IN=7d >> .env
    echo EMAIL_USER=your-email@gmail.com >> .env
    echo EMAIL_PASSWORD=your-app-password >> .env
    echo CLIENT_URL=http://localhost:5173 >> .env
    echo PORT=5000 >> .env
    echo NODE_ENV=development >> .env
    echo RATE_LIMIT_WINDOW=15 >> .env
    echo RATE_LIMIT_MAX_REQUESTS=100 >> .env
    echo LOGIN_RATE_LIMIT_MAX=5 >> .env
    echo ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000 >> .env
    echo ✅ Created .env template - please update with your values
)
echo.

echo 🚀 Starting server...
echo Press Ctrl+C to stop the server
echo.
npm start

pause

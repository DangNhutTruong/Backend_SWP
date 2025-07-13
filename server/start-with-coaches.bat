@echo off
echo =======================================
echo Starting NoSmoke Server with Coach Support
echo =======================================
echo.

:: Create coach accounts first
echo 👨‍⚕️ Creating coach accounts...
node create_coach_accounts.js
echo.

:: Start the server
echo 🚀 Starting server...
node server.js

pause

@echo off
echo ======================================================
echo   NoSmoke Backend Server Startup
echo ======================================================
echo.

echo Checking and initializing database...
node check_database.js

echo.
echo Starting server...
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js

echo.
echo Server stopped.
pause

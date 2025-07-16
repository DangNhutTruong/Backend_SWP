@echo off
echo ======================================================
echo   NoSmoke System Startup
echo ======================================================
echo.

echo Starting backend server...
start cmd /k "cd server && start-server.bat"

echo.
echo Waiting for backend to initialize (5 seconds)...
timeout /t 5 /nobreak >nul

echo.
echo Starting frontend...
start cmd /k "cd client && npm run dev"

echo.
echo System started successfully!
echo.
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:5173
echo.
echo Press any key to exit this window (servers will continue running)
pause >nul 
@echo off
echo ========================================
echo    Enhanced Manual System Tester
echo ========================================
echo.

echo Starting Backend Server...
cd /d "c:\Users\TRUONG\Documents\GitHub\Backend_SWP\server"
start "Backend Server" cmd /k "npm start"

timeout /t 5

echo.
echo Starting Frontend Development Server...
cd /d "c:\Users\TRUONG\Documents\GitHub\Backend_SWP\client"
start "Frontend Server" cmd /k "npm run dev"

timeout /t 5

echo.
echo Running Enhanced Payment System Tests...
cd /d "c:\Users\TRUONG\Documents\GitHub\Backend_SWP\server\scripts"
node test_enhanced_payment.js

echo.
echo ========================================
echo Test completed! Check the results above.
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo ========================================
pause

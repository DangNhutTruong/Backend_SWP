@echo off
echo.
echo ======================================
echo    🚀 KHỞI ĐỘNG ỨNG DỤNG NOSMOKE
echo ======================================
echo.

cd /d "c:\Users\ADMIN\Documents\GitHub\Backend_SWP"

echo 📡 Bước 1: Khởi động Backend Server...
echo.
start "NoSmoke Backend" cmd /k "cd server && echo 🔧 Starting NoSmoke Backend... && node server.js"

echo ⏳ Đợi backend khởi động (5 giây)...
timeout /t 5 /nobreak > nul

echo.
echo 🌐 Bước 2: Khởi động Frontend Client...
echo.
start "NoSmoke Frontend" cmd /k "cd client && echo 🔧 Starting NoSmoke Frontend... && npm run dev"

echo.
echo ✅ HOÀN TẤT!
echo.
echo 📊 Backend: http://localhost:5000
echo 🌐 Frontend: http://localhost:5173
echo 🔗 Demo kết nối: http://localhost:5173/backend-demo
echo.
echo ⚠️  Lưu ý: Đợi vài giây để cả hai service khởi động hoàn tất
echo.
pause

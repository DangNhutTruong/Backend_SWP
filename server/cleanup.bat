@echo off
echo Cleaning up test and simulation files...

del /f /q test-db-connection.js 2>nul
del /f /q test-database.js 2>nul
del /f /q simple-test-server.js 2>nul
del /f /q mysql-test.js 2>nul
del /f /q http-test-server.js 2>nul
del /f /q express-test-server.js 2>nul
del /f /q database-test-server.js 2>nul
del /f /q database-simulation-server.js 2>nul
del /f /q mysql-real-backend.js 2>nul
del /f /q mysql-real-backend.cjs 2>nul
del /f /q mysql-real-server.js 2>nul
del /f /q reset-database.js 2>nul

echo Cleanup completed!
del /f /q cleanup.bat

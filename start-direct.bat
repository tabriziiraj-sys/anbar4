@echo off
echo.
echo ========================================
echo   Starting with direct Vite execution
echo ========================================
echo.

if not exist "node_modules" (
    echo [ERROR] Run install.bat first!
    pause
    exit /b 1
)

echo Opening browser in 3 seconds...
echo Application URL: http://localhost:3000
echo.
echo Press Ctrl+C to stop.
echo.

start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

node node_modules\vite\bin\vite.js --host 0.0.0.0 --port 3000

pause

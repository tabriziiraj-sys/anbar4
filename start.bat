@echo off
echo.
echo ========================================
echo   Starting Inventory Management System
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [ERROR] Dependencies are not installed!
    echo Please run install.bat first.
    echo.
    pause
    exit /b 1
)

echo Checking if port 3000 is available...

REM Check if port 3000 is in use
netstat -ano | findstr :3000 >nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [WARNING] Port 3000 is already in use!
    echo Attempting to free the port...
    echo.
    
    REM Get the PID using port 3000
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        echo Killing process with PID: %%a
        taskkill /F /PID %%a >nul 2>&1
    )
    
    timeout /t 2 /nobreak >nul
    echo Port 3000 freed.
    echo.
)

echo Starting development server...
echo.
echo The application will open automatically in your browser.
echo If it doesn't open, visit: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server.
echo.

REM Start the development server
npm run dev

pause

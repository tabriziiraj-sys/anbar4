@echo off
echo ========================================
echo   Starting Inventory Management System
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] Dependencies are not installed!
    echo Please run install.bat first.
    echo.
    echo Do you want to install dependencies now? (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        call install.bat
    ) else (
        pause
        exit /b 1
    )
)

echo.
echo Starting application...
echo.
echo ========================================
echo   Application will be available at:
echo   http://localhost:3000
echo ========================================
echo.
echo Press Ctrl+C to stop the application.
echo.

call npm run dev

pause

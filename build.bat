@echo off
echo ========================================
echo   Building Production Version
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [ERROR] Dependencies are not installed!
    echo Please run install.bat first.
    pause
    exit /b 1
)

echo Building production version...
echo.
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Build completed successfully!
echo ========================================
echo.
echo Output files are in the dist folder.
echo.
pause

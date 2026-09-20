@echo off
echo ========================================
echo   Installing Project Dependencies
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install from https://nodejs.org
    pause
    exit /b 1
)

REM Show Node.js version
echo Node.js version:
node --version
echo.

REM Install dependencies
echo Installing dependencies...
echo.
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Installation failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Installation completed successfully!
echo ========================================
echo.
echo Run start.bat to launch the application.
echo.
pause

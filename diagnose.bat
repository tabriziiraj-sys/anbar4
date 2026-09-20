@echo off
echo.
echo ========================================
echo   System Diagnostic
echo ========================================
echo.

echo [1/5] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Node.js not found!
) else (
    echo [OK] Node.js found:
    node --version
)
echo.

echo [2/5] Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] npm not found!
) else (
    echo [OK] npm found:
    npm --version
)
echo.

echo [3/5] Checking node_modules...
if not exist "node_modules" (
    echo [FAIL] node_modules not found!
    echo Please run install.bat first.
) else (
    echo [OK] node_modules exists
)
echo.

echo [4/5] Checking vite installation...
if not exist "node_modules\vite\bin\vite.js" (
    echo [FAIL] Vite not found in node_modules!
) else (
    echo [OK] Vite found
)
echo.

echo [5/5] Checking port 3000...
netstat -ano | findstr :3000 >nul
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Port 3000 is in use:
    netstat -ano | findstr :3000
) else (
    echo [OK] Port 3000 is available
)
echo.

echo ========================================
echo   Diagnostic Complete
echo ========================================
echo.

if exist "node_modules" (
    echo To start the application, run: start.bat
    echo.
    echo Or try direct execution: start-direct.bat
) else (
    echo Please run install.bat first to install dependencies.
)

echo.
pause

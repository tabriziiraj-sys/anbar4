@echo off
chcp 65001 >nul
echo ========================================
echo   ساخت نسخه Production
echo ========================================
echo.

REM بررسی وجود node_modules
if not exist "node_modules" (
    echo [خطا] وابستگی‌ها نصب نشده‌اند!
    echo ابتدا فایل install.bat را اجرا کنید.
    pause
    exit /b 1
)

echo در حال ساخت نسخه Production...
echo.
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [خطا] ساخت با مشکل مواجه شد!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ساخت با موفقیت انجام شد!
echo ========================================
echo.
echo فایل‌های نهایی در پوشه dist قرار دارند.
echo.
pause

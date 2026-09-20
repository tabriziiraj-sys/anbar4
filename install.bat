@echo off
chcp 65001 >nul
echo ========================================
echo   نصب وابستگی‌های پروژه
echo ========================================
echo.

REM بررسی وجود Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [خطا] Node.js نصب نیست!
    echo لطفاً از https://nodejs.org دانلود و نصب کنید.
    pause
    exit /b 1
)

REM نمایش نسخه Node.js
echo نسخه Node.js:
node --version
echo.

REM نصب وابستگی‌ها
echo در حال نصب وابستگی‌ها...
echo.
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [خطا] نصب وابستگی‌ها با مشکل مواجه شد!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   نصب با موفقیت انجام شد!
echo ========================================
echo.
echo برای اجرای برنامه از فایل start.bat استفاده کنید.
echo.
pause

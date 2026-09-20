@echo off
chcp 65001 >nul
echo ========================================
echo   اجرای سیستم مدیریت انبار
echo ========================================
echo.

REM بررسی وجود node_modules
if not exist "node_modules" (
    echo [هشدار] وابستگی‌ها نصب نشده‌اند!
    echo ابتدا فایل install.bat را اجرا کنید.
    echo.
    echo آیا می‌خواهید وابستگی‌ها را نصب کنید؟ (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        call install.bat
    ) else (
        pause
        exit /b 1
    )
)

echo.
echo در حال اجرای برنامه...
echo.
echo ========================================
echo   برنامه در آدرس زیر در دسترس است:
echo   http://localhost:3000
echo ========================================
echo.
echo برای توقف برنامه Ctrl+C را فشار دهید.
echo.

call npm run dev

pause

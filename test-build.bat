@echo off
echo Testing React build...
cd "c:\Users\Chandrakant\walmart-sparkthon\product-tracibility\client"
echo Current directory: %cd%
echo Running npm run build...
npm run build
echo Build completed with exit code: %errorlevel%
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)
echo Build successful!
dir build\static\js
pause

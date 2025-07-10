@echo off
echo 🚀 Starting enhanced build process...

REM Navigate to client directory
cd client

REM Clean up previous builds and dependencies
echo 🧹 Cleaning up previous builds...
if exist node_modules rmdir /s /q node_modules
if exist build rmdir /s /q build
if exist .next rmdir /s /q .next
if exist package-lock.json del package-lock.json

REM Install dependencies with legacy peer deps to avoid conflicts
echo 📦 Installing dependencies...
npm install --legacy-peer-deps

REM Set environment variables for stable build
set GENERATE_SOURCEMAP=false
set CI=false
set NODE_OPTIONS=--max-old-space-size=4096

REM Build the application
echo 🔨 Building application...
npm run build

REM Verify build output
echo ✅ Build completed. Verifying output...

if exist build (
    echo ✅ Build directory exists
    
    if exist build\index.html (
        echo ✅ index.html exists
    ) else (
        echo ❌ index.html missing
        exit /b 1
    )
    
    if exist build\static (
        echo ✅ Static assets directory exists
        
        REM Count JS files
        for /f %%i in ('dir /b build\static\js\*.js ^| find /c /v ""') do set js_count=%%i
        echo 📊 Found %js_count% JavaScript files
        
        REM List some chunk files for verification
        echo 📋 JavaScript chunks:
        dir build\static\js\*.js
        
        if %js_count% gtr 0 (
            echo ✅ JavaScript chunks generated successfully
        ) else (
            echo ❌ No JavaScript chunks found
            exit /b 1
        )
    ) else (
        echo ❌ Static assets directory missing
        exit /b 1
    )
    
    REM Check _redirects file
    if exist build\_redirects (
        echo ✅ _redirects file exists
    ) else (
        echo ⚠️ _redirects file missing - copying from public/
        copy public\_redirects build\
    )
    
    echo 🎉 Build verification completed successfully!
    
) else (
    echo ❌ Build failed - build directory not found
    exit /b 1
)

echo ✅ Enhanced build process completed successfully!
pause

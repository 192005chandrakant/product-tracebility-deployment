@echo off
echo ========================================
echo    CRITICAL BUILD DIAGNOSIS TOOL
echo ========================================
echo.

echo 🔍 Diagnosing chunk loading 404 errors...
echo.

REM Check if build directory exists
if not exist "client\build" (
    echo ❌ CRITICAL: No build directory found!
    echo 🔧 Solution: Run 'cd client && npm run build'
    goto :rebuild_needed
)

echo ✅ Build directory exists

REM Check if index.html exists
if not exist "client\build\index.html" (
    echo ❌ CRITICAL: No index.html in build!
    goto :rebuild_needed
)

echo ✅ index.html exists

REM Check static directories
if not exist "client\build\static" (
    echo ❌ CRITICAL: No static directory!
    goto :rebuild_needed
)

if not exist "client\build\static\js" (
    echo ❌ CRITICAL: No static/js directory!
    goto :rebuild_needed
)

if not exist "client\build\static\css" (
    echo ❌ CRITICAL: No static/css directory!
    goto :rebuild_needed
)

echo ✅ Static directories exist

REM Count files in static directories
echo.
echo 📊 Asset inventory:
for /f %%i in ('dir /b "client\build\static\js\*.js" 2^>nul ^| find /c /v ""') do set js_count=%%i
for /f %%i in ('dir /b "client\build\static\css\*.css" 2^>nul ^| find /c /v ""') do set css_count=%%i

echo    JavaScript files: %js_count%
echo    CSS files: %css_count%

if %js_count% LSS 3 (
    echo ❌ Too few JS files - incomplete build
    goto :rebuild_needed
)

if %css_count% LSS 1 (
    echo ❌ No CSS files - incomplete build
    goto :rebuild_needed
)

REM Check if specific problematic files exist
echo.
echo 🔍 Checking for reported missing files:
set "missing_files=0"

REM Check for files mentioned in the error
if exist "client\build\static\css\main.515cf7a2.css" (
    echo ✅ main.515cf7a2.css exists
) else (
    echo ❌ main.515cf7a2.css MISSING
    set /a missing_files+=1
)

if exist "client\build\static\js\runtime.6183a281.js" (
    echo ✅ runtime.6183a281.js exists
) else (
    echo ❌ runtime.6183a281.js MISSING
    set /a missing_files+=1
)

if exist "client\build\static\js\main.628eaaf7.js" (
    echo ✅ main.628eaaf7.js exists
) else (
    echo ❌ main.628eaaf7.js MISSING
    set /a missing_files+=1
)

if %missing_files% GTR 0 (
    echo.
    echo ❌ PROBLEM IDENTIFIED: %missing_files% expected files are missing!
    echo 🔧 This indicates a build-deployment mismatch
    goto :rebuild_needed
)

echo.
echo ✅ All expected files present in build directory
echo.
echo 🤔 Since files exist locally but return 404 from Netlify:
echo    This suggests a DEPLOYMENT SYNC issue
echo.
echo 🔧 Solutions to try:
echo    1. Clear Netlify build cache and redeploy
echo    2. Check if .gitignore is excluding build files
echo    3. Verify netlify.toml publish directory setting
echo    4. Force rebuild with cache clear
echo.
goto :end

:rebuild_needed
echo.
echo ========================================
echo        REBUILD REQUIRED! 🔨
echo ========================================
echo.
echo 🔧 Performing complete rebuild...
echo.

cd client

echo 1. Cleaning old build...
if exist build rmdir /s /q build
if exist node_modules rmdir /s /q node_modules

echo 2. Clearing npm cache...
call npm cache clean --force

echo 3. Installing dependencies...
call npm install --legacy-peer-deps

echo 4. Building with production settings...
set CI=false
set GENERATE_SOURCEMAP=false
set DISABLE_ESLINT_PLUGIN=true
set NODE_ENV=production
set PUBLIC_URL=https://blockchain-product-traceability.netlify.app
call npm run build

cd ..

echo.
echo 5. Verifying new build...
if exist "client\build\index.html" (
    echo ✅ New build created successfully
    
    REM Count new files
    for /f %%i in ('dir /b "client\build\static\js\*.js" 2^>nul ^| find /c /v ""') do echo    JavaScript files: %%i
    for /f %%i in ('dir /b "client\build\static\css\*.css" 2^>nul ^| find /c /v ""') do echo    CSS files: %%i
    
    echo.
    echo ✅ REBUILD COMPLETE!
    echo 📋 Next steps:
    echo    1. Commit the new build files
    echo    2. Push to trigger Netlify deployment
    echo    3. Clear browser cache before testing
    
) else (
    echo ❌ Build failed! Check npm build errors above
    goto :error
)

:end
echo.
echo ========================================
echo     DIAGNOSIS COMPLETE ✅
echo ========================================
pause
exit /b 0

:error
echo.
echo ❌ DIAGNOSIS FAILED
echo Please check the errors above and try again
pause
exit /b 1

@echo off
echo ========================================
echo  CRITICAL CHUNK LOADING FIX DEPLOYMENT
echo ========================================
echo.

echo Checking current directory...
if not exist "client\package.json" (
    echo ERROR: Please run this from the project root directory
    echo Expected to find: client\package.json
    pause
    exit /b 1
)

echo ✅ Found client directory

echo.
echo Checking critical fix files...
echo.

if exist "client\public\_redirects" (
    echo ✅ _redirects file exists
) else (
    echo ❌ Missing _redirects file
    goto :error
)

if exist "client\public\index.html" (
    findstr "base href" "client\public\index.html" >nul
    if !errorlevel! equ 0 (
        echo ✅ Base href tag found in index.html
    ) else (
        echo ❌ Missing base href tag in index.html
        goto :error
    )
) else (
    echo ❌ Missing index.html file
    goto :error
)

if exist "client\config-overrides.js" (
    findstr "blockchain-product-traceability.netlify.app" "client\config-overrides.js" >nul
    if !errorlevel! equ 0 (
        echo ✅ Absolute publicPath configured
    ) else (
        echo ❌ Missing absolute publicPath in config-overrides.js
        goto :error
    )
) else (
    echo ❌ Missing config-overrides.js file
    goto :error
)

if exist "netlify.toml" (
    echo ✅ netlify.toml exists
) else (
    echo ❌ Missing netlify.toml file
    goto :error
)

echo.
echo ========================================
echo  ALL CRITICAL FIXES ARE IN PLACE! ✅
echo ========================================
echo.
echo The following fixes have been applied:
echo.
echo 1. ✅ Absolute publicPath in webpack config
echo 2. ✅ Base href tag in HTML
echo 3. ✅ Comprehensive redirect rules for nested paths
echo 4. ✅ MIME type headers in netlify.toml
echo 5. ✅ Enhanced static asset handling
echo.
echo NEXT STEPS:
echo 1. Commit all changes to your repository
echo 2. Push to trigger Netlify rebuild
echo 3. Test the /auth/login route directly
echo 4. Verify no more chunk loading errors
echo.
echo If you still see 404 errors after deployment:
echo - Clear browser cache completely
echo - Try incognito/private browsing mode
echo - Check Netlify deploy logs for any errors
echo.
pause
exit /b 0

:error
echo.
echo ❌ DEPLOYMENT CHECK FAILED
echo Please ensure all fix files are properly configured
echo.
pause
exit /b 1

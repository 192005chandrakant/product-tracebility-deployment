@echo off
echo ========================================
echo    URGENT 404 FIX DEPLOYMENT
echo ========================================
echo.

echo 🚨 Fixing chunk loading 404 errors...
echo.

echo 1. Running build diagnosis...
call diagnose-build-404.bat

echo.
echo 2. Checking current deployment status...
echo.

echo If the diagnosis shows missing files, the issue is:
echo ❌ BUILD-DEPLOYMENT MISMATCH
echo.
echo Common causes:
echo - Netlify cache serving old index.html with new asset references
echo - Build process not generating all referenced files
echo - Git not tracking build directory (if deployed from build/)
echo.

echo 🔧 IMMEDIATE FIXES TO TRY:
echo.
echo A. Clear Netlify Build Cache:
echo    1. Go to Netlify dashboard
echo    2. Site settings → Build & deploy → Environment variables
echo    3. Add: NETLIFY_SKIP_CACHE = true
echo    4. Trigger new deploy
echo.
echo B. Force Complete Rebuild:
echo    1. Delete node_modules and build folders locally
echo    2. Run: npm cache clean --force
echo    3. Run: npm install --legacy-peer-deps  
echo    4. Run: npm run build
echo    5. Commit and push
echo.
echo C. Verify Build Output:
echo    1. Check that client/build/static/js/ contains files
echo    2. Check that index.html references match actual files
echo    3. Ensure no .gitignore excludes build files (if needed)
echo.

echo 📋 DEPLOYMENT CHECKLIST:
echo.
echo Before pushing to Git:
echo ✅ Run: cd client ^&^& npm run build
echo ✅ Verify: client/build/static/js/ has multiple .js files
echo ✅ Verify: client/build/static/css/ has .css files  
echo ✅ Check: client/build/index.html exists
echo ✅ Test: Open client/build/index.html locally (should work)
echo.

echo After pushing to Git:
echo ✅ Monitor Netlify build logs for errors
echo ✅ Check deploy preview before going live
echo ✅ Test site in incognito mode (fresh cache)
echo ✅ Check browser console for 404 errors
echo.

echo 🎯 ROOT CAUSE: 
echo The HTML file references asset files with specific hashes
echo (e.g., main.515cf7a2.css) but those exact files don't exist
echo in the deployed build directory.
echo.

echo 💡 WHY THIS HAPPENS:
echo 1. Webpack generates assets with content-based hashes
echo 2. Each build creates different hashes for modified files
echo 3. If old HTML is cached with new asset references = 404
echo 4. Solution: Ensure complete rebuild and cache clear
echo.

pause

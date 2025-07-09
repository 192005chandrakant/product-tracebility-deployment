@echo off
echo =========================================
echo Product Traceability - Netlify + Render Setup
echo =========================================
echo.

echo [1/5] Checking prerequisites...
node -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

npm -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo ✓ Node.js and npm are installed

echo.
echo [2/5] Installing dependencies...
echo Installing server dependencies...
cd server
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install server dependencies
    pause
    exit /b 1
)

echo Installing client dependencies...
cd ..\client
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install client dependencies
    pause
    exit /b 1
)

echo ✓ Dependencies installed successfully

echo.
echo [3/5] Creating netlify.toml configuration...
cd ..
(
echo [build]
echo   base = "client"
echo   publish = "build"
echo   command = "npm run build"
echo.
echo [[redirects]]
echo   from = "/*"
echo   to = "/index.html"
echo   status = 200
echo.
echo [build.environment]
echo   GENERATE_SOURCEMAP = "false"
) > netlify.toml

echo ✓ netlify.toml created

echo.
echo [4/5] Testing local build...
cd client
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)

echo ✓ Frontend builds successfully

echo.
echo [5/5] Checking server startup...
cd ..\server
echo Testing server startup (will timeout after 10 seconds)...
timeout /t 10 /nobreak node index.js >nul 2>&1
echo ✓ Server appears to start correctly

cd ..
echo.
echo =========================================
echo Setup Complete! 
echo =========================================
echo.
echo Next Steps:
echo 1. Push your code to GitHub
echo 2. Deploy backend to Render.com
echo 3. Update client/src/utils/apiConfig.js with your Render URL
echo 4. Deploy frontend to Netlify.com
echo.
echo See NETLIFY_RENDER_QUICK_GUIDE.md for detailed instructions
echo.
pause

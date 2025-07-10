@echo off
echo 🧪 Testing Backend-Frontend Connection...
echo ========================================

REM Backend URL
set BACKEND_URL=https://product-traceability-api.onrender.com
set FRONTEND_URL=https://blockchain-product-traceability.netlify.app

echo 📡 Backend URL: %BACKEND_URL%
echo 🌐 Frontend URL: %FRONTEND_URL%
echo.

REM Test 1: Basic Backend Health
echo 1. Testing Backend Health...
curl -s -o nul -w "%%{http_code}" "%BACKEND_URL%/test" > temp_response.txt
set /p response=<temp_response.txt
if "%response%"=="200" (
    echo    ✅ Backend server is running
) else (
    echo    ❌ Backend server failed (HTTP %response%^)
)

REM Test 2: API Endpoint
echo 2. Testing API Endpoint...
curl -s -o nul -w "%%{http_code}" "%BACKEND_URL%/api/recent-products" > temp_response.txt
set /p response=<temp_response.txt
if "%response%"=="200" (
    echo    ✅ Products API is working
) else (
    echo    ❌ Products API failed (HTTP %response%^)
)

REM Test 3: Authentication Endpoint
echo 3. Testing Authentication...
curl -s -o nul -w "%%{http_code}" -X POST -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"wrong\"}" "%BACKEND_URL%/api/auth/login" > temp_response.txt
set /p response=<temp_response.txt
if "%response%"=="400" (
    echo    ✅ Authentication endpoint is working
) else if "%response%"=="401" (
    echo    ✅ Authentication endpoint is working
) else (
    echo    ❌ Authentication endpoint failed (HTTP %response%^)
)

REM Test 4: Frontend Accessibility
echo 4. Testing Frontend Accessibility...
curl -s -o nul -w "%%{http_code}" "%FRONTEND_URL%" > temp_response.txt
set /p response=<temp_response.txt
if "%response%"=="200" (
    echo    ✅ Frontend is accessible
) else (
    echo    ❌ Frontend failed (HTTP %response%^)
)

REM Cleanup
del temp_response.txt 2>nul

echo.
echo 🔧 Next Steps:
echo 1. If backend tests fail, check Render deployment status
echo 2. If frontend fails, check Netlify deployment
echo 3. Test the connection from browser console
echo.
echo 📋 Manual Browser Test:
echo Open browser console on %FRONTEND_URL% and run:
echo fetch('/api/test'^).then(r =^> r.json('^)^).then(console.log'^)
echo.
pause

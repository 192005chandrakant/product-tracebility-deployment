@echo off
echo ========================================
echo   Complete API CORS Fix - Restart Script
echo ========================================

echo.
echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Waiting for processes to stop...
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
start "Backend Server" cmd /k "cd /d %~dp0..\server && echo Starting backend on port 5000... && npm start"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting frontend development server...
start "Frontend Server" cmd /k "cd /d %~dp0 && echo Starting frontend on port 3000... && npm start"

echo.
echo ========================================
echo   Both servers are starting...
echo   Backend: http://localhost:5000
echo   Frontend: http://localhost:3000
echo   
echo   Expected Results:
echo   - No CORS errors in console
echo   - API requests work through proxy
echo   - Clean performance logging
echo ========================================
echo.
echo Testing backend connection...
timeout /t 3 /nobreak >nul
curl -s http://localhost:5000/test | find "Server is running" && echo Backend is ready! || echo Backend starting...

echo.
echo Opening frontend in browser in 10 seconds...
timeout /t 10 /nobreak >nul
start http://localhost:3000

echo.
echo All servers started! Check the opened windows for status.
pause

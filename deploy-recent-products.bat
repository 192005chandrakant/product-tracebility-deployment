@echo off
echo =========================================
echo Product Traceability Update Deployment
echo =========================================
echo.

echo Checking environment...
node -v
npm -v

echo.
echo Pulling latest changes...
git pull

echo.
echo Updating backend...
cd server
npm install
echo.

echo Updating frontend...
cd ../client
npm install
npm run build

echo.
echo Restarting services...
cd ..
echo The deployment is complete! You may need to manually restart your server.
echo Suggested commands:
echo   - For PM2: pm2 restart product-traceability-api
echo   - For direct node: node server/index.js

echo.
echo Recent Products feature has been deployed.
echo Please verify it's working by visiting the home page while logged in.
echo See RECENT_PRODUCTS_TESTING.md for testing instructions.
echo.
echo =========================================

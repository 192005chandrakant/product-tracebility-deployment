@echo off
REM Product Traceability Application Deployment Script
echo ===================================================
echo Product Traceability Application - Deployment Script
echo ===================================================
echo.

REM Check for Node.js installation
WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed. Please install Node.js before proceeding.
    exit /b 1
)

REM Check for npm installation
WHERE npm >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Error: npm is not installed. Please install npm before proceeding.
    exit /b 1
)

echo [1/6] Installing root dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install root dependencies.
    exit /b 1
)

echo [2/6] Compiling and deploying smart contract...
call npx hardhat compile
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to compile smart contract.
    exit /b 1
)

echo Select deployment network:
echo 1. Sepolia Testnet (Recommended for testing)
echo 2. Ethereum Mainnet (Production - costs real ETH)
set /p NETWORK_CHOICE="Enter choice (1 or 2): "

if "%NETWORK_CHOICE%"=="1" (
    set NETWORK=sepolia
) else if "%NETWORK_CHOICE%"=="2" (
    set NETWORK=mainnet
    echo WARNING: You are about to deploy to Ethereum Mainnet which will cost real ETH.
    set /p CONFIRM="Are you sure? (y/n): "
    if /I NOT "%CONFIRM%"=="y" (
        echo Deployment cancelled.
        exit /b 0
    )
) else (
    echo Invalid choice. Defaulting to Sepolia Testnet.
    set NETWORK=sepolia
)

call npx hardhat run scripts/deploy.js --network %NETWORK%
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to deploy smart contract.
    exit /b 1
)

echo [3/6] Updating contract address in environment files...
echo Please enter the deployed contract address from above:
set /p CONTRACT_ADDRESS="Contract Address: "

REM Update the contract address in server .env file
if exist "server\.env" (
    echo Updating server\.env...
    powershell -Command "(Get-Content server\.env) -replace 'CONTRACT_ADDRESS=.*', 'CONTRACT_ADDRESS=%CONTRACT_ADDRESS%' | Set-Content server\.env"
)

echo [4/6] Building and deploying server...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install server dependencies.
    cd ..
    exit /b 1
)

echo Server deployment options:
echo 1. Local development server
echo 2. Production server with PM2 (requires PM2 installed)
set /p SERVER_DEPLOY="Enter choice (1 or 2): "

if "%SERVER_DEPLOY%"=="2" (
    WHERE pm2 >nul 2>nul
    IF %ERRORLEVEL% NEQ 0 (
        echo PM2 not found. Installing PM2 globally...
        call npm install -g pm2
    )
    call pm2 start index.js --name "product-traceability-api"
    call pm2 save
    echo Server deployed with PM2. Use 'pm2 status' to check status.
) else (
    echo Starting development server. Press Ctrl+C to stop.
    start npm run dev
)

cd ..

echo [5/6] Building frontend client...
cd client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install client dependencies.
    cd ..
    exit /b 1
)

call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to build client.
    cd ..
    exit /b 1
)

echo [6/6] Frontend deployment options:
echo 1. Serve locally for testing
echo 2. Prepare for production hosting (builds files only)
set /p CLIENT_DEPLOY="Enter choice (1 or 2): "

if "%CLIENT_DEPLOY%"=="1" (
    echo Installing serve...
    call npm install -g serve
    echo Starting local server on port 3000...
    serve -s build
) else (
    echo Production build created in client/build directory.
    echo Deploy these files to your web hosting service.
)

cd ..

echo ===================================================
echo Deployment completed successfully!
echo ===================================================
echo Next steps:
echo 1. Ensure your MongoDB database is properly configured
echo 2. Verify Cloudinary credentials are correct
echo 3. Test the application thoroughly
echo 4. Set up monitoring and backup solutions
echo 5. Read DEPLOYMENT_GUIDE.md for more detailed instructions
echo ===================================================

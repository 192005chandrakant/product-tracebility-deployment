#!/bin/bash

# Product Traceability Application Deployment Script
echo "==================================================="
echo "Product Traceability Application - Deployment Script"
echo "==================================================="
echo

# Check for Node.js installation
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js before proceeding."
    exit 1
fi

# Check for npm installation
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm before proceeding."
    exit 1
fi

echo "[1/6] Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install root dependencies."
    exit 1
fi

echo "[2/6] Compiling and deploying smart contract..."
npx hardhat compile
if [ $? -ne 0 ]; then
    echo "Error: Failed to compile smart contract."
    exit 1
fi

echo "Select deployment network:"
echo "1. Sepolia Testnet (Recommended for testing)"
echo "2. Ethereum Mainnet (Production - costs real ETH)"
read -p "Enter choice (1 or 2): " NETWORK_CHOICE

if [ "$NETWORK_CHOICE" = "1" ]; then
    NETWORK="sepolia"
elif [ "$NETWORK_CHOICE" = "2" ]; then
    NETWORK="mainnet"
    echo "WARNING: You are about to deploy to Ethereum Mainnet which will cost real ETH."
    read -p "Are you sure? (y/n): " CONFIRM
    if [ "${CONFIRM,,}" != "y" ]; then
        echo "Deployment cancelled."
        exit 0
    fi
else
    echo "Invalid choice. Defaulting to Sepolia Testnet."
    NETWORK="sepolia"
fi

npx hardhat run scripts/deploy.js --network $NETWORK
if [ $? -ne 0 ]; then
    echo "Error: Failed to deploy smart contract."
    exit 1
fi

echo "[3/6] Updating contract address in environment files..."
echo "Please enter the deployed contract address from above:"
read CONTRACT_ADDRESS

# Update the contract address in server .env file
if [ -f "server/.env" ]; then
    echo "Updating server/.env..."
    sed -i "s/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" server/.env
fi

echo "[4/6] Building and deploying server..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install server dependencies."
    cd ..
    exit 1
fi

echo "Server deployment options:"
echo "1. Local development server"
echo "2. Production server with PM2 (requires PM2 installed)"
read -p "Enter choice (1 or 2): " SERVER_DEPLOY

if [ "$SERVER_DEPLOY" = "2" ]; then
    if ! command -v pm2 &> /dev/null; then
        echo "PM2 not found. Installing PM2 globally..."
        npm install -g pm2
    fi
    pm2 start index.js --name "product-traceability-api"
    pm2 save
    echo "Server deployed with PM2. Use 'pm2 status' to check status."
else
    echo "Starting development server. Press Ctrl+C to stop."
    npm run dev &
fi

cd ..

echo "[5/6] Building frontend client..."
cd client
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install client dependencies."
    cd ..
    exit 1
fi

npm run build
if [ $? -ne 0 ]; then
    echo "Error: Failed to build client."
    cd ..
    exit 1
fi

echo "[6/6] Frontend deployment options:"
echo "1. Serve locally for testing"
echo "2. Prepare for production hosting (builds files only)"
read -p "Enter choice (1 or 2): " CLIENT_DEPLOY

if [ "$CLIENT_DEPLOY" = "1" ]; then
    echo "Installing serve..."
    npm install -g serve
    echo "Starting local server on port 3000..."
    serve -s build
else
    echo "Production build created in client/build directory."
    echo "Deploy these files to your web hosting service."
fi

cd ..

echo "==================================================="
echo "Deployment completed successfully!"
echo "==================================================="
echo "Next steps:"
echo "1. Ensure your MongoDB database is properly configured"
echo "2. Verify Cloudinary credentials are correct"
echo "3. Test the application thoroughly"
echo "4. Set up monitoring and backup solutions"
echo "5. Read DEPLOYMENT_GUIDE.md for more detailed instructions"
echo "==================================================="

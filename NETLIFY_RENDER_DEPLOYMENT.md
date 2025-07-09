# Netlify and Render Deployment Guide

This guide provides step-by-step instructions for deploying the Product Traceability application using Netlify for the frontend and Render for the backend.

## Overview

We'll be using two modern cloud platforms for deployment:

1. **Netlify**: To host the React frontend application
2. **Render**: To host the Express.js backend API server

This separation allows each part to be optimized for its specific role.

## Prerequisites

Before starting, ensure you have:

1. GitHub account (for connecting to Netlify and Render)
2. Your project in a GitHub repository
3. MongoDB Atlas account with a configured database
4. Cloudinary account for image storage
5. Infura account for blockchain interaction
6. Access to an Ethereum network (Sepolia testnet or Ethereum mainnet)

## Part 1: Deploying the Backend API to Render

### 1. Prepare Your Backend for Deployment

1. Ensure your `server/.env` file contains all necessary environment variables:

```
# Server Configuration
PORT=10000
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_at_least_64_chars_long

# Blockchain Configuration
INFURA_API_KEY=your_infura_api_key
PRIVATE_KEY=your_ethereum_wallet_private_key
CONTRACT_ADDRESS=deployed_contract_address
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_api_key

# Storage Configuration
STORAGE_TYPE=cloudinary

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

2. Ensure CORS is properly configured in your `server/index.js` file to allow requests from your Netlify domain:

```javascript
// Update CORS configuration to allow your Netlify domain
app.use(cors({
  origin: ['https://your-app-name.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
```

3. Commit these changes to your GitHub repository.

### 2. Create a Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: product-traceability-api (or your preferred name)
   - **Environment**: Node
   - **Branch**: main (or your preferred branch)
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node index.js`
   - **Plan**: Free (or select a paid plan for production)

5. Add environment variables:
   - Click on "Environment" tab
   - Add all the variables from your `.env` file
   - **Important**: Don't include PORT as Render will assign its own

6. Click "Create Web Service"
7. Wait for the deployment to complete (this may take a few minutes)
8. Note your service URL (e.g., `https://product-traceability-api.onrender.com`)

## Part 2: Deploying the Frontend to Netlify

### 1. Prepare Your Frontend for Deployment

1. Update `client/.env` with your Render backend URL:

```
# Production API URL (change this when deploying)
REACT_APP_API_URL=https://product-traceability-api.onrender.com

# Disable source maps for production
GENERATE_SOURCEMAP=false
ESLINT_NO_DEV_ERRORS=true
TSC_COMPILE_ON_ERROR=true

# Suppress webpack deprecation warnings
DISABLE_ESLINT_PLUGIN=true
WDS_SOCKET_PORT=0
```

2. Update `client/src/utils/apiConfig.js` to use your Render URL:

```javascript
// For Netlify deployment with Render backend
if (process.env.NODE_ENV === 'production') {
  return 'https://product-traceability-api.onrender.com';
}
```

3. Create a `netlify.toml` file in the root of your project:

```toml
[build]
  base = "client"
  publish = "build"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  REACT_APP_API_URL = "https://product-traceability-api.onrender.com"
```

4. Commit these changes to your GitHub repository.

### 2. Deploy to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "New site from Git"
3. Choose GitHub and select your repository
4. Configure the build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. Click "Show advanced" and add the environment variables from your `.env` file
6. Click "Deploy site"
7. Wait for the deployment to complete
8. Your site will be available at a Netlify subdomain (e.g., `https://product-traceability.netlify.app`)

### 3. Configure Custom Domain (Optional)

1. In Netlify Dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Follow the instructions to configure your domain with your DNS provider

## Part 3: Testing Your Deployment

### 1. Test the Backend API

1. Open a browser and navigate to:
   - `https://your-render-app-name.onrender.com/api/recent-products`
   - You should see a JSON response with recent products

### 2. Test the Frontend

1. Open your Netlify URL (e.g., `https://your-app-name.netlify.app`)
2. Try to:
   - Register a new account
   - Log in with existing credentials
   - View recent products on the home page
   - Scan a QR code
   - Add a new product (if you're a producer)

### 3. Debug Common Issues

#### CORS Errors
- Ensure your backend CORS settings include your Netlify domain
- Check browser console for specific CORS errors

#### API Connection Issues
- Verify your `REACT_APP_API_URL` is correctly set
- Test API endpoints directly using Postman or browser

#### Authentication Issues
- Ensure JWT tokens are being correctly stored and sent
- Check if your backend authentication middleware is working correctly

## Part 4: Continuous Deployment

### 1. Set Up Automatic Deployments

Both Netlify and Render support automatic deployments when you push changes to your GitHub repository.

1. For Netlify:
   - Go to "Site settings" > "Build & deploy" > "Continuous deployment"
   - Ensure "Build hooks" is enabled

2. For Render:
   - Go to your Web Service > "Settings" > "Build & Deploy"
   - Ensure "Auto-Deploy" is enabled

### 2. Environment-Specific Configurations

For multiple environments (development, staging, production):

1. Create environment-specific branches in your repository
2. Configure separate deployments in Netlify and Render for each branch
3. Use environment variables to manage different settings

## Troubleshooting

### Issue: "Failed to fetch recent products: 404 Not Found"

**Solution:**
- Ensure your backend API is running
- Check if the `/api/recent-products` endpoint is implemented
- Verify your API URL configuration in the frontend

### Issue: "TypeError: Cannot read properties of undefined (reading 'publicUrl')"

**Solution:**
- Check if your product data includes the required fields
- Ensure your MongoDB connection is working
- Make sure Cloudinary is properly configured

### Issue: Deployment build fails

**Solution:**
- Check the build logs in Netlify/Render
- Ensure all dependencies are correctly listed in package.json
- Verify your build commands are correct

## Conclusion

You've successfully deployed the Product Traceability application using Netlify for the frontend and Render for the backend. This modern cloud-native approach provides scalability, reliability, and ease of maintenance.

For ongoing management:
- Monitor your application performance using the Netlify and Render dashboards
- Set up alerts for any issues
- Regularly update your dependencies for security and performance improvements

---

For additional assistance, refer to:
- [Netlify Documentation](https://docs.netlify.com/)
- [Render Documentation](https://render.com/docs)

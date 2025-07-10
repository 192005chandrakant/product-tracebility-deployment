# Quick Deployment Guide: Netlify + Render

This guide provides step-by-step instructions for deploying your Product Traceability application with:
- **Frontend**: Netlify (React app)
- **Backend**: Render (Node.js API)

## Prerequisites

- GitHub account with your project repository
- MongoDB Atlas account (free tier available)
- Cloudinary account (free tier available)
- Infura account for blockchain (free tier available)

## Part 1: Deploy Backend to Render

### Step 1: Prepare Backend Environment Variables

Create/update your `server/.env` file with these variables:

```env
# Server Configuration
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret_64_chars_minimum

# Blockchain Configuration
INFURA_API_KEY=your_infura_api_key
PRIVATE_KEY=your_ethereum_wallet_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_api_key

# Storage Configuration
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Step 2: Update CORS for Production

Update `server/index.js` CORS configuration:

```javascript
// Enhanced CORS setup for production
app.use(cors({
  origin: [
    'http://localhost:3000', // Development
    'https://your-app-name.netlify.app', // Production - update with actual Netlify URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true
}));
```

### Step 3: Deploy to Render

1. **Go to [Render Dashboard](https://dashboard.render.com/)**

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**

4. **Configure the service:**
   - **Name**: `product-traceability-api`
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: `Free` (or paid for production)

5. **Add Environment Variables:**
   Click "Environment" and add all variables from your `.env` file (except PORT - Render assigns this automatically)

6. **Click "Create Web Service"**

7. **Wait for deployment** (5-10 minutes)

8. **Copy your Render URL** (e.g., `https://product-traceability-api.onrender.com`)

## Part 2: Deploy Frontend to Netlify

### Step 1: Update Frontend Configuration

1. **Update `client/src/utils/apiConfig.js`:**

```javascript
const getAPIBaseURL = () => {
  // First priority: environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Production: your Render backend URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://product-traceability-api.onrender.com'; // Replace with your actual Render URL
  }
  
  // Development fallback
  return 'http://localhost:5000';
};
```

2. **Update `client/.env`:**

```env
# Production API URL
REACT_APP_API_URL=https://product-traceability-api.onrender.com

# Build optimizations
GENERATE_SOURCEMAP=false
ESLINT_NO_DEV_ERRORS=true
TSC_COMPILE_ON_ERROR=true
DISABLE_ESLINT_PLUGIN=true
```

3. **Create `netlify.toml` in project root:**

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
  GENERATE_SOURCEMAP = "false"
```

### Step 2: Deploy to Netlify

1. **Go to [Netlify Dashboard](https://app.netlify.com/)**

2. **Click "New site from Git"**

3. **Choose GitHub** and select your repository

4. **Configure build settings:**
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

5. **Click "Show advanced"** and add environment variables:
   ```
   REACT_APP_API_URL = https://product-traceability-api.onrender.com
   GENERATE_SOURCEMAP = false
   ```

6. **Click "Deploy site"**

7. **Wait for deployment** (3-5 minutes)

8. **Copy your Netlify URL** (e.g., `https://amazing-app-123456.netlify.app`)

### Step 3: Update Backend CORS

1. **Go back to Render dashboard**

2. **Update your backend environment variables** to include your Netlify URL:
   ```
   ALLOWED_ORIGINS = https://blockchain-product-traceability.netlify.app
   ```

3. **Update `server/index.js` CORS:**

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://blockchain-product-traceability.netlify.app', // Your actual Netlify URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true
}));
```

4. **Redeploy backend** by pushing changes to GitHub

## Part 3: Testing Your Deployment

### Test Backend API
1. Open: `https://your-render-url.onrender.com/api/test`
2. Should return: `{"message":"Product routes working!","timestamp":"..."}`

### Test Frontend
1. Open your Netlify URL
2. Try to:
   - Register/login
   - View recent products
   - Search for products
   - Add products (if producer)

### Test Integration
1. Check browser console for CORS errors
2. Verify API calls are going to Render backend
3. Test product search functionality

## Quick Setup Commands

```bash
# 1. Update API config
echo 'https://your-render-url.onrender.com' > client/src/api-url.txt

# 2. Build and test locally
cd client
npm run build
npm start

# 3. Push to GitHub (triggers auto-deploy)
git add .
git commit -m "Configure for Netlify + Render deployment"
git push origin main
```

## Common Issues & Solutions

### CORS Errors
- Ensure your Netlify URL is in backend CORS settings
- Check both Render environment variables and code

### API Connection Failed
- Verify your Render URL is correct in `apiConfig.js`
- Check if Render service is running (free tier sleeps after 15min)

### Build Failures
- Check Netlify build logs for specific errors
- Ensure all dependencies are in `package.json`

### 404 Errors on Refresh
- Verify `netlify.toml` redirects are configured
- Check SPA routing setup

## Auto-Deploy Setup

Both platforms support auto-deployment:

1. **Render**: Automatically redeploys when you push to GitHub
2. **Netlify**: Automatically rebuilds when you push to GitHub

Just push your changes and both will update automatically!

## Custom Domains (Optional)

### For Netlify:
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Follow DNS configuration instructions

### For Render:
1. Go to Settings → Custom Domains
2. Add your domain
3. Update DNS records as instructed

---

**Your app is now live!** 🚀

Frontend: `https://blockchain-product-traceability.netlify.app/`
Backend: `https://product-traceability-api.onrender.com`

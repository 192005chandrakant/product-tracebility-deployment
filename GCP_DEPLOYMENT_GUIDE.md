# 🚀 Complete GCP Deployment Guide - Product Traceability System

This guide walks you through deploying the Product Traceability application to Google Cloud Platform.

---

## 📋 Prerequisites

Before you begin, ensure you have:
- Google Cloud Account (with billing enabled)
- GCP Project created
- `gcloud` CLI installed
- Docker installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Node.js v18+

### Install Required Tools

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Install Google Cloud SDK
# See: https://cloud.google.com/sdk/docs/install
```

---

## PART 1️⃣: Backend Deployment (Node/Express → Cloud Run)

### Step 1: Prepare Your Backend

The backend is already prepared. Verify:
- ✅ PORT is set to 8080 (updated in `server/index.js`)
- ✅ dotenv is installed and configured
- ✅ CORS is enabled

### Step 2: Create .env File for Cloud Run

Copy the `.env.example` in the `server` folder:

```bash
cd server
cp .env.example .env.production
```

Edit `.env.production` with your actual values:

```env
PORT=8080
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/product-traceability?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-make-it-long
CORS_ALLOWED_ORIGINS=https://your-firebase-domain.web.app
CORS_ALLOW_ALL=false
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
GEMINI_API_KEY=your-gemini-api-key
TRUST_PROXY=true
```

### Step 3: Authenticate with Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set your GCP project
gcloud config set project YOUR_PROJECT_ID

# If using Docker, also authenticate Docker
gcloud auth configure-docker gcr.io
```

### Step 4: Build and Deploy to Cloud Run

#### Option A: Manual Deploy (Recommended for Testing)

```bash
# Navigate to server directory
cd server

# Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/product-tracibility-backend:latest .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/product-tracibility-backend:latest

# Deploy to Cloud Run
gcloud run deploy product-tracibility-backend \
  --image gcr.io/YOUR_PROJECT_ID/product-tracibility-backend:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars=NODE_ENV=production,MONGODB_URI=$MONGODB_URI,JWT_SECRET=$JWT_SECRET,CORS_ALLOWED_ORIGINS=$CORS_ALLOWED_ORIGINS
```

#### Option B: Using gcloud builds submit (Simpler)

```bash
# From server directory
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/product-tracibility-backend

gcloud run deploy product-tracibility-backend \
  --image gcr.io/YOUR_PROJECT_ID/product-tracibility-backend \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1
```

### Step 5: Configure Environment Variables in Cloud Run

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on `product-tracibility-backend` service
3. Click **Edit & Deploy New Revision**
4. Scroll to **Environment Variables**
5. Add all your production variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CORS_ALLOWED_ORIGINS`
   - `CLOUDINARY_*`
   - `GEMINI_API_KEY`
   - `FIREBASE_*` (if needed)

### Step 6: Save Backend URL

After deployment, you'll get a URL like:
```
https://product-tracibility-backend-abc123.a.run.app
```

**⚠️ IMPORTANT: Save this URL** - you'll need it for the frontend!

### Step 7: Test Backend Health

```bash
# Test health endpoint
curl https://your-cloud-run-url/api/health

# Should return:
# {"status":"healthy","message":"API is running!","timestamp":"...","environment":"production"}
```

---

## PART 2️⃣: Frontend Deployment (React → Firebase)

### Step 1: Update Frontend API Configuration

The frontend already has flexible API configuration. The key file is `client/src/utils/apiConfig.js`.

The system automatically:
- Uses `process.env.REACT_APP_API_URL` if set
- Falls back to `http://localhost:5000` in development
- Falls back to production URL in production

### Step 2: Create .env.production File

```bash
cd client
cp .env.example .env.production
```

Edit `.env.production`:

```env
REACT_APP_API_URL=https://your-backend-cloud-run-url.a.run.app
NODE_ENV=production
GENERATE_SOURCEMAP=false
REACT_APP_DEBUG_API=false
REACT_APP_ENABLE_AI_FEATURES=true
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### Step 3: Build Frontend

```bash
cd client
npm run build

# Output will be in client/build/ directory
```

### Step 4: Initialize Firebase (if not done)

```bash
# From project root
firebase login

firebase init

# Select:
# - Hosting: Configure and deploy Firebase Hosting sites
# - Use existing project
# - Public directory: build (from client/build/)
# - Single-page app: Y
# - Automatic builds with GitHub: N (for now)
```

The `firebase.json` is already configured for you.

### Step 5: Update firebase.json

Replace `YOUR_FIREBASE_PROJECT_ID` in the root `firebase.json`:

```bash
# Quick find and replace
sed -i 's/YOUR_FIREBASE_PROJECT_ID/your-actual-project-id/g' firebase.json
```

### Step 6: Deploy to Firebase

```bash
# From project root
firebase deploy --only hosting

# You'll get a URL like:
# https://your-project.web.app
```

### Step 7: Test Frontend

1. Open your Firebase hosting URL: `https://your-project.web.app`
2. Test login/signup
3. Test product creation
4. Check browser console for any errors (F12)

---

## PART 3️⃣: Connect Frontend ↔ Backend

### Verify Configuration

The system is configured to:

1. **Frontend** calls the backend API at `REACT_APP_API_URL`
2. **Backend** has CORS enabled for the Firebase domain

### Check Connectivity

1. Open your frontend: `https://your-project.web.app`
2. Open Developer Console (F12)
3. Go to Network tab
4. Try to login/create account
5. You should see API calls to your Cloud Run URL

### If CORS Errors Occur

1. Update backend's `CORS_ALLOWED_ORIGINS` environment variable:
   ```
   CORS_ALLOWED_ORIGINS=https://your-project.web.app,https://your-project.firebaseapp.com
   ```
2. Redeploy backend:
   ```bash
   gcloud run deploy product-tracibility-backend \
     --update-env-vars CORS_ALLOWED_ORIGINS=https://your-project.web.app
   ```

---

## PART 4️⃣: Essential Configuration Checklist

### Backend Checklist ✅

- [ ] MongoDB Atlas URI configured
- [ ] JWT_SECRET set to a strong random key
- [ ] Cloudinary credentials added
- [ ] Firebase credentials added (if using)
- [ ] CORS_ALLOWED_ORIGINS includes your Firebase domain
- [ ] Environment variables set in Cloud Run console
- [ ] Health check endpoint responds: `/api/health`
- [ ] Backend is accessible from your frontend

### Frontend Checklist ✅

- [ ] `REACT_APP_API_URL` points to Cloud Run backend
- [ ] Build completes without errors: `npm run build`
- [ ] `build/` directory contains `index.html`
- [ ] Firebase project ID in `firebase.json`
- [ ] Firebase deployment succeeds

### Database Checklist ✅

- [ ] MongoDB Atlas cluster is accessible
- [ ] Connection string in backend environment variables
- [ ] Network access includes Google Cloud IPs
- [ ] Database and collections are created

---

## PART 5️⃣: Useful Commands

### Manage Cloud Run Service

```bash
# View logs
gcloud run logs read product-tracibility-backend --limit 50

# Stream logs
gcloud run logs read product-tracibility-backend --limit 10 --follow

# Update environment variables
gcloud run services update product-tracibility-backend \
  --update-env-vars KEY=VALUE

# Delete service
gcloud run services delete product-tracibility-backend
```

### Manage Firebase Hosting

```bash
# View deployment history
firebase hosting:channel:list

# Delete deployment
firebase hosting:sites:delete

# View logs
firebase hosting:log
```

### Local Testing Before Deployment

```bash
# Backend
cd server
npm install
npm start

# Frontend (in another terminal)
cd client
npm install
REACT_APP_API_URL=http://localhost:8080 npm start
```

---

## PART 6️⃣: Troubleshooting

### Backend Issues

| Issue | Solution |
|-------|----------|
| Cloud Run times out | Increase timeout: `--timeout 3600` |
| 502 Bad Gateway | Check logs: `gcloud run logs read product-tracibility-backend` |
| Port 8080 errors | Verify PORT env var is set to 8080 |
| CORS blocked | Add frontend URL to `CORS_ALLOWED_ORIGINS` |
| Database connection fails | Check MongoDB URI and network access |

### Frontend Issues

| Issue | Solution |
|-------|----------|
| API calls fail | Check `REACT_APP_API_URL` in console (F12) |
| Blank page | Check `npm run build` output, look for errors |
| Authentication fails | Verify JWT_SECRET matches backend |
| 404 errors | Ensure backend health check passes |

---

## PART 7️⃣: Optional - GitHub Actions CI/CD

The `.github/workflows/deploy-cloud-run.yml` file is already created for automated deployments.

### Setup Secrets in GitHub

1. Go to Settings → Secrets and variables → Actions
2. Add:
   - `GCP_PROJECT_ID`: Your GCP project ID
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret
   - `CORS_ALLOWED_ORIGINS`: Your Firebase domain

Then set up Workload Identity for secure authentication (see [GCP docs](https://cloud.google.com/docs/authentication/workload-identity-federation)).

---

## PART 8️⃣: Demo Script

For your submission video, follow this sequence:

1. **Show GCP Console**
   - Open Cloud Run services
   - Show `product-tracibility-backend` is running

2. **Open Firebase Hosting**
   - Navigate to your Firebase URL
   - Show it's live

3. **Demonstrate Core Features**
   - Sign up / Login
   - Add a product
   - Scan QR code
   - View product details
   - Show AI features (if implemented)

4. **Show API Connection**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Perform action
   - Show API call to Cloud Run backend
   - Show successful response

5. **Show Cloud Run Logs**
   - Display backend logs showing requests

---

## 🎯 Final Checklist for Submission

- [ ] Backend URL is public and accessible
- [ ] Frontend URL is public and accessible
- [ ] API calls work end-to-end
- [ ] No console errors
- [ ] Demo flow is smooth
- [ ] Screenshots of GCP Console ready
- [ ] Note for submission form: "Deployed frontend on Firebase, backend on Google Cloud Run"

---

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GCP Pricing](https://cloud.google.com/pricing)

---

**🚀 You're ready to deploy! Good luck!**

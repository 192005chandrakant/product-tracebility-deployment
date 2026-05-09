# Vercel Frontend + Render Backend - Environment Setup Guide

## Overview

This application uses a **split deployment architecture**:

```
Vercel Frontend (React)          Render Backend (Node.js/Express)
https://your-app.vercel.app  ←→  https://your-api.onrender.com
```

Each platform requires its own environment configuration.

---

## File Structure

```
project-root/
├── .env.vercel.example          ← Frontend variables (Vercel)
├── .env.render.example          ← Backend variables (Render)
├── .env.production              ← Backend local copy (DO NOT COMMIT)
│
├── client/
│   ├── .env.production.local    ← Frontend local copy (DO NOT COMMIT)
│   └── package.json
│
└── server/
    ├── index.js
    └── package.json
```

---

## Step 1: Vercel Frontend Setup

### 1.1 Create Local Frontend Environment File

```bash
# Copy the template
cp .env.vercel.example client/.env.production.local

# Open and edit
nano client/.env.production.local
# or
code client/.env.production.local
```

### 1.2 Configure Vercel Frontend Variables

**client/.env.production.local:**

```env
# REQUIRED - Fill this after Render backend is deployed
REACT_APP_API_URL=https://your-render-backend-url.onrender.com

# Usually just / for single domain
REACT_APP_PUBLIC_URL=/

# Optional - Firebase credentials
REACT_APP_FIREBASE_API_KEY=your-value
REACT_APP_FIREBASE_AUTH_DOMAIN=your-value
REACT_APP_FIREBASE_PROJECT_ID=your-value
REACT_APP_FIREBASE_STORAGE_BUCKET=your-value
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-value
REACT_APP_FIREBASE_APP_ID=your-value

# Optional - Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your-value
```

### 1.3 Deploy to Vercel

**Option A: GitHub Integration (Easiest)**

```bash
# 1. Push code to GitHub
git add client/.env.production.local  # RISKY - may leak secrets
# OR use Vercel Dashboard instead (below)

git commit -m "WIP: Frontend config"
git push origin main
```

⚠️ **Better Option B: Use Vercel Dashboard**

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to: Settings → Environment Variables
4. Add variables for Production environment:
   ```
   Name: REACT_APP_API_URL
   Value: https://your-render-backend-url.onrender.com
   Environments: Production
   
   Name: REACT_APP_FIREBASE_API_KEY
   Value: [your-value]
   Environments: Production
   
   (Add remaining variables)
   ```
5. Go to: Deployments → Redeploy (select latest deployment)
6. Wait for build to complete

**Result:** Frontend deployed at https://your-app.vercel.app

---

## Step 2: Render Backend Setup

### 2.1 Create Production Environment File

```bash
# Copy the template
cp .env.render.example .env.production

# Open and edit - KEEP THIS LOCAL, DON'T COMMIT
nano .env.production
# or
code .env.production
```

### 2.2 Configure Render Backend Variables

**Required values (.env.production):**

```env
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
JWT_SECRET=<generate-with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
TRUST_PROXY=true
```

**Optional but recommended:**

```env
# Firebase (if using)
FIREBASE_PROJECT_ID=your-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-email@iam.gserviceaccount.com

# AI (Gemini)
GEMINI_API_KEY=your-key

# Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Blockchain (if using)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-id
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...
```

⚠️ **DO NOT COMMIT .env.production** - It's already in .gitignore

### 2.3 Deploy to Render

**Step 1: Prepare Repository**

```bash
# Ensure .env.production is in .gitignore
cat .gitignore | grep ".env.production"
# Should output: .env.production

# Commit configuration files (no secrets)
git add .env.render.example Dockerfile vercel.json
git commit -m "Add Render backend configuration"
git push origin main
```

**Step 2: Create Render Service**

1. Go to: https://render.com/dashboard
2. Click: "New +" → "Web Service"
3. Connect GitHub repository
4. Fill in:
   ```
   Name: product-traceability-api
   Environment: Node
   Build Command: npm run build:frontend && npm --prefix server install
   Start Command: npm --prefix server start
   ```
5. Click: "Create Web Service"
6. Wait for initial deployment (will fail - missing env vars)

**Step 3: Add Environment Variables**

1. In Render Dashboard, go to: Service → Settings → Environment
2. Add each variable from .env.production:
   ```
   NODE_ENV = production
   PORT = 8080
   MONGODB_URI = mongodb+srv://...
   JWT_SECRET = your-secret
   CORS_ALLOWED_ORIGINS = https://your-app.vercel.app
   TRUST_PROXY = true
   [... other variables ...]
   ```
3. For sensitive values, toggle "Secret" option (right side)
4. Click: "Save"
5. Service will auto-redeploy

**Step 4: Verify Deployment**

1. Go to: Render Dashboard → Logs
2. Look for:
   ```
   ✅ MongoDB connected
   🚀 Server running on port 8080
   ✅ Blockchain event listener initialized
   ```
3. Test health endpoint:
   ```bash
   curl https://your-api.onrender.com/api/health
   # Should return: {"status":"healthy",...}
   ```

**Result:** Backend deployed at https://your-api.onrender.com

---

## Step 3: Connect Frontend ↔ Backend

### 3.1 Update Vercel Frontend URL

Now that Render backend is deployed, update Vercel frontend:

1. Go to: https://vercel.com/dashboard → Project Settings → Environment Variables
2. Find or create: `REACT_APP_API_URL`
3. Change value to: `https://your-api.onrender.com`
4. Environment: `Production`
5. Save
6. Redeploy: Deployments → Click latest deployment → Redeploy

### 3.2 Verify Connection

1. Visit: https://your-app.vercel.app
2. Open DevTools (F12)
3. Go to: Console tab
4. Check for errors (should be none)
5. Go to: Network tab
6. Perform an action (create product, etc.)
7. Look for API call to: `https://your-api.onrender.com/api/...`
8. Should return status: 200 ✅

---

## Environment Variables Explained

### Frontend Variables (Vercel)

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `REACT_APP_API_URL` | Backend API base URL | `https://api.onrender.com` | ✅ Yes |
| `REACT_APP_PUBLIC_URL` | Static assets base path | `/` | ✅ Yes |
| `REACT_APP_FIREBASE_*` | Firebase auth config | Various | ⚠️ If using Firebase |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` | ⚠️ If using Google login |

⚠️ **Frontend variables use `REACT_APP_` prefix**
- Only variables with this prefix are exposed to browser code
- Without prefix, variable won't be available
- Never put secrets (API keys) in frontend vars (they're public)

### Backend Variables (Render)

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `NODE_ENV` | Environment type | `production` | ✅ Yes |
| `MONGODB_URI` | Database connection | `mongodb+srv://user:pass@host/db` | ✅ Yes |
| `JWT_SECRET` | Auth token secret | 64-char hex string | ✅ Yes |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend URLs | `https://app.vercel.app` | ✅ Yes |
| `FIREBASE_*` | Firebase admin config | Various | ⚠️ If using |
| `GEMINI_API_KEY` | AI verification | API key | ⚠️ If using |
| `CLOUDINARY_*` | File storage | Cloud credentials | ⚠️ If using |
| `SEPOLIA_RPC_URL` | Blockchain RPC | Infura URL | ⚠️ If using blockchain |
| `CONTRACT_ADDRESS` | Smart contract address | `0x...` | ⚠️ If using blockchain |
| `PRIVATE_KEY` | Wallet private key | `0x...` | ⚠️ If using blockchain |

⚠️ **Backend variables have NO prefix**
- All variables available on server
- Use `.env.render.example` as reference
- **NEVER** expose to frontend

---

## Deployment Sequence

### Fresh Deployment (Recommended Order)

```
1. Setup MongoDB Atlas
   ├─ Create cluster
   ├─ Create database user
   └─ Get connection string
        ↓
2. Deploy Render Backend
   ├─ Create service
   ├─ Connect GitHub
   ├─ Add environment variables
   └─ Wait for ✅ deployed
        ↓
3. Get Render URL
   └─ https://your-api.onrender.com
        ↓
4. Deploy Vercel Frontend
   ├─ Connect GitHub
   ├─ Add REACT_APP_API_URL = render-url
   └─ Wait for ✅ deployed
        ↓
5. Verify Full Stack
   ├─ Frontend loads: https://app.vercel.app
   ├─ Backend responds: curl https://api.onrender.com/api/health
   └─ Frontend calls backend: Create product → should save to MongoDB
```

---

## Common Configuration Issues

### Issue 1: Frontend showing "API Connection Error"

**Symptom:** Frontend loads, but API calls fail

**Solutions:**
1. Check `REACT_APP_API_URL` is set correctly in Vercel
   - Must be full URL: `https://your-api.onrender.com`
   - NOT `http://localhost:8080`
2. Verify backend is deployed and running:
   ```bash
   curl https://your-api.onrender.com/api/health
   ```
3. Check CORS is allowing Vercel URL:
   ```bash
   # In Render environment variables:
   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
4. If changed, trigger redeploy on Render

### Issue 2: MongoDB Connection Error

**Symptom:** Backend logs show "MongoDB connection failed"

**Solutions:**
1. Verify `MONGODB_URI` is correct:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/dbname
   ```
2. Check MongoDB Atlas:
   - Database Access: user exists with correct password
   - Network Access: Render IP whitelisted (use 0.0.0.0/0 for development)
3. Test connection locally:
   ```bash
   mongosh "mongodb+srv://user:pass@cluster.mongodb.net/db"
   ```

### Issue 3: 404 Errors for Assets

**Symptom:** CSS/JS files return 404

**Solutions:**
1. Ensure frontend was built during deployment
2. Check Render build logs for errors
3. Verify `vercel.json` has correct `buildCommand`
4. Check `REACT_APP_PUBLIC_URL=/` is set

### Issue 4: Firebase/Google OAuth Not Working

**Symptom:** Login fails, errors about invalid credentials

**Solutions:**
1. Verify credentials in:
   - Vercel: `REACT_APP_FIREBASE_*`, `REACT_APP_GOOGLE_CLIENT_ID`
   - Render: `FIREBASE_PRIVATE_KEY`, etc.
2. Check Firebase project settings match values
3. For Firebase private key, ensure newlines are preserved:
   ```
   -----BEGIN PRIVATE KEY-----\nLongBase64String\n-----END PRIVATE KEY-----
   ```

---

## Security Best Practices

### 1. Environment Variable Security

```
✅ DO:
- Use Render "Secret" toggle for sensitive variables
- Rotate JWT_SECRET every 3-6 months
- Store local .env.production in .gitignore
- Use unique passwords for each service

❌ DON'T:
- Commit .env.production to GitHub
- Share environment variables in chat/email
- Use same secret for dev and production
- Put backend secrets in frontend (.env)
```

### 2. Database Security

```
✅ DO:
- Create MongoDB user with minimal permissions
- Use strong passwords (32+ characters)
- Enable MongoDB Atlas IP whitelist
- Use TLS/SSL for connections

❌ DON'T:
- Use admin user for app
- Allow 0.0.0.0/0 in production (use specific IPs)
- Share MongoDB URI in code
```

### 3. API Security

```
✅ DO:
- Whitelist specific Vercel URLs in CORS
- Use HTTPS only (both Vercel and Render)
- Implement rate limiting
- Validate all inputs

❌ DON'T:
- Use CORS_ALLOW_ALL=true in production
- Accept HTTP requests
- Trust user input
```

---

## Monitoring & Debugging

### Check Frontend Deployment

```bash
# View build logs
https://vercel.com/dashboard → Project → Deployments → [deployment] → Logs

# Test frontend
curl https://your-app.vercel.app
# Should return HTML with <script> tags

# Check environment variables were set
# In DevTools Console:
console.log(process.env.REACT_APP_API_URL)
# Should output: https://your-api.onrender.com
```

### Check Backend Deployment

```bash
# View build and runtime logs
https://render.com/dashboard → Services → [service] → Logs

# Test health endpoint
curl https://your-api.onrender.com/api/health
# Should return: {"status":"healthy",...}

# Check database connection
curl https://your-api.onrender.com/api/db-test
# Should show connection status and test results
```

### Debug API Calls

In browser DevTools:

1. Network tab → Filter: XHR/Fetch
2. Perform action (create product, etc.)
3. Look for request to: `https://your-api.onrender.com/api/...`
4. Check:
   - Status: 200 (success) or 401/403 (auth issues)
   - Request Headers: Contains authorization token
   - Response: Valid JSON

---

## Troubleshooting Checklist

- [ ] MongoDB Atlas cluster created and running
- [ ] MongoDB user created with correct password
- [ ] Render service created and connected to GitHub
- [ ] All required environment variables set in Render
- [ ] Backend deployed successfully (logs show ✅)
- [ ] Backend responds: `curl https://api.onrender.com/api/health`
- [ ] CORS_ALLOWED_ORIGINS includes Vercel frontend URL
- [ ] Vercel project created and connected to GitHub
- [ ] REACT_APP_API_URL set to backend URL in Vercel
- [ ] Frontend deployed successfully
- [ ] Frontend loads: `https://your-app.vercel.app`
- [ ] Browser DevTools shows no 404 errors for CSS/JS
- [ ] Frontend can call backend API
- [ ] Create product → saves to MongoDB ✅

---

## Quick Reference

### File Locations

```
Frontend Template:   .env.vercel.example
Frontend Local:      client/.env.production.local (DO NOT COMMIT)
Frontend Vercel:     Environment Variables in Dashboard

Backend Template:    .env.render.example
Backend Local:       .env.production (DO NOT COMMIT - in .gitignore)
Backend Render:      Environment Variables in Dashboard
```

### Key Deployment URLs

After deployment, you'll have:

```
Frontend:    https://your-app.vercel.app
Backend:     https://your-api.onrender.com
Dashboard:   https://vercel.com/dashboard
Dashboard:   https://render.com/dashboard
Database:    https://cloud.mongodb.com (MongoDB Atlas)
```

### Testing Commands

```bash
# Test backend health
curl https://your-api.onrender.com/api/health

# Test frontend
open https://your-app.vercel.app
# or: firefox https://your-app.vercel.app

# Check environment variable
node -e "console.log(process.env.MONGODB_URI)"
```

---

## Next Steps

1. Copy `.env.vercel.example` → `client/.env.production.local`
2. Copy `.env.render.example` → `.env.production`
3. Fill in all values
4. Deploy Render first (backend)
5. Update Vercel with Render URL
6. Deploy Vercel (frontend)
7. Test connection
8. Monitor logs for issues

✅ **You're ready to deploy!**

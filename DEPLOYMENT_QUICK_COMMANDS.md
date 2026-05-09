# Quick Deployment Commands - 404 Fix Applied

## Summary of Changes

Your 404 asset loading errors have been fixed by:
1. ✅ Adding SPA fallback middleware to server
2. ✅ Updating vercel.json with proper build commands
3. ✅ Creating Docker support for containerized deployments
4. ✅ Adding build orchestration scripts

---

## Pre-Deployment

First, test locally to ensure everything works:

```bash
# Build the frontend
npm --prefix client run build

# Start the server
npm --prefix server start

# Test in browser
open http://localhost:8080

# Test API
curl http://localhost:8080/api/health
```

Verify in browser DevTools (F12 → Network tab) that:
- ✅ No 404 errors for CSS/JS files
- ✅ All assets load with status 200/304

---

## Deployment Options

### Option 1: Vercel (Easiest)

```bash
# Just push to GitHub - Vercel handles the rest
git add .
git commit -m "Fix: 404 errors with SPA fallback and vercel config"
git push origin main

# Visit Vercel Dashboard → Select Project
# Automatic deployment triggers (should complete in ~2-5 minutes)

# Check deployment status:
# https://vercel.com/dashboard/projects
```

**What happens automatically:**
1. Vercel reads `vercel.json`
2. Runs: `cd client && npm install && npm run build && cd ../server && npm install`
3. Deploys server with compiled React frontend
4. Serves static files + API from same domain

---

### Option 2: Render.com

```bash
# Method A: Push to GitHub (recommended)
git push origin main

# In Render Dashboard:
# 1. Connect GitHub repo
# 2. Create Web Service
# 3. Set Build Command: npm run build:frontend && npm --prefix server install
# 4. Set Start Command: npm --prefix server start
# 5. Deploy

# Method B: Deploy via CLI
npm install -g render
render login
render deploy
```

---

### Option 3: Railway

```bash
# Method A: GitHub Connection (easiest)
# 1. Connect GitHub to Railway
# 2. Railway auto-detects and builds
# 3. Uses vercel.json for build commands

# Method B: CLI
npm install -g @railway/cli
railway link
railway up

# Or direct deploy:
git push origin main
# Auto-deploy on GitHub push
```

---

### Option 4: Docker (AWS, GCP, Azure, Heroku)

```bash
# Build Docker image
docker build -t product-traceability:latest .

# Test locally
docker run -p 8080:8080 -e NODE_ENV=production product-traceability:latest

# Verify: http://localhost:8080

# Tag for registry (example: Docker Hub)
docker tag product-traceability:latest your-username/product-traceability:latest

# Push to Docker Hub
docker login
docker push your-username/product-traceability:latest
```

#### Deploy to AWS ECR:
```bash
# Create ECR repository
aws ecr create-repository --repository-name product-traceability --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag product-traceability:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/product-traceability:latest

# Push
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/product-traceability:latest
```

#### Deploy to Google Cloud Run:
```bash
# Build on Cloud Build
gcloud builds submit --tag gcr.io/PROJECT_ID/product-traceability

# Or build locally and push:
gcloud auth configure-docker
docker tag product-traceability:latest gcr.io/PROJECT_ID/product-traceability:latest
docker push gcr.io/PROJECT_ID/product-traceability:latest

# Deploy
gcloud run deploy product-traceability \
  --image gcr.io/PROJECT_ID/product-traceability:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,MONGODB_URI=your_mongodb_uri
```

#### Deploy to Heroku:
```bash
# Login
heroku login

# Create app
heroku create your-app-name

# Push Docker image
heroku container:push web -a your-app-name
heroku container:release web -a your-app-name

# Check logs
heroku logs --tail -a your-app-name
```

---

### Option 5: Self-Hosted (VPS, EC2, DigitalOcean)

```bash
# SSH to server
ssh user@your-server.com

# Clone repo
git clone https://github.com/your-repo/product-traceability.git
cd product-traceability

# Install dependencies
npm --prefix client install
npm --prefix server install

# Build frontend
npm --prefix client run build

# Install PM2 for process management
npm install -g pm2

# Create PM2 config file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'product-traceability',
      script: 'server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        MONGODB_URI: process.env.MONGODB_URI
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log'
    }
  ]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Make it persistent
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs
```

---

## Environment Variables Required

### Server (.env)
```
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/product-traceability
JWT_SECRET=<generate-a-secure-secret>
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Optional Features
```
# Google/Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
GOOGLE_API_KEY=your-google-api-key

# Blockchain
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-infura-key
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...

# AI/Gemini
GEMINI_API_KEY=your-gemini-api-key

# Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## Verification After Deployment

```bash
# Test health endpoint
curl https://your-deployment-url/api/health

# Test API endpoint
curl https://your-deployment-url/api/products

# Open in browser
open https://your-deployment-url

# Monitor logs (depends on platform)
# - Vercel: Dashboard → Deployments → Logs
# - Render: Dashboard → Logs  
# - Railway: Console
# - Docker: docker logs <container-id>
```

---

## Troubleshooting After Deployment

### Still seeing 404 errors?

1. **Check deployment logs** for build errors:
   - Look for: "client/build/index.html not found"
   - Look for: build command errors

2. **Verify build was created:**
   ```bash
   # In deployment platform's console/terminal
   ls -la client/build/
   ls client/build/index.html
   ```

3. **Check middleware order:**
   - Server logs should show static files configured
   - Look for: "Static files configured from: ../client/build"

4. **Test specific routes:**
   ```bash
   # Should return 200 (HTML)
   curl https://your-url/ -I
   
   # Should return 200 (JSON)  
   curl https://your-url/api/health -I
   
   # Should return 404 (API not found)
   curl https://your-url/api/nonexistent -I
   ```

### Common Issues:

| Error | Solution |
|-------|----------|
| `Cannot find module '../client/build'` | Frontend build missing - check build logs |
| `Port already in use` | Change PORT env var or kill process using port |
| `MongoDB connection failed` | Set correct MONGODB_URI env var |
| `CORS errors in console` | Add your domain to CORS_ALLOWED_ORIGINS |
| `Assets 404 - JSON response` | SPA fallback not working - verify server/index.js changes |

---

## Next Steps

1. ✅ Choose deployment platform
2. ✅ Test locally: `npm run build:frontend && npm --prefix server start`
3. ✅ Push to GitHub: `git push origin main`
4. ✅ Deploy using option above
5. ✅ Verify in browser DevTools (no 404 errors)
6. ✅ Test API endpoints
7. ✅ Monitor logs for errors

---

## For More Information

- [Deployment 404 Fix Details](./DEPLOYMENT_404_FIX.md)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- Server Config: [server/index.js](./server/index.js)
- Vercel Config: [vercel.json](./vercel.json)
- Docker: [Dockerfile](./Dockerfile)

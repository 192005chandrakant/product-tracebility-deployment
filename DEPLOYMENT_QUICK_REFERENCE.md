# ⚡ GCP Deployment Quick Reference

## One-Time Setup

```bash
# Install tools
npm install -g firebase-tools
# Install gcloud from https://cloud.google.com/sdk/docs/install

# Login to GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Configure Docker
gcloud auth configure-docker gcr.io

# Login to Firebase
firebase login
```

---

## Deploy Backend to Cloud Run

```bash
cd server

# Build
docker build -t gcr.io/YOUR_PROJECT_ID/product-tracibility-backend:latest .

# Push
docker push gcr.io/YOUR_PROJECT_ID/product-tracibility-backend:latest

# Deploy
gcloud run deploy product-tracibility-backend \
  --image gcr.io/YOUR_PROJECT_ID/product-tracibility-backend:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1

# Get URL
gcloud run services describe product-tracibility-backend \
  --region asia-south1 \
  --format 'value(status.url)'
```

---

## Deploy Frontend to Firebase

```bash
cd client

# Build
npm run build

# Deploy
cd ..
firebase deploy --only hosting

# Get URL
firebase hosting:sites:list
```

---

## Set Environment Variables

### For Backend (Cloud Run)

```bash
gcloud run services update product-tracibility-backend \
  --update-env-vars=NODE_ENV=production,MONGODB_URI=your_uri,JWT_SECRET=your_secret
```

### For Frontend (rebuild and redeploy)

1. Create `.env.production` in `client/`
2. Set `REACT_APP_API_URL=https://your-backend-url`
3. Run `npm run build`
4. Run `firebase deploy --only hosting`

---

## View Logs

```bash
# Backend logs
gcloud run logs read product-tracibility-backend --limit 50 --follow

# Firebase logs
firebase hosting:log
```

---

## Delete Services

```bash
# Delete backend
gcloud run services delete product-tracibility-backend --region asia-south1

# Delete frontend
firebase hosting:sites:delete your-project
```

---

## Important URLs to Save

| Service | URL |
|---------|-----|
| Backend (Cloud Run) | `https://product-tracibility-backend-xyz.a.run.app` |
| Frontend (Firebase) | `https://your-project.web.app` |
| GCP Console | https://console.cloud.google.com |
| Firebase Console | https://console.firebase.google.com |

---

## Troubleshooting

### Port Error
- Ensure PORT=8080 in backend environment

### CORS Error  
- Add frontend URL to `CORS_ALLOWED_ORIGINS`

### API Not Accessible
- Check `REACT_APP_API_URL` in frontend `.env.production`

### Build Fails
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (need v18+)

---

## Budget Estimate

- **Cloud Run**: ~$0-5/month (free tier generous)
- **Firebase Hosting**: Free tier included
- **MongoDB Atlas**: ~$0 (free tier) or $57+/month
- **Total**: ~$57/month for production setup

---

## Quick Test

```bash
# Test backend
curl https://your-backend-url/api/health

# Test frontend
# Open https://your-frontend-url in browser
# Check browser console (F12)
```

---

## Next Steps

1. ✅ Backend deployed to Cloud Run
2. ✅ Frontend deployed to Firebase  
3. ⏭️ Configure environment variables
4. ⏭️ Test API connectivity
5. ⏭️ Create demo video
6. ⏭️ Submit with URLs


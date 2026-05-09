# Deploy Backend to Render

This document shows quick steps to deploy the backend on Render (https://render.com).

## Option A — Deploy with Docker image

1. Build and push Docker image to your registry:

```bash
cd server
docker build -t your-registry/product-tracibility-backend:latest .
docker push your-registry/product-tracibility-backend:latest
```

2. In Render dashboard, create a new **Web Service** → choose **Docker** → provide image URL.
3. Configure environment variables in Render settings (MONGODB_URI, JWT_SECRET, CLOUDINARY_*, GEMINI_API_KEY, etc.).
4. Set health check path to `/api/health`.
5. Add `RENDER_EXTERNAL_URL` to the server env if you rely on it for CORS (Render sets it automatically).

## Option B — Deploy from Git (Render builds the service)

1. Connect your Git repository to Render and choose the service type **Web Service**.
2. Branch: choose `main` or `production`.
3. Build Command: `npm install` (or `npm ci`)  
   Start Command: `npm run prod` or `node index.js`
4. Add environment variables in Render's Environment tab.
5. Configure health checks to use `/api/health` and set a start timeout of 30s.

## Notes & Best Practices

- Render exposes `RENDER_EXTERNAL_URL` which contains the external URL of the service. The server will pick this up to allow CORS for the frontend if present.
- Use Render's secret management to store sensitive environment variables.
- For production, set `NODE_ENV=production`, `TRUST_PROXY=true`, and `CORS_ALLOW_ALL=false` and populate `CORS_ALLOWED_ORIGINS` with your Vercel domain.
- To secure RPC/private keys, use a cloud secret manager and load them into Render's environment.

## Example environment variables to configure

- MONGODB_URI
- JWT_SECRET
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- GEMINI_API_KEY
- REACT_APP_API_URL (for frontend builds)
- RENDER_EXTERNAL_URL (optional, Render provides this)

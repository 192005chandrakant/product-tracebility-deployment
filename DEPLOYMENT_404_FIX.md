# 404 Asset Loading Errors - Fix & Solution Guide

## Problem Diagnosis

Your deployment is showing multiple 404 errors for bundled assets:
```
main.9fbb18a6.css:1  Failed to load resource: the server responded with a status of 404
vendors-e8ee3528.9d92997b.css:1  Failed to load resource: the server responded with a status of 404
runtime.f378a086.js:1  Failed to load resource: the server responded with a status of 404
react-2594363e.a045a5b5.js:1  Failed to load resource: the server responded with a status of 404
```

## Root Causes (Now Fixed)

### 1. **Missing SPA Fallback** ✅ FIXED
**Problem:** The Express server had a catch-all `404` handler that returned JSON for all unmatched routes, instead of serving `index.html` for the React application.

**Fix:** Added a proper SPA fallback middleware that:
- Serves `index.html` for non-API routes (React Router handles the routing)
- Returns 404 JSON only for actual API route mismatches
- Placed BEFORE the final 404 handler

**Code Change** in `server/index.js`:
```javascript
// SPA Fallback: Serve index.html for React Router fallback
if (HAS_CLIENT_INDEX) {
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found', path: req.originalUrl });
    }
    // For all other routes, serve index.html
    res.sendFile(CLIENT_INDEX_PATH);
  });
}
```

### 2. **Incomplete Vercel Configuration** ✅ FIXED
**Problem:** `vercel.json` was missing:
- Build command to compile the React frontend
- Proper routes configuration
- Cache headers for static assets

**Fix:** Updated `vercel.json` to:
```json
{
  "buildCommand": "cd client && npm install && npm run build && cd ../server && npm install",
  "outputDirectory": "server",
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ],
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 3. **Static Asset Serving** ✅ CONFIGURED
**Already Correct:** The server properly serves static files:
```javascript
if (HAS_CLIENT_BUILD) {
  app.use(express.static(CLIENT_BUILD_PATH));
}
```

The build path is: `../client/build/`

---

## Middleware Stack (Correct Order)

The Express middleware is now properly ordered:

```
1. CORS & Security (helmet, compression)
2. Body parsers (express.json, express.urlencoded)
3. EXPRESS.STATIC - serves /client/build/ files ✅
4. API ROUTES - /api/*, /auth, /profile, /admin, etc.
5. SPA FALLBACK - serves index.html for non-API routes ✅ (NEW)
6. 404 HANDLER - JSON error for API mismatches
```

---

## How to Deploy

### **Option 1: Vercel (Recommended - Simplest)**

1. Ensure `vercel.json` is configured (already done ✅)
2. Push to GitHub
3. Connect repository to Vercel dashboard
4. Vercel will automatically:
   - Run `npm install && npm run build` in client/
   - Run `npm install` in server/
   - Deploy Express server with static frontend

```bash
git add .
git commit -m "Fix: 404 errors by adding SPA fallback and vercel config"
git push origin main
```

### **Option 2: Manual Build & Deploy**

#### Build locally first (for testing):

```bash
# Install dependencies
npm --prefix server install
npm --prefix client install

# Build the React frontend
npm --prefix client run build

# Verify the build exists
ls client/build/index.html   # Should exist

# Test locally
npm --prefix server start
# Visit http://localhost:8080 in browser
```

#### Deploy to production:

```bash
# For Render, Heroku, Railway, etc.
# Just push to your deployment platform
# Make sure buildCommand in vercel.json runs for your platform
```

### **Option 3: Docker Deployment**

Build command:
```bash
cd client && npm install && npm run build && cd ../server && npm install
```

Start command:
```bash
npm --prefix server start
```

---

## Verification Checklist

After deployment, verify the fix:

- [ ] **Home page loads** - Visit your deployment URL
- [ ] **CSS loads** - No 404 errors in CSS files
- [ ] **JavaScript loads** - No 404 errors in JS bundles  
- [ ] **React components render** - UI is visible and interactive
- [ ] **API calls work** - Navigation and data fetching function
- [ ] **Routing works** - Can navigate between pages
- [ ] **No console errors** - Browser DevTools shows no 404 errors

### Browser DevTools Check:
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Verify NO 404 errors for CSS/JS files
5. Status should be 200/304 for all assets

---

## Testing Locally

```bash
# Terminal 1: Start server
npm --prefix server start

# Terminal 2: In another terminal, test
curl http://localhost:8080/
curl http://localhost:8080/product/test-product
curl http://localhost:8080/api/health
```

Expected results:
- `/` → HTML page (200)
- `/product/*` → HTML page (200)
- `/api/health` → JSON response (200)
- `/api/nonexistent` → JSON error (404)

---

## Environment Variables

Make sure your deployment has:

### Server Environment Variables:
```
NODE_ENV=production
MONGODB_URI=<your-mongodb-url>
JWT_SECRET=<your-secret>
PORT=8080
```

### Client Environment Variables (build-time):
```
REACT_APP_API_URL=<your-api-url>
REACT_APP_PUBLIC_URL=/
```

---

## File Changes Summary

1. **server/index.js**
   - Added SPA fallback middleware (lines ~450-465)
   - Ensures index.html served for non-API routes

2. **vercel.json**
   - Updated buildCommand to build client then install server
   - Added proper routes configuration
   - Added cache headers for static assets

3. **package.json** (root)
   - Added `build` script to orchestrate full build
   - Added `build:prod` script for production

---

## Troubleshooting

### Still getting 404 errors?

1. **Check client build exists:**
   ```bash
   ls client/build/index.html
   ls client/build/static/
   ```
   If missing, run: `npm --prefix client run build`

2. **Check server logs for HAS_CLIENT_BUILD:**
   ```
   Server startup should show:
   ✅ Static files configured from: ../client/build
   ```
   If not shown, build wasn't created

3. **Test static file serving:**
   ```bash
   curl http://localhost:8080/index.html
   ```
   Should return HTML, not 404

4. **Verify middleware order:**
   - Static middleware MUST come before API routes
   - API routes MUST come before SPA fallback
   - Current order: ✅ Correct

### Deployment platform issues?

- **Vercel:** Config is correct, just push
- **Render:** May need to add buildCommand to dashboard
- **Heroku:** Use Procfile if provided
- **Railway:** Uses buildCommand from vercel.json automatically

---

## Performance Tips

The vercel.json now includes cache headers for static assets:

```json
{
  "source": "/static/(.*)",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "max-age=31536000, immutable"
    }
  ]
}
```

This caches bundled assets for 1 year since they have content hashes.

---

## Questions?

Check these files for more info:
- [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [server/index.js](./server/index.js) - Lines 200-210, 450-465
- [vercel.json](./vercel.json)

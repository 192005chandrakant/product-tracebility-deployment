# Backend-Frontend Connection Configuration

## Overview
This document outlines the complete setup for connecting your Netlify-deployed frontend with your Render-deployed backend.

## Current Configuration

### Backend Deployment
- **URL**: `https://product-traceability-api.onrender.com`
- **Platform**: Render
- **Database**: MongoDB (configured in backend)
- **File Storage**: Cloudinary

### Frontend Deployment
- **URL**: `https://blockchain-product-traceability.netlify.app`
- **Platform**: Netlify
- **Build Command**: `npm run build:enhanced`

## Connection Setup

### 1. Environment Variables

#### Netlify Build Environment
Set in `netlify.toml`:
```toml
[build.environment]
  REACT_APP_API_URL = "https://product-traceability-api.onrender.com"
  GENERATE_SOURCEMAP = "false"
  DISABLE_ESLINT_PLUGIN = "true"
  CI = "false"
```

#### Client Environment (optional)
Create `.env.production` in `/client`:
```env
REACT_APP_API_URL=https://product-traceability-api.onrender.com
REACT_APP_NODE_ENV=production
```

### 2. API Configuration

The frontend uses a smart API configuration system:

```javascript
// Priority order for API URL:
1. process.env.REACT_APP_API_URL (highest)
2. Production URL if NODE_ENV === 'production'
3. Development URL (localhost:5000) (fallback)
```

### 3. CORS Configuration

#### Backend CORS (already configured)
Your backend allows these origins:
- `https://blockchain-product-traceability.netlify.app`
- `https://walmart-sparkthon.netlify.app`
- All `*.netlify.app` domains
- Development origins (`localhost:3000`)

#### Frontend Proxy Rules
Netlify `_redirects` and `netlify.toml` include:
```
/api/* https://product-traceability-api.onrender.com/api/:splat 200
```

## Testing the Connection

### Automatic Testing
The frontend includes `BackendConnectionStatus` component that tests:
- ✅ Basic server connectivity (`/test` endpoint)
- ✅ Authentication endpoint (`/api/auth/login`)
- ✅ Products endpoint (`/api/recent-products`)

### Manual Testing
You can test the connection by:

1. **Visit the frontend**: `https://blockchain-product-traceability.netlify.app`
2. **Check browser console** for connection logs
3. **Use the API status indicator** (shows connection status)
4. **Test authentication** by trying to log in

### API Health Check Endpoints

#### Backend Test Endpoints
- `GET /test` - Basic server health
- `GET /api/products` - Database connectivity
- `POST /api/auth/login` - Authentication system

#### Frontend Test Tools
- `BackendConnectionStatus` component
- `enhancedApiConfig.js` utilities
- Browser developer tools network tab

## Common Issues and Solutions

### Issue 1: Chunk Loading 404 Errors (CRITICAL)
**Symptoms**: 
- Console errors like "Failed to load resource: 404" for chunk files
- "Refused to apply style... MIME type ('text/html') is not a supported stylesheet MIME type"
- "Refused to execute script... MIME type ('text/html') is not executable"
- Assets loading from wrong paths like `/auth/static/css/...` instead of `/static/css/...`

**Root Cause**: 
When users directly visit routes like `/auth/login`, the browser treats `/auth/` as the base path and tries to load static assets relative to that path instead of the root.

**Solutions Applied**:
1. ✅ **Absolute PublicPath**: Set `config.output.publicPath` to full domain URL
2. ✅ **Base HTML Tag**: Added `<base href="https://blockchain-product-traceability.netlify.app/" />` to index.html
3. ✅ **Enhanced _redirects**: Comprehensive redirect rules for nested paths
4. ✅ **MIME Type Headers**: Explicit Content-Type headers in netlify.toml
5. ✅ **Multiple Redirect Patterns**: Handle single and double-nested static asset paths

**Fixed Files**:
- `client/config-overrides.js` - Absolute publicPath
- `client/public/index.html` - Base href tag
- `client/public/_redirects` - Enhanced redirect rules
- `netlify.toml` - MIME type headers

### Issue 2: CORS Errors
**Symptoms**: 
- Console errors like "CORS policy" or "Access-Control-Allow-Origin"
- API requests failing with status 0

**Solutions**:
1. Verify backend CORS includes your Netlify domain
2. Check if Netlify proxy rules are working
3. Ensure API requests use the correct URL format

### Issue 3: 404 on API Calls
**Symptoms**:
- API calls returning 404 Not Found
- Network tab shows wrong URLs

**Solutions**:
1. Check `REACT_APP_API_URL` environment variable
2. Verify API endpoints exist on backend
3. Test backend endpoints directly

### Issue 4: Authentication Issues
**Symptoms**:
- Login fails even with correct credentials
- Token-related errors

**Solutions**:
1. Check JWT configuration on backend
2. Verify token storage in localStorage
3. Check token expiration settings

### Issue 5: Slow API Responses
**Symptoms**:
- Long loading times
- Timeout errors

**Solutions**:
1. Check Render backend status
2. Verify database connection
3. Monitor Render logs for errors

## Deployment Checklist

### Before Deployment
- [ ] Backend is deployed and running on Render
- [ ] Environment variables are set correctly
- [ ] CORS is configured for production domain
- [ ] Database is connected and accessible

### Frontend Deployment
- [ ] `REACT_APP_API_URL` points to production backend
- [ ] Build completes without errors
- [ ] `_redirects` file includes API proxy rules
- [ ] Static assets load correctly

### After Deployment
- [ ] Test authentication flow
- [ ] Verify API calls work
- [ ] Check browser console for errors
- [ ] Test file uploads (if applicable)
- [ ] Monitor backend logs for issues

## Monitoring and Maintenance

### Health Checks
- Frontend includes automatic API health monitoring
- Check backend status at Render dashboard
- Monitor error logs in both platforms

### Performance
- Backend response times should be < 5 seconds
- Frontend should show loading states during API calls
- Use caching where appropriate

### Updates
- Update environment variables when backend URL changes
- Redeploy frontend when API structure changes
- Keep CORS origins updated

## Troubleshooting Commands

### Test Backend Directly
```bash
curl https://product-traceability-api.onrender.com/test
```

### Check DNS Resolution
```bash
nslookup product-traceability-api.onrender.com
```

### Test API from Browser Console
```javascript
fetch('https://product-traceability-api.onrender.com/test')
  .then(r => r.json())
  .then(console.log)
```

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify network requests in developer tools
3. Check backend logs on Render dashboard
4. Test API endpoints directly
5. Verify environment variables are correct

## Security Considerations

### Production Settings
- Always use HTTPS in production
- Set secure CORS origins (avoid wildcards)
- Use environment variables for sensitive data
- Implement rate limiting on API endpoints

### Authentication
- JWT tokens should have reasonable expiration times
- Implement token refresh mechanisms
- Use secure HTTP headers

This configuration ensures a robust connection between your Netlify frontend and Render backend with proper error handling, monitoring, and fallback mechanisms.

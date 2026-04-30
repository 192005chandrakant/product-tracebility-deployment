# ✅ GCP Deployment Checklist

## Pre-Deployment

### Setup
- [ ] Google Cloud Account created
- [ ] GCP Project created
- [ ] Billing enabled
- [ ] gcloud CLI installed
- [ ] Docker installed  
- [ ] Firebase CLI installed
- [ ] Node.js v18+ installed

### Configuration Files
- [ ] Backend `.env.example` updated with PORT=8080
- [ ] Frontend `.env.example` updated with Cloud Run URL
- [ ] `Dockerfile` created in server/
- [ ] `.dockerignore` created in server/
- [ ] `firebase.json` configured
- [ ] `.github/workflows/deploy-cloud-run.yml` ready

### Database
- [ ] MongoDB Atlas cluster created
- [ ] Connection string obtained
- [ ] Network access configured (allow GCP IPs)
- [ ] Database name chosen

### External Services
- [ ] Cloudinary account created (API key ready)
- [ ] JWT secret generated
- [ ] Firebase project created (if using Auth)
- [ ] Gemini API key obtained (if using AI)

---

## Backend Deployment

### Local Verification
- [ ] Backend runs locally: `npm start`
- [ ] Health endpoint works: `http://localhost:8080/api/health`
- [ ] CORS is enabled

### Docker Build
- [ ] Docker image builds: `docker build -t test .`
- [ ] Docker runs locally: `docker run -p 8080:8080 test`

### GCP Authentication
- [ ] Logged in: `gcloud auth login`
- [ ] Project set: `gcloud config set project YOUR_ID`
- [ ] Docker configured: `gcloud auth configure-docker gcr.io`

### Cloud Run Deployment
- [ ] Image pushed to GCR
- [ ] Cloud Run service created
- [ ] URL obtained: `https://backend-xyz.a.run.app`
- [ ] Health check passes: `curl /api/health`

### Environment Variables Set
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI=correct`
- [ ] `JWT_SECRET=strong-random-key`
- [ ] `CORS_ALLOWED_ORIGINS=firebase-url`
- [ ] `CLOUDINARY_*` credentials
- [ ] `GEMINI_API_KEY` (if applicable)
- [ ] `TRUST_PROXY=true`

### Backend Testing
- [ ] Health endpoint responds
- [ ] Can connect to MongoDB
- [ ] CORS headers present
- [ ] Logs viewable via `gcloud run logs read`

---

## Frontend Deployment

### Local Build
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] No critical webpack warnings
- [ ] `build/` directory created

### Build Configuration
- [ ] `.env.production` created
- [ ] `REACT_APP_API_URL` set to Cloud Run URL
- [ ] `NODE_ENV=production`
- [ ] `GENERATE_SOURCEMAP=false`

### Firebase Setup
- [ ] Firebase project selected: `firebase init`
- [ ] Hosting configured
- [ ] `firebase.json` updated with correct project ID
- [ ] Logged in: `firebase login`

### Firebase Deployment
- [ ] Build tested locally
- [ ] Frontend deployed: `firebase deploy --only hosting`
- [ ] URL obtained: `https://project.web.app`
- [ ] Site loads without errors

### Firebase Testing
- [ ] Can access site
- [ ] Redirects work (SPA routing)
- [ ] Static assets load
- [ ] No 404 errors

---

## Connectivity & Integration

### API Connection
- [ ] Frontend can reach backend
- [ ] Requests go to Cloud Run URL
- [ ] Responses have CORS headers
- [ ] No CORS errors in console

### Feature Testing
- [ ] User signup/login works
- [ ] Can create product
- [ ] Can upload image
- [ ] Can generate QR code
- [ ] Can scan QR code
- [ ] Can view product details
- [ ] AI features work (if implemented)

### Error Checking
- [ ] Browser console has no errors (F12)
- [ ] Network tab shows successful requests
- [ ] Backend logs show requests
- [ ] No undefined API URLs

---

## Demonstration

### Demo Sequence
- [ ] Open GCP Console
  - [ ] Show Cloud Run service running
  - [ ] Show recent logs
  - [ ] Show service details (URL, memory, CPU)

- [ ] Open Firebase Console
  - [ ] Show hosting deployment
  - [ ] Show analytics (if available)

- [ ] Open Frontend App
  - [ ] Show landing page
  - [ ] Login/Signup functionality
  - [ ] Product creation flow
  - [ ] QR code generation
  - [ ] Product details view
  - [ ] Admin features (if applicable)

- [ ] Show Network Tab (F12)
  - [ ] Perform action
  - [ ] Show API request to Cloud Run
  - [ ] Show successful response
  - [ ] Show CORS headers

- [ ] Performance Check
  - [ ] Page loads quickly
  - [ ] No console errors
  - [ ] Responsive design works
  - [ ] Images load properly

---

## Submission Preparation

### Documentation
- [ ] README updated with deployment info
- [ ] GCP_DEPLOYMENT_GUIDE.md reviewed
- [ ] DEPLOYMENT_QUICK_REFERENCE.md bookmarked
- [ ] Deployment steps documented

### Screenshots
- [ ] GCP Cloud Run console screenshot
- [ ] Firebase Hosting console screenshot
- [ ] Frontend app screenshot
- [ ] API call in Network tab screenshot

### Video/Demo
- [ ] Demo flow rehearsed
- [ ] All features demonstrated
- [ ] API connectivity shown
- [ ] No errors during demo

### Submission Form
- [ ] Backend URL ready to paste
- [ ] Frontend URL ready to paste
- [ ] Description of deployment written:
  ```
  Frontend deployed on Firebase Hosting at [URL]
  Backend deployed on Google Cloud Run at [URL]
  Both connected and fully functional
  ```

---

## Post-Deployment

### Monitoring
- [ ] Set up Cloud Run alarms
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Monitor Cloud Run quotas

### Maintenance
- [ ] Regular backup of MongoDB
- [ ] Update dependencies periodically
- [ ] Monitor billing
- [ ] Check for security updates

### Scaling
- [ ] Adjust Cloud Run memory/CPU if needed
- [ ] Increase max instances if traffic grows
- [ ] Optimize database queries if slow
- [ ] Add caching if needed

---

## Final Verification

- [ ] All checklist items completed
- [ ] Both services live and accessible
- [ ] API connectivity working
- [ ] No console errors
- [ ] Demo ready and smooth
- [ ] Documentation complete
- [ ] Ready for submission

---

**Status**: `READY FOR DEPLOYMENT` ✅

**Date Prepared**: [Current Date]
**Deployed By**: [Your Name]
**Last Updated**: [Date]

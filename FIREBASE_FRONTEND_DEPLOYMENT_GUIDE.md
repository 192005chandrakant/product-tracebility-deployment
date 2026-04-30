# Firebase Frontend Deployment Guide

This guide is tailored to the current Product Traceability codebase and shows how to deploy the React frontend to Firebase Hosting while keeping it connected to the Cloud Run backend.

## What you are deploying

- Frontend: React app in `client/`
- Build output: `client/build/`
- Hosting: Firebase Hosting
- Backend API: Google Cloud Run

The app already has a flexible API resolver in [client/src/utils/apiConfig.js](client/src/utils/apiConfig.js) that uses `REACT_APP_API_URL` when present. That means the deployed frontend only needs the backend URL in its production environment file.

## Prerequisites

Before deploying, make sure you have:

- A Firebase project created
- Firebase CLI installed
- Logged in with `firebase login`
- Your Cloud Run backend URL ready, for example `https://backend-service-abc.a.run.app`
- The backend CORS list updated to include your Firebase domain

## 1. Prepare the frontend

The React app is already set up for environment-based API URLs.

Important files:

- [client/src/utils/apiConfig.js](client/src/utils/apiConfig.js)
- [client/package.json](client/package.json)
- [firebase.json](firebase.json)

Create or update `client/.env.production` with your real values:

```env
REACT_APP_API_URL=https://your-backend-service.a.run.app
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_DEBUG=false
REACT_APP_DEBUG_API=false
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

Notes for this codebase:

- `REACT_APP_API_URL` is the main setting that points the UI to Cloud Run.
- Firebase auth config is read from `client/src/utils/firebase.js`.
- If you do not use Firebase Authentication, the hosting deploy still works, but auth features that depend on Firebase env vars will not.

## 2. Build the frontend

From the repo root:

```bash
cd client
npm install
npm run build
```

The build should create `client/build/`.

If the build succeeds locally, you can deploy the same output to Firebase Hosting.

## 3. Verify Firebase Hosting config

The repo now uses this Hosting path in [firebase.json](firebase.json):

- `public: client/build`

That means you can deploy from the repository root after building the frontend.

The configuration also includes:

- SPA rewrite to `/index.html`
- Cache headers for static assets
- A Hosting target named `product-traceability`

## 4. Initialize Firebase Hosting

If this is the first Firebase deploy for the project, run:

```bash
firebase login
firebase init hosting
```

Choose these options:

- Use an existing project
- Select your Firebase project
- Public directory: `client/build`
- Configure as a single-page app: Yes
- Set up automatic builds and deploys with GitHub: Optional

If Firebase asks to overwrite `firebase.json`, keep the current settings or reapply the same Hosting config.

## 5. Deploy

From the repo root:

```bash
firebase deploy --only hosting
```

If you use a Hosting target, you can also deploy explicitly:

```bash
firebase deploy --only hosting:product-traceability
```

Firebase will return a live URL such as:

- `https://your-project.web.app`
- `https://your-project.firebaseapp.com`

## 6. Connect frontend to backend

After the frontend is deployed, update your Cloud Run backend environment variable list to allow the Firebase domain.

Use a value like:

```env
CORS_ALLOWED_ORIGINS=https://your-project.web.app,https://your-project.firebaseapp.com
```

Your backend already supports CORS allow-listing in [server/index.js](server/index.js).

## 7. Test the deployed app

After deployment, verify these flows:

- Open the Firebase Hosting URL
- Check that the landing page loads
- Try login/signup
- Load a product detail page
- Create or update a product
- Confirm API calls go to the Cloud Run URL in browser DevTools
- Confirm there are no CORS errors in the console

Also test this endpoint directly:

```bash
curl https://your-backend-service.a.run.app/api/health
```

## 8. Common issues and fixes

### Blank page after deploy

- Make sure `npm run build` completed successfully in `client/`
- Confirm `firebase.json` points to `client/build`
- Check browser console for missing environment variables

### API requests still go to localhost

- Set `REACT_APP_API_URL` in `client/.env.production`
- Rebuild the app with `npm run build`
- Redeploy Firebase Hosting

### CORS errors

- Add the Firebase domain to `CORS_ALLOWED_ORIGINS`
- Redeploy the backend on Cloud Run

### Firebase auth errors

- Confirm the `REACT_APP_FIREBASE_*` variables match your Firebase project
- Confirm Authentication is enabled in the Firebase console if your workflow uses it

## Deployment checklist for this codebase

- [ ] `client/.env.production` contains the Cloud Run backend URL
- [ ] `client/build/` exists after running `npm run build`
- [ ] `firebase.json` points to `client/build`
- [ ] Cloud Run CORS allows the Firebase domain
- [ ] Deployed app loads without console errors
- [ ] API requests reach Cloud Run

## Recommended deploy order

1. Deploy backend to Cloud Run
2. Copy the Cloud Run URL
3. Put that URL into `client/.env.production`
4. Rebuild the React app
5. Deploy frontend to Firebase Hosting
6. Add the Firebase domain to backend CORS and redeploy backend if needed

## Files to review

- [client/src/utils/apiConfig.js](client/src/utils/apiConfig.js)
- [client/src/utils/firebase.js](client/src/utils/firebase.js)
- [client/package.json](client/package.json)
- [firebase.json](firebase.json)
- [server/index.js](server/index.js)

## Short version

```bash
cd client
npm install
npm run build
cd ..
firebase login
firebase deploy --only hosting
```

This works with the current repo because the Hosting config now points at `client/build`.

# Google Login Debugging Guide

## 🔴 Error: 401 Unauthorized - Token Verification Failed

This guide helps diagnose and fix the `401 Unauthorized` error when attempting to login with Google.

---

## ⚡ Quick Diagnostics

### Step 1: Check Firebase Configuration Status

Make a GET request to the diagnostic endpoint:

```bash
# In development (local)
curl http://localhost:5000/api/auth/debug/firebase-status

# In production
curl https://your-api-url.com/api/auth/debug/firebase-status
```

**Expected response should show:**
```json
{
  "firebase": {
    "initialized": true,
    "firebaseApp": true,
    "hasServiceAccount": true,
    "environment": "development",
    "allowUnverified": false,
    "error": null
  },
  "environment": {
    "NODE_ENV": "development",
    "FIREBASE_SERVICE_ACCOUNT_JSON": "SET"
  },
  "diagnostics": {
    "canVerifyTokens": true,
    "requiresFirebase": false,
    "recommendedAction": "Firebase is properly configured"
  }
}
```

---

## ❌ Common Issues & Solutions

### Issue 1: Firebase Admin SDK Not Initialized

**Error Message:**
```
Firebase service not configured
Debug: Firebase Admin SDK could not be initialized. Check FIREBASE_SERVICE_ACCOUNT_JSON environment variable.
```

**Cause:** `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable is not set or invalid.

**Solution:**

#### A. Verify Environment Variable is Set

```bash
# Windows PowerShell
echo $env:FIREBASE_SERVICE_ACCOUNT_JSON

# Linux/Mac
echo $FIREBASE_SERVICE_ACCOUNT_JSON

# Docker / Node console
console.log(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
```

#### B. Get Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `product-tracebility-e6469`
3. Click **Project Settings** (gear icon)
4. Click **Service Accounts** tab
5. Click **Generate New Private Key**
6. Copy the entire JSON file content

#### C. Set Environment Variable Correctly

The JSON MUST be a single-line string. Use one of these methods:

**Method 1: `.env` file (Development)**
```bash
# In .env file - DO NOT BREAK THE LINE
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"product-tracebility-e6469",...}
```

**Method 2: Set locally in terminal**
```bash
# PowerShell
$env:FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# Bash
export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

**Method 3: Docker / Production**
Add to docker-compose.yml or deploy configuration:
```yaml
environment:
  FIREBASE_SERVICE_ACCOUNT_JSON: '{"type":"service_account",...}'
```

---

### Issue 2: Malformed JSON in Environment Variable

**Error Message:**
```
Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: Unexpected token
Debug: JSON is malformed - check for escaped newlines or quotes
```

**Cause:** JSON contains literal newlines or improper escaping.

**Solution:**

1. Remove all newlines from JSON
2. Verify quotes are straight quotes ("), not curly quotes (" ")
3. Use a JSON validator: https://jsonlint.com/

**Example - WRONG:**
```json
{
  "type": "service_account",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE..."
}
```

**Example - RIGHT:**
```json
{"type":"service_account","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE..."}
```

---

### Issue 3: Missing Required Fields in Service Account

**Error Message:**
```
Service account missing required fields: [private_key, client_email]
```

**Cause:** Service account JSON is incomplete or truncated.

**Solution:**

Verify your service account JSON contains all required fields:

```json
{
  "type": "service_account",
  "project_id": "product-tracebility-e6469",
  "private_key_id": "d09a65e1...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEv...",
  "client_email": "firebase-adminsdk-fbsvc@product-tracebility-e6469.iam.gserviceaccount.com",
  "client_id": "109761421876010866595",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40product-tracebility-e6469.iam.gserviceaccount.com"
}
```

---

### Issue 4: Token Has Expired

**Error Message:**
```
Token verification failed
Debug: Token has expired. User should re-authenticate.
```

**Cause:** Firebase ID token expired before server verification completed.

**Solution:**

This is rare and usually transient. User should:
1. Refresh the page
2. Close the login popup and try again
3. Check that client system clock is synchronized

---

### Issue 5: Invalid Token Format

**Error Message:**
```
Token verification failed
Debug: The token format is invalid or corrupted.
```

**Cause:** Token is malformed or corrupted during transmission.

**Solution:**

1. **Check browser console** for errors before sending token
2. **Verify Firebase initialization** in browser:
   ```javascript
   // In browser console
   firebase.auth().currentUser?.getIdToken().then(token => {
     console.log('Token valid. Length:', token.length);
   });
   ```
3. **Restart browser** and clear cache
4. **Check CORS configuration** - ensure backend allows frontend origin

---

## 🧪 Full Testing Steps

### 1. Backend Verification
```bash
# Check Firebase status
curl http://localhost:5000/api/auth/debug/firebase-status

# Check if server is running
curl http://localhost:5000/api/auth/login
```

### 2. Client Verification
Open browser DevTools Console and run:
```javascript
// Test Firebase authentication
const { getFirebaseAuth } = await import('http://localhost:3000/src/utils/firebase.js');
const auth = getFirebaseAuth();
console.log('Firebase configured:', !!auth);

// Test token generation
const user = firebase.auth().currentUser;
if (user) {
  const token = await user.getIdToken();
  console.log('Token generated, length:', token.length);
}
```

### 3. Full Google Login Flow
```bash
# Terminal 1: Watch backend logs
node server/index.js

# Terminal 2: Watch client dev server
cd client && npm start

# Browser: 
# 1. Open http://localhost:3000
# 2. Click "Continue with Google"
# 3. Watch browser console and terminal logs
```

---

## 📊 Debug Mode

Enable detailed debugging:

```bash
# Frontend
export REACT_APP_DEBUG=true

# Backend
export DEBUG_MODE=true
export NODE_ENV=development
```

In development, the `/api/auth/google-login` response includes debug information:
```json
{
  "error": "Authentication failed",
  "message": "Token verification failed",
  "code": "TOKEN_VERIFICATION_FAILED",
  "debug": "Firebase Admin SDK could not be initialized...",
  "hint": "Check Firebase configuration at /api/auth/debug/firebase-status"
}
```

---

## 📋 Checklist

- [ ] FIREBASE_SERVICE_ACCOUNT_JSON is set in `.env`
- [ ] Service account JSON is valid (use jsonlint.com)
- [ ] JSON is on a single line (no newlines)
- [ ] Required fields present: `type`, `project_id`, `private_key`, `client_email`
- [ ] `/api/auth/debug/firebase-status` shows `"initialized": true`
- [ ] MongoDB connection is working (`/api/auth/login` responds)
- [ ] Frontend Firebase config is correct (check `.env`)
- [ ] Browser Firebase library is loaded (check DevTools console)
- [ ] CORS is allowing frontend origin

---

## 🆘 Still Having Issues?

1. **Check server logs:**
   ```
   🔍 Checking FIREBASE_SERVICE_ACCOUNT_JSON environment variable...
   ❌ FIREBASE_SERVICE_ACCOUNT_JSON not set in environment
   ```

2. **Check browser network tab:**
   - Look for `/api/auth/google-login` request
   - Check Response headers
   - Verify 401 response body contains `debug` field

3. **Enable development mode:**
   ```bash
   # Restart with debug enabled
   export DEBUG_MODE=true
   export ALLOW_UNVERIFIED_LOGIN=false  # Force verification
   npm start
   ```

4. **Verify token on client:**
   ```javascript
   // In browser console
   const token = await firebase.auth().currentUser?.getIdToken();
   console.log('Token exists:', !!token);
   console.log('Token length:', token?.length);
   console.log('Token format:', token?.split('.').length === 3 ? 'Valid JWT' : 'Invalid');
   ```

---

## ✅ Success Indicators

When everything is configured correctly:

1. **Backend logs show:**
   ```
   ✅ Firebase Admin SDK initialized successfully
   ✅ Firebase token verified successfully
   ✅ New user created from Google OAuth
   ✅ Google login successful, JWT generated
   ```

2. **Browser console shows:**
   ```
   ✅ Google authentication successful for: user@example.com
   ✅ Backend verification complete. JWT stored.
   ```

3. **Server responds with 200:**
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "role": "consumer",
     "email": "user@example.com",
     "success": true,
     "isNewUser": true,
     "user": { ... }
   }
   ```

---

## 📞 Reference

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Service Account Setup](https://firebase.google.com/docs/app-hosting/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Project Details](/memories/session/google-login-analysis.md)

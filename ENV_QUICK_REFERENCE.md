# Environment Variables - Quick Setup Checklist

## 📋 Files to Create/Copy

### For Local Development

```bash
# DO THIS:
cp .env.render.example .env.production
# Edit: .env.production (backend variables)
# Add to .gitignore: Already included ✅

cp .env.vercel.example client/.env.production.local
# Edit: client/.env.production.local (frontend variables)
# Add to .gitignore: Already included ✅
```

---

## 🚀 Deployment Checklist

### Frontend (Vercel)

```
FILE: client/.env.production.local
COPY FROM: .env.vercel.example

REQUIRED VARIABLES:
□ REACT_APP_API_URL=https://your-render-api.onrender.com
□ REACT_APP_PUBLIC_URL=/

OPTIONAL VARIABLES:
□ REACT_APP_FIREBASE_API_KEY=...
□ REACT_APP_FIREBASE_AUTH_DOMAIN=...
□ REACT_APP_FIREBASE_PROJECT_ID=...
□ REACT_APP_FIREBASE_STORAGE_BUCKET=...
□ REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
□ REACT_APP_FIREBASE_APP_ID=...
□ REACT_APP_GOOGLE_CLIENT_ID=...

DEPLOYMENT METHOD:
Option 1: Push .env.production.local to GitHub (not recommended - leaks secrets)
Option 2: Use Vercel Dashboard → Settings → Environment Variables (RECOMMENDED)
         Add each variable manually in dashboard for Production environment
```

### Backend (Render)

```
FILE: .env.production
COPY FROM: .env.render.example
LOCATION: Root directory (same as package.json)

CRITICAL VARIABLES (MUST HAVE):
□ NODE_ENV=production
□ PORT=8080
□ MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
□ JWT_SECRET=<64-char-hex-string>
□ CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
□ TRUST_PROXY=true

RECOMMENDED (Authentication):
□ FIREBASE_PROJECT_ID=...
□ FIREBASE_PRIVATE_KEY=...
□ FIREBASE_CLIENT_EMAIL=...

OPTIONAL (Features):
□ GEMINI_API_KEY=...
□ CLOUDINARY_CLOUD_NAME=...
□ CLOUDINARY_API_KEY=...
□ CLOUDINARY_API_SECRET=...
□ SEPOLIA_RPC_URL=...
□ CONTRACT_ADDRESS=...
□ PRIVATE_KEY=...

DEPLOYMENT METHOD:
1. Create Render Web Service
2. Connect GitHub repo
3. Set Build Command: npm run build:frontend && npm --prefix server install
4. Set Start Command: npm --prefix server start
5. Go to Settings → Environment → Add variables from .env.production
6. For sensitive values: Toggle "Secret" switch
7. Save → Auto-redeploy
```

---

## 📁 Directory Structure After Setup

```
project-root/
│
├── .env.vercel.example              ← Template (commit to Git ✅)
├── .env.render.example              ← Template (commit to Git ✅)
├── .env.production                  ← Secret (in .gitignore ✅)
├── .gitignore                        ← Already configured ✅
│
├── client/
│   ├── .env.production.local        ← Secret (in .gitignore ✅)
│   ├── package.json
│   └── src/
│
└── server/
    ├── index.js
    └── package.json
```

---

## 🔑 How to Generate Required Secrets

### JWT_SECRET

```bash
# One-liner to generate secure JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example (copy entire output):
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# Add to .env.production:
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### FIREBASE_PRIVATE_KEY

```bash
# 1. Go to: Firebase Console
# 2. Project Settings → Service Accounts
# 3. Click: "Generate New Private Key"
# 4. Opens JSON file with format:
# {
#   "type": "service_account",
#   "project_id": "your-project",
#   "private_key": "-----BEGIN PRIVATE KEY-----\nVeryLongBase64String\n-----END PRIVATE KEY-----\n",
#   ...
# }

# 5. Copy the private_key value (include \n characters):
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVeryLongBase64String\n-----END PRIVATE KEY-----\n"
```

### PRIVATE_KEY (for blockchain)

```bash
# 1. Create Ethereum wallet (if you don't have one):
#    - MetaMask: https://metamask.io
#    - Or generate with Hardhat: npx hardhat accounts
#
# 2. Get private key WITHOUT 0x prefix:
#    MetaMask: Settings → Security & Privacy → Show private key
#    
# 3. Copy without the 0x:
PRIVATE_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## 📝 Variable Source Reference

| Variable | Where to Get | Example |
|----------|--------------|---------|
| `MONGODB_URI` | MongoDB Atlas → Connect → Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | 64-char hex string |
| `CORS_ALLOWED_ORIGINS` | Vercel → Settings → Domains | `https://your-app.vercel.app` |
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings | `my-firebase-project` |
| `FIREBASE_PRIVATE_KEY` | Firebase → Service Accounts → Generate Key | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----` |
| `FIREBASE_CLIENT_EMAIL` | Firebase → Service Accounts → Email | `firebase-adminsdk@project.iam.gserviceaccount.com` |
| `GEMINI_API_KEY` | Google AI Studio → API Keys | `AIzaSyD...` |
| `CLOUDINARY_*` | Cloudinary Dashboard → Settings | Various |
| `SEPOLIA_RPC_URL` | Infura → Create Project → Endpoints | `https://sepolia.infura.io/v3/your-id` |
| `CONTRACT_ADDRESS` | Deploy script output | `0x...` |
| `PRIVATE_KEY` | Wallet or Hardhat accounts | `0x...` (or without 0x) |
| `REACT_APP_API_URL` | Render → Settings → Rendering → URL | `https://your-api.onrender.com` |
| `REACT_APP_FIREBASE_API_KEY` | Firebase Console → Project Settings | `AIzaSyD...` |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials | `xxx.apps.googleusercontent.com` |

---

## ⚠️ Security Reminders

```
🔒 SECRETS TO PROTECT:
✗ Do NOT commit .env.production
✗ Do NOT commit .env.production.local
✗ Do NOT share JWT_SECRET
✗ Do NOT share PRIVATE_KEY
✗ Do NOT share FIREBASE_PRIVATE_KEY
✗ Do NOT share CLOUDINARY_API_SECRET
✗ Do NOT share database password in MONGODB_URI
✗ Do NOT hardcode secrets in code

✅ SAFE TO COMMIT:
✅ .env.vercel.example (template, no real values)
✅ .env.render.example (template, no real values)
✅ .gitignore (already configured)
✅ Public API keys (REACT_APP_*, Firebase API Key)
```

---

## 🧪 Verification Commands

### After Setting Up .env.production (Backend)

```bash
# Check file exists
cat .env.production

# Check required variables are set
grep "MONGODB_URI\|JWT_SECRET\|CORS_ALLOWED_ORIGINS" .env.production

# Expected output (values should be filled):
# MONGODB_URI=mongodb+srv://...
# JWT_SECRET=a1b2c3d4...
# CORS_ALLOWED_ORIGINS=https://...
```

### After Setting Up client/.env.production.local (Frontend)

```bash
# Check file exists
cat client/.env.production.local

# Check required variables
grep "REACT_APP_API_URL\|REACT_APP_PUBLIC_URL" client/.env.production.local

# Expected output:
# REACT_APP_API_URL=https://your-api.onrender.com
# REACT_APP_PUBLIC_URL=/
```

### Verify Files Are Ignored

```bash
# Check both files are in .gitignore
grep -E ".env.production|\.env\.production\.local" .gitignore

# Expected output:
# .env
# .env.production
# .env.local
# .env.*.local
```

---

## 🚀 Deployment Steps

### Step 1: Prepare Files Locally

```bash
# 1. Copy templates
cp .env.vercel.example client/.env.production.local
cp .env.render.example .env.production

# 2. Edit both files with your values
nano .env.production
nano client/.env.production.local

# 3. Verify they're in .gitignore
cat .gitignore | grep ".env"

# 4. DO NOT COMMIT THESE FILES
git status  # Should NOT show .env.production or client/.env.production.local
```

### Step 2: Deploy Backend (Render)

```bash
# 1. Push to GitHub (without .env files - they're ignored)
git add .env.vercel.example .env.render.example
git commit -m "Add env templates"
git push origin main

# 2. Go to Render.com and create Web Service
# 3. Connect GitHub repo
# 4. Add environment variables from .env.production
# 5. Wait for deployment ✅
# 6. Get Render URL: https://your-api.onrender.com
```

### Step 3: Deploy Frontend (Vercel)

```bash
# 1. Go to Vercel.com dashboard
# 2. Add REACT_APP_API_URL = https://your-api.onrender.com
# 3. Add other REACT_APP_* variables
# 4. Redeploy
# 5. Wait for deployment ✅
# 6. Get Vercel URL: https://your-app.vercel.app
```

### Step 4: Verify

```bash
# Test backend
curl https://your-api.onrender.com/api/health

# Test frontend (open in browser)
https://your-app.vercel.app

# Check DevTools for errors
F12 → Console → Network tabs
```

---

## 📚 Related Documentation

- [ENV_SETUP_VERCEL_RENDER.md](./ENV_SETUP_VERCEL_RENDER.md) - Full setup guide
- [DEPLOYMENT_QUICK_COMMANDS.md](./DEPLOYMENT_QUICK_COMMANDS.md) - Quick deploy commands
- [DEPLOYMENT_404_FIX.md](./DEPLOYMENT_404_FIX.md) - Asset loading fixes
- [.env.vercel.example](./.env.vercel.example) - Frontend template
- [.env.render.example](./.env.render.example) - Backend template

---

## ✅ Final Checklist

Before deploying, verify:

### Local Files
- [ ] `.env.production` created and filled (backend)
- [ ] `client/.env.production.local` created and filled (frontend)
- [ ] Both files listed in `.gitignore`
- [ ] No secrets committed to Git

### Vercel (Frontend)
- [ ] Project created and connected to GitHub
- [ ] Environment variables set in dashboard
- [ ] `REACT_APP_API_URL` points to Render backend
- [ ] Build command: `npm --prefix client run build`
- [ ] Deployment successful ✅

### Render (Backend)
- [ ] Service created and connected to GitHub
- [ ] Environment variables set in dashboard
- [ ] Build command: `npm run build:frontend && npm --prefix server install`
- [ ] Start command: `npm --prefix server start`
- [ ] All sensitive vars marked as "Secret"
- [ ] Deployment successful ✅

### Integration
- [ ] Frontend loads at Vercel URL
- [ ] No CSS/JS 404 errors
- [ ] API health check works: `/api/health` → 200
- [ ] CORS allows frontend domain
- [ ] Database operations work (create/read products)

---

## 🆘 Quick Troubleshooting

**Problem:** API calls fail
```
Solution: Check REACT_APP_API_URL matches your Render URL
Render: https://your-api.onrender.com (NO trailing slash)
```

**Problem:** MongoDB connection fails
```
Solution: Check MONGODB_URI syntax and whitelist Render IP
MongoDB Atlas → Network Access → Add 0.0.0.0/0 (development)
```

**Problem:** 404 errors for CSS/JS
```
Solution: Verify frontend build was created
Render logs should show client build completing
```

**Problem:** CORS errors in browser
```
Solution: Update CORS_ALLOWED_ORIGINS to your Vercel URL
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
Restart Render service after changing
```

---

🎉 **You're all set! Ready to deploy!**

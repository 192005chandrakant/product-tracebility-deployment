# Firebase Google Auth - Developer Quick Reference

## 🚀 Quick Start Commands

### Install Dependencies
```bash
# Frontend
cd client && npm install firebase

# Backend
cd server && npm install firebase-admin
```

### Start Development Servers
```bash
# Terminal 1: Backend (port 5000)
cd server && npm run dev

# Terminal 2: Frontend (port 3000)
cd client && npm start
```

---

## 🔧 Environment Variables

### Frontend (.env)
```env
REACT_APP_FIREBASE_API_KEY=AIzaSyD...
REACT_APP_FIREBASE_AUTH_DOMAIN=myproject.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=myproject
REACT_APP_FIREBASE_STORAGE_BUCKET=myproject.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
REACT_APP_API_URL=http://localhost:5000
```

### Backend (.env)
```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
JWT_SECRET=your_super_secret_key_here
MONGODB_URI=mongodb://...
NODE_ENV=development
```

---

## 📋 API Endpoints

### Google Login Endpoint
```
POST /api/auth/google-login
Content-Type: application/json

Request Body:
{
  "firebaseToken": "eyJhbGciOiJSUzI1NiIs...",
  "googleUser": {
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "profilePicture": "https://...",
    "googleUID": "109..."
  }
}

Response (Success - 200):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "consumer",
  "email": "user@gmail.com",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "consumer"
  }
}

Response (Error - 401):
{
  "error": "Authentication failed",
  "message": "Invalid authentication token"
}
```

---

## 💻 Code Snippets

### Frontend: Using Google Login Hook
```javascript
import { useGoogleLogin } from '../hooks/useGoogleLogin';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const { googleLogin, loading, error, clearError } = useGoogleLogin();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const result = await googleLogin();
    
    if (result.success) {
      toast.success('Logged in successfully!');
      window.dispatchEvent(new Event('userLogin'));
      navigate('/home');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <button 
      onClick={handleGoogleLogin}
      disabled={loading}
    >
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </button>
  );
}
```

### Backend: Verifying Firebase Token
```javascript
const { verifyFirebaseToken } = require('../utils/firebaseVerification');

// In your endpoint
const tokenVerification = await verifyFirebaseToken(firebaseToken);

if (!tokenVerification.verified) {
  return res.status(401).json({
    error: 'Authentication failed',
    message: tokenVerification.error
  });
}

// Access verified claims
const { email, uid, picture } = tokenVerification.claims;
```

### Frontend: Using JWT After Login
```javascript
// Store JWT
const token = response.data.token;
localStorage.setItem('token', token);

// Use in API calls
const response = await fetch('/api/products', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Or with axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000'
});

// Add token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🧪 Testing

### Test Google Login (cURL)
```bash
# First get a valid Firebase token (from Firebase test user or frontend)
FIREBASE_TOKEN="eyJhbGciOiJSUzI1NiIs..."

# Call the endpoint
curl -X POST http://localhost:5000/api/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseToken": "'$FIREBASE_TOKEN'",
    "googleUser": {
      "email": "testuser@gmail.com",
      "firstName": "Test",
      "lastName": "User",
      "profilePicture": "https://example.com/pic.jpg",
      "googleUID": "1234567890"
    }
  }'
```

### Test Protected Route
```bash
# Use the JWT from Google login response
JWT_TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### MongoDB Verification
```javascript
// Check if user was created/updated
db.users.findOne({ email: 'testuser@gmail.com' })

// Expected output:
{
  _id: ObjectId("..."),
  email: "testuser@gmail.com",
  password: null,  // No password for OAuth users
  role: "consumer",
  firstName: "Test",
  lastName: "User",
  oauth: {
    provider: "google",
    uid: "1234567890",
    profilePicture: "https://...",
    verifiedAt: ISODate("2024-01-15T...")
  },
  isActive: true,
  lastLogin: ISODate("2024-01-15T...")
}
```

---

## 🔐 Security Checklist

### Before Production
- [ ] Firebase credentials NOT in git/code
- [ ] Environment variables configured
- [ ] CORS properly restricted
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] Firebase service account has minimal permissions
- [ ] HTTPS enabled for all endpoints
- [ ] Rate limiting on auth endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Logging configured (but not logging tokens)
- [ ] Database backups configured

### Monitoring
- [ ] Failed login attempts logged
- [ ] Token verification errors monitored
- [ ] Database connection health checked
- [ ] API response times monitored
- [ ] Error rate alerting configured

---

## 🛠️ Debugging Commands

### Frontend Console
```javascript
// Check if token is stored
console.log(localStorage.getItem('token'));

// Check decoded token
const { jwtDecode } = require('jwt-decode');
const decoded = jwtDecode(localStorage.getItem('token'));
console.log(decoded);

// Check Firebase auth state
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log(auth.currentUser);
```

### Backend Logs
```bash
# Set debug logging
export AUTH_DEBUG_LOGS=true

# Tail logs while server runs
npm run dev 2>&1 | grep -E "✅|❌|🔐|📝"

# Check for specific user
mongo
> use product_traceability
> db.users.findOne({ email: 'test@gmail.com' })
```

---

## 📱 Frontend URLs

| Route | Purpose |
|-------|---------|
| `/auth/login` | Login page (Google + Email) |
| `/auth/register` | Registration page (Email only) |
| `/home` | Dashboard (logged in required) |
| `/profile` | User profile (logged in required) |

---

## 🚨 Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Firebase is not initialized" | Missing .env vars | Restart dev server |
| "Token verification failed" | Invalid Firebase token | Check service account key |
| "signInWithPopup is not a function" | Wrong import | Import from 'firebase/auth' |
| "Email verification failed" | Email mismatch | Check email normalization |
| "Account inactive" | User disabled | Check MongoDB user.isActive |
| "Popup blocked" | Wrong trigger context | Call from direct click handler |

---

## 📊 Database Schema - OAuth User

```javascript
// User with Google OAuth
{
  email: "user@gmail.com",
  password: null,  // No password for OAuth users
  role: "consumer",
  firstName: "John",
  lastName: "Doe",
  oauth: {
    provider: "google",
    uid: "109876543210",
    profilePicture: "https://lh3.googleusercontent.com/...",
    verifiedAt: ISODate("2024-01-15T10:30:00Z")
  },
  isActive: true,
  lastLogin: ISODate("2024-01-15T10:30:00Z"),
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

---

## 🔄 Response Flow

### Successful Google Login Flow
```
1. Frontend: Click "Sign in with Google"
   ↓
2. Firebase: Opens Google consent popup
   ↓
3. User: Approves access
   ↓
4. Firebase: Returns ID Token
   ↓
5. Frontend: Extract user info from token
   ↓
6. Frontend: Send token + user data to backend
   ↓
7. Backend: Verify token signature
   ↓
8. Backend: Validate email
   ↓
9. Backend: Create/update user in MongoDB
   ↓
10. Backend: Generate JWT
   ↓
11. Backend: Return JWT to frontend
   ↓
12. Frontend: Store JWT in localStorage
   ↓
13. Frontend: Dispatch userLogin event
   ↓
14. Frontend: Navigate to /home
   ↓
✅ User logged in!
```

---

## 🎯 One-Liner Commands

```bash
# Test both login methods work
curl http://localhost:5000/api/auth/login \
  -d '{"email":"test@test.com","password":"test"}' && \
curl http://localhost:5000/api/auth/google-login \
  -d '{"firebaseToken":"...","googleUser":{"email":"test@gmail.com"}}'

# Check user in database
mongo mongodb://localhost/product_traceability --eval "db.users.find().pretty()"

# View frontend logs
npm start 2>&1 | grep -E "google|auth|login"

# View backend logs with Firebase info
NODE_ENV=development npm run dev 2>&1 | grep -E "Firebase|google|🔐"
```

---

## 📞 Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [JWT.io](https://jwt.io) - Decode JWTs
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite) - Local testing

---

**🎉 Ready to go! See FIREBASE_INTEGRATION_GUIDE.md for detailed setup.**

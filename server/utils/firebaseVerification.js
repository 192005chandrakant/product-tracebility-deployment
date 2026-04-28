/**
 * Firebase Token Verification Utility
 * Verifies Firebase ID tokens on the server side
 * 
 * SECURITY: Never trust the token from the frontend alone!
 * This validates the token signature and authenticity.
 */

// Initialize Firebase Admin SDK only if credentials are configured
let firebaseApp = null;
let admin = null;

function getServiceAccountCredentials() {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!rawServiceAccount) {
    return null;
  }

  try {
    return JSON.parse(rawServiceAccount);
  } catch (error) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
}

function getFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    if (!admin) {
      admin = require('firebase-admin');
    }

    const serviceAccount = getServiceAccountCredentials();

    if (!admin.apps.length) {
      firebaseApp = serviceAccount
        ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
        : admin.initializeApp();
    } else {
      firebaseApp = admin.app();
    }
    return firebaseApp;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes("firebase-admin")) {
      console.warn('⚠️ Firebase Admin SDK is not installed - skipping token verification setup');
      return null;
    }

    console.error('❌ Firebase Admin SDK initialization error:', error.message);
    return null;
  }
}

/**
 * Verifies a Firebase ID token
 * 
 * @param {string} token - Firebase ID token from client
 * @returns {Promise<{verified: true, claims: object} | {verified: false, error: string}>}
 */
async function verifyFirebaseToken(token) {
  try {
    if (!token) {
      return {
        verified: false,
        error: 'No token provided'
      };
    }

    const firebaseAdmin = getFirebaseAdmin();
    
    if (!firebaseAdmin) {
      console.warn('⚠️ Firebase Admin SDK not available - skipping token verification');
      // In development without Firebase configured, we can proceed with caution
      if (process.env.NODE_ENV === 'development') {
        return {
          verified: true, // Soft fail in development
          claims: { fallback: true }
        };
      }
      return {
        verified: false,
        error: 'Firebase service not configured'
      };
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    console.log('✅ Firebase token verified for user:', decodedToken.email);
    
    return {
      verified: true,
      claims: decodedToken
    };

  } catch (error) {
    console.error('❌ Firebase token verification error:', error.message);
    
    let errorMessage = 'Token verification failed';
    
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Token has expired';
    } else if (error.code === 'auth/id-token-revoked') {
      errorMessage = 'Token has been revoked';
    } else if (error.code === 'auth/invalid-id-token') {
      errorMessage = 'Invalid token format';
    }
    
    return {
      verified: false,
      error: errorMessage
    };
  }
}

/**
 * Extracts user info from Firebase token claims
 * 
 * @param {object} claims - Firebase token claims
 * @returns {object} Extracted user data
 */
function extractUserFromClaims(claims) {
  return {
    email: claims.email || '',
    firstName: claims.given_name || claims.name?.split(' ')[0] || '',
    lastName: claims.family_name || claims.name?.split(' ').slice(1).join(' ') || '',
    googleUID: claims.uid || '',
    profilePicture: claims.picture || '',
    provider: 'google',
    verifiedAt: new Date()
  };
}

module.exports = {
  verifyFirebaseToken,
  extractUserFromClaims,
  getFirebaseAdmin
};

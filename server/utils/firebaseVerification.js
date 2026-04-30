/**
 * Firebase Token Verification Utility (Enhanced)
 * Verifies Firebase ID tokens on the server side with comprehensive logging
 * 
 * SECURITY: Never trust the token from the frontend alone!
 * This validates the token signature and authenticity.
 * 
 * DEBUGGING: Extensive logging to diagnose Firebase issues
 */

// Initialize Firebase Admin SDK only if credentials are configured
let firebaseApp = null;
let admin = null;
let firebaseInitialized = false;
let firebaseInitError = null;

function loadServiceAccountBlockFromEnvFile() {
  try {
    const fs = require('fs');
    const path = require('path');
    const envFilePath = path.resolve(__dirname, '../../.env');

    if (!fs.existsSync(envFilePath)) {
      return null;
    }

    const envFileContent = fs.readFileSync(envFilePath, 'utf8');
    const startMarker = 'FIREBASE_SERVICE_ACCOUNT_JSON=';
    const startIndex = envFileContent.indexOf(startMarker);

    if (startIndex === -1) {
      return null;
    }

    const afterMarker = envFileContent.slice(startIndex + startMarker.length);
    const nextKeyMatch = afterMarker.match(/\n[A-Z0-9_]+=/);
    const rawBlock = nextKeyMatch ? afterMarker.slice(0, nextKeyMatch.index) : afterMarker;

    return rawBlock.trim();
  } catch (error) {
    console.warn('⚠️ Could not read service account block from .env:', error.message);
    return null;
  }
}

function normalizeServiceAccountInput(rawValue) {
  if (!rawValue) {
    return null;
  }

  if (typeof rawValue === 'object') {
    return rawValue;
  }

  const trimmed = String(rawValue).trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed
    .replace(/^['\"]/, '')
    .replace(/['\"]$/, '');

  const parseAttempts = [normalized];

  if (normalized.includes('\\n')) {
    parseAttempts.push(normalized.replace(/\\n/g, '\n'));
  }

  for (const candidate of parseAttempts) {
    try {
      const parsed = JSON.parse(candidate);
      return parsed;
    } catch (error) {
      // Keep trying fallbacks below.
    }
  }

  return null;
}

function getServiceAccountCredentials() {
  const rawServiceAccountCandidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    loadServiceAccountBlockFromEnvFile()
  ].filter(Boolean);

  console.log('🔍 Checking FIREBASE_SERVICE_ACCOUNT_JSON environment variable...');

  if (rawServiceAccountCandidates.length === 0) {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_JSON not set in environment');
    return null;
  }

  try {
    console.log('📝 Attempting to parse service account JSON...');

    let parsed = null;
    let lastError = null;

    for (const rawServiceAccount of rawServiceAccountCandidates) {
      if (!rawServiceAccount || String(rawServiceAccount).trim().length < 2) {
        continue;
      }

      parsed = normalizeServiceAccountInput(rawServiceAccount);
      if (parsed) {
        break;
      }

      lastError = new Error('Unable to parse service account JSON');
    }

    if (!parsed) {
      throw lastError || new Error('Unable to parse service account JSON');
    }
    
    // Validate required fields
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !parsed[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Service account missing required fields:', missingFields);
      return null;
    }
    
    console.log('✅ Service account credentials parsed successfully');
    console.log('   Project ID:', parsed.project_id);
    console.log('   Client Email:', parsed.client_email);
    console.log('   Auth Provider:', parsed.auth_provider_x509_cert_url ? 'Configured' : 'Missing');
    
    return parsed;
  } catch (error) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error.message);
    console.error('   Error type:', error.name);
    if (error.message.includes('Unexpected token')) {
      console.error('   Hint: JSON is malformed - check for escaped newlines or quotes');
    }
    return null;
  }
}

function initializeFirebaseAdmin() {
  if (firebaseInitialized) {
    console.log('ℹ️ Firebase already initialized');
    return firebaseApp;
  }

  try {
    console.log('🔥 Initializing Firebase Admin SDK...');
    
    if (!admin) {
      admin = require('firebase-admin');
      console.log('✅ Firebase Admin module loaded');
    }

    const serviceAccount = getServiceAccountCredentials();

    if (!serviceAccount) {
      console.warn('⚠️ No service account credentials - Firebase will not verify tokens');
      firebaseInitialized = true; // Mark as attempted
      return null;
    }

    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase app already initialized');
      firebaseApp = admin.app();
      firebaseInitialized = true;
      return firebaseApp;
    }

    // Initialize with credentials
    console.log('🚀 Initializing Firebase with service account...');
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
    
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization error:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    
    firebaseInitError = error;
    firebaseInitialized = true; // Mark as attempted even if failed
    
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('firebase-admin')) {
      console.warn('⚠️ Firebase Admin SDK is not installed');
    }
    
    return null;
  }
}

function getFirebaseAdmin() {
  return initializeFirebaseAdmin();
}

/**
 * Verifies a Firebase ID token with comprehensive error handling
 * 
 * @param {string} token - Firebase ID token from client
 * @returns {Promise<{verified: true, claims: object} | {verified: false, error: string, debug?: string}>}
 */
async function verifyFirebaseToken(token) {
  try {
    if (!token) {
      console.error('❌ Firebase token verification failed: No token provided');
      return {
        verified: false,
        error: 'No token provided',
        debug: 'Token is empty or undefined'
      };
    }

    console.log('🔐 Verifying Firebase token...');
    console.log('   Token length:', token.length);
    console.log('   Token type:', typeof token);
    console.log('   First 50 chars:', token.substring(0, 50) + '...');

    const firebaseAdmin = getFirebaseAdmin();
    
    if (!firebaseAdmin) {
      console.warn('⚠️ Firebase Admin SDK not available');
      
      // In development without Firebase configured, we can proceed with caution
      if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_UNVERIFIED_LOGIN === 'true') {
        console.warn('⚠️ DEVELOPMENT MODE: Allowing unverified token (check ALLOW_UNVERIFIED_LOGIN)');
        return {
          verified: true,
          claims: { 
            fallback: true,
            email: 'development@example.com',
            uid: 'dev-uid-123'
          },
          debug: 'Development mode - token not verified'
        };
      }
      
      console.error('❌ Firebase service not configured and not in development mode');
      console.error('   NODE_ENV:', process.env.NODE_ENV);
      console.error('   ALLOW_UNVERIFIED_LOGIN:', process.env.ALLOW_UNVERIFIED_LOGIN);
      
      return {
        verified: false,
        error: 'Firebase service not configured',
        debug: 'Firebase Admin SDK could not be initialized. Check FIREBASE_SERVICE_ACCOUNT_JSON environment variable.'
      };
    }

    // Verify the ID token
    console.log('🔄 Calling admin.auth().verifyIdToken()...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    console.log('✅ Firebase token verified successfully:', {
      email: decodedToken.email,
      uid: decodedToken.uid,
      issuedAt: new Date(decodedToken.iat * 1000).toISOString(),
      expiresAt: new Date(decodedToken.exp * 1000).toISOString()
    });
    
    return {
      verified: true,
      claims: decodedToken
    };

  } catch (error) {
    console.error('❌ Firebase token verification error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    
    let errorMessage = 'Token verification failed';
    let debugInfo = error.message;
    
    // Specific error code handling
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Token has expired';
      debugInfo = 'The Firebase token has expired. User should re-authenticate.';
    } else if (error.code === 'auth/id-token-revoked') {
      errorMessage = 'Token has been revoked';
      debugInfo = 'The Firebase token has been revoked by the user.';
    } else if (error.code === 'auth/invalid-id-token') {
      errorMessage = 'Invalid token format';
      debugInfo = 'The token format is invalid or corrupted.';
    } else if (error.code === 'auth/argument-error') {
      errorMessage = 'Invalid token argument';
      debugInfo = 'The token argument is invalid. This may indicate a malformed token.';
    } else if (error.message.includes('Malformed') || error.message.includes('malformed')) {
      errorMessage = 'Malformed token';
      debugInfo = 'The token appears to be malformed. Check the token generation on the client.';
    } else if (error.message.includes('decode') || error.message.includes('parsing')) {
      errorMessage = 'Token decode error';
      debugInfo = 'Error decoding the token. Verify the token is a valid JWT.';
    }
    
    return {
      verified: false,
      error: errorMessage,
      debug: debugInfo
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
  // Handle fallback development token
  if (claims.fallback) {
    return {
      email: 'dev@example.com',
      firstName: 'Dev',
      lastName: 'User',
      googleUID: 'dev-uid-123',
      profilePicture: '',
      provider: 'google',
      verifiedAt: new Date()
    };
  }

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

/**
 * Get Firebase initialization status for debugging
 */
function getFirebaseStatus() {
  return {
    initialized: firebaseInitialized,
    firebaseApp: !!firebaseApp,
    hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    environment: process.env.NODE_ENV,
    allowUnverified: process.env.ALLOW_UNVERIFIED_LOGIN === 'true',
    error: firebaseInitError?.message || null
  };
}

// Initialize Firebase on module load
console.log('🔧 Firebase Verification module loaded');
initializeFirebaseAdmin();

module.exports = {
  verifyFirebaseToken,
  extractUserFromClaims,
  getFirebaseAdmin,
  getFirebaseStatus,
  initializeFirebaseAdmin
};

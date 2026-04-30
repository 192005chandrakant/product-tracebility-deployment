#!/usr/bin/env node

/**
 * Google Login Configuration Verification Script
 * 
 * This script helps diagnose Firebase and Google Login configuration issues.
 * Run this before attempting Google login to catch configuration problems early.
 * 
 * Usage:
 *   node scripts/verify-google-login.js
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function loadServiceAccountBlockFromEnvFile() {
  const envFile = path.resolve(__dirname, '../.env');

  if (!fs.existsSync(envFile)) {
    return null;
  }

  const envContent = fs.readFileSync(envFile, 'utf8');
  const startMarker = 'FIREBASE_SERVICE_ACCOUNT_JSON=';
  const startIndex = envContent.indexOf(startMarker);

  if (startIndex === -1) {
    return null;
  }

  const afterMarker = envContent.slice(startIndex + startMarker.length);
  const nextKeyMatch = afterMarker.match(/\n[A-Z0-9_]+=/);
  const rawBlock = nextKeyMatch ? afterMarker.slice(0, nextKeyMatch.index) : afterMarker;

  return rawBlock.trim();
}

function parseServiceAccountValue(rawValue) {
  if (!rawValue) {
    return null;
  }

  if (typeof rawValue === 'object') {
    return rawValue;
  }

  const trimmed = String(rawValue).trim();
  const normalized = trimmed
    .replace(/^['\"]/, '')
    .replace(/['\"]$/, '');

  const parseAttempts = [normalized];

  if (normalized.includes('\\n')) {
    parseAttempts.push(normalized.replace(/\\n/g, '\n'));
  }

  for (const candidate of parseAttempts) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      // Try the next representation.
    }
  }

  return null;
}

console.log('\n' + '='.repeat(80));
console.log('🔍 GOOGLE LOGIN CONFIGURATION VERIFICATION');
console.log('='.repeat(80) + '\n');

// ========== CHECKS ==========

let hasErrors = false;

// 1. Check Node Environment
console.log('1️⃣  NODE ENVIRONMENT');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set (defaults to development)');
console.log('   NODE_VERSION:', process.version);

// 2. Check MongoDB Connection
console.log('\n2️⃣  MONGODB CONFIGURATION');
if (!process.env.MONGODB_URI) {
  console.error('   ❌ MONGODB_URI not set');
  hasErrors = true;
} else {
  console.log('   ✅ MONGODB_URI is set');
  console.log('   📍 Database:', process.env.MONGODB_URI.includes('@')
    ? 'MongoDB Atlas (Cloud)'
    : 'Local MongoDB');
}

// 3. Check JWT Secret
console.log('\n3️⃣  JWT CONFIGURATION');
if (!process.env.JWT_SECRET) {
  console.error('   ❌ JWT_SECRET not set');
  hasErrors = true;
} else {
  const secret = process.env.JWT_SECRET;
  console.log(`   ✅ JWT_SECRET is set (${secret.length} characters)`);
  if (secret.length < 32) {
    console.warn('   ⚠️  WARNING: JWT_SECRET is very short (< 32 chars). Consider using a longer secret.');
  }
}

// 4. Check Firebase Admin SDK
console.log('\n4️⃣  FIREBASE ADMIN SDK');
try {
  require.resolve('firebase-admin', {
    paths: [path.resolve(__dirname, '../server')]
  });
  console.log('   ✅ firebase-admin is installed');
} catch (e) {
  console.error('   ❌ firebase-admin is NOT installed');
  console.error('      Run: npm install firebase-admin');
  hasErrors = true;
}

// 5. Check Service Account JSON
console.log('\n5️⃣  FIREBASE SERVICE ACCOUNT');
const serviceAccountCandidates = [
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  loadServiceAccountBlockFromEnvFile()
].filter(Boolean);

if (serviceAccountCandidates.length === 0) {
  console.error('   ❌ FIREBASE_SERVICE_ACCOUNT_JSON is not set');
  console.error('      This is REQUIRED for Google login to work');
  hasErrors = true;
} else {
  console.log('   📝 FIREBASE_SERVICE_ACCOUNT_JSON is set');
  
  // Try to parse it
  try {
    let serviceAccount = null;

    for (const serviceAccountJson of serviceAccountCandidates) {
      serviceAccount = parseServiceAccountValue(serviceAccountJson);
      if (serviceAccount) {
        break;
      }
    }

    if (!serviceAccount) {
      throw new Error('Unable to parse service account JSON');
    }
    
    // Check required fields
    const required = ['type', 'project_id', 'private_key', 'client_email'];
    const missing = required.filter(f => !serviceAccount[f]);
    
    if (missing.length > 0) {
      console.error(`   ❌ Missing required fields: ${missing.join(', ')}`);
      hasErrors = true;
    } else {
      console.log('   ✅ All required fields present');
      console.log('      Project ID:', serviceAccount.project_id);
      console.log('      Client Email:', serviceAccount.client_email);
      console.log('      Type:', serviceAccount.type);
    }
  } catch (error) {
    console.error('   ❌ FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
    console.error('      Error:', error.message);
    console.error('      Make sure the JSON is valid, and if multiline ensure it is quoted or escaped properly');
    hasErrors = true;
  }
}

// 6. Check Frontend Firebase Config
console.log('\n6️⃣  FRONTEND FIREBASE CONFIGURATION');
const envFile = path.resolve(__dirname, '../client/.env');
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf8');
  const hasApiKey = content.includes('REACT_APP_FIREBASE_API_KEY=');
  const hasProjectId = content.includes('REACT_APP_FIREBASE_PROJECT_ID=');
  
  console.log('   ✅ client/.env file exists');
  console.log('   REACT_APP_FIREBASE_API_KEY:', hasApiKey ? '✅ set' : '❌ missing');
  console.log('   REACT_APP_FIREBASE_PROJECT_ID:', hasProjectId ? '✅ set' : '❌ missing');
  
  if (!hasApiKey || !hasProjectId) {
    hasErrors = true;
  }
} else {
  console.error('   ❌ client/.env file not found');
  hasErrors = true;
}

// 7. Check Port Availability
console.log('\n7️⃣  PORT CONFIGURATION');
const port = process.env.PORT || 8080;
console.log('   Server Port:', port);
console.log('   CLIENT_APP_URL:', process.env.CLIENT_APP_URL || 'not set (defaults to http://localhost:3000)');

// 8. Check CORS Configuration
console.log('\n8️⃣  CORS CONFIGURATION');
console.log('   CORS_ALLOW_ALL:', process.env.CORS_ALLOW_ALL === 'true' ? 'true (PERMISSIVE)' : 'false (RESTRICTED)');
console.log('   CORS_ALLOWED_ORIGINS:', process.env.CORS_ALLOWED_ORIGINS ? 'set' : 'not set (uses defaults)');

// ========== RECOMMENDATIONS ==========

console.log('\n' + '='.repeat(80));
if (hasErrors) {
  console.error('❌ CONFIGURATION ISSUES FOUND');
  console.error('\nYou need to fix the issues above before Google login will work.');
  console.log('\n📚 See GOOGLE_LOGIN_DEBUG_GUIDE.md for detailed troubleshooting steps.');
  process.exit(1);
} else {
  console.log('✅ CONFIGURATION LOOKS GOOD');
  console.log('\n✅ Google Login should be ready to test!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Start the server: npm start');
  console.log('   2. Start the client: cd client && npm start');
  console.log('   3. Test Google login at http://localhost:3000');
  console.log('   4. Check browser console and server logs for any issues');
  console.log('\n💡 If you still have issues, check:');
  console.log('   GET http://localhost:5000/api/auth/debug/firebase-status');
}

console.log('='.repeat(80) + '\n');

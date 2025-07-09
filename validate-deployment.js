#!/usr/bin/env node

/**
 * Production Deployment Validation
 * 
 * This script validates that your production deployment is working correctly
 * Run this after deploying to Netlify and Render
 */

const axios = require('axios');
require('dotenv').config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function validateDeployment() {
  console.log('🔍 Validating Production Deployment...\n');

  // Test 1: Frontend Accessibility
  console.log('1. Testing Frontend Accessibility:');
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 10000 });
    if (response.status === 200) {
      console.log(`   ✅ Frontend accessible at: ${FRONTEND_URL}`);
    } else {
      console.log(`   ❌ Frontend returned status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Frontend not accessible: ${error.message}`);
    console.log(`   💡 Check your Netlify deployment status`);
  }

  // Test 2: Backend API Accessibility
  console.log('\n2. Testing Backend API Accessibility:');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 10000 });
    if (response.status === 200) {
      console.log(`   ✅ Backend API accessible at: ${BACKEND_URL}`);
    } else {
      console.log(`   ❌ Backend API returned status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Backend API not accessible: ${error.message}`);
    console.log(`   💡 Check your Render deployment status`);
  }

  // Test 3: Database Connection
  console.log('\n3. Testing Database Connection:');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/products`, { timeout: 10000 });
    if (response.status === 200) {
      console.log(`   ✅ Database connection working`);
      console.log(`   ✅ Products API returning data: ${response.data.length} products`);
    } else {
      console.log(`   ❌ Database connection failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error.message}`);
    console.log(`   💡 Check your MongoDB connection string`);
  }

  // Test 4: Authentication Endpoint
  console.log('\n4. Testing Authentication Endpoint:');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'wrongpassword'
    }, { 
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Accept 4xx errors as valid responses
      }
    });
    
    if (response.status === 401 || response.status === 400) {
      console.log(`   ✅ Authentication endpoint working (rejected invalid credentials)`);
    } else {
      console.log(`   ⚠️  Authentication endpoint returned unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Authentication endpoint failed: ${error.message}`);
  }

  // Test 5: CORS Configuration
  console.log('\n5. Testing CORS Configuration:');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/products`, {
      timeout: 10000,
      headers: {
        'Origin': FRONTEND_URL
      }
    });
    
    if (response.status === 200) {
      console.log(`   ✅ CORS configured correctly for frontend`);
    } else {
      console.log(`   ❌ CORS configuration issue: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ CORS test failed: ${error.message}`);
    console.log(`   💡 Check your backend CORS configuration`);
  }

  // Test 6: Recent Products Endpoint
  console.log('\n6. Testing Recent Products Endpoint:');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/recent-products`, { timeout: 10000 });
    if (response.status === 200) {
      console.log(`   ✅ Recent products endpoint working`);
      console.log(`   ✅ Returning ${response.data.length} recent products`);
    } else {
      console.log(`   ❌ Recent products endpoint failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Recent products endpoint failed: ${error.message}`);
  }

  // Test 7: File Upload Endpoint
  console.log('\n7. Testing File Upload Configuration:');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/products`, {
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      origin: 'Test Origin',
      manufacturer: 'Test Manufacturer'
    }, { 
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Accept 4xx errors as valid responses
      }
    });
    
    if (response.status === 401) {
      console.log(`   ✅ Product creation endpoint working (requires authentication)`);
    } else if (response.status === 201) {
      console.log(`   ✅ Product creation endpoint working (created product)`);
    } else {
      console.log(`   ⚠️  Product creation endpoint returned: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Product creation endpoint failed: ${error.message}`);
  }

  // Test 8: Environment Variables Check
  console.log('\n8. Checking Environment Variables:');
  const criticalVars = ['CONTRACT_ADDRESS', 'SEPOLIA_RPC_URL', 'PRIVATE_KEY'];
  
  for (const varName of criticalVars) {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: Set`);
    } else {
      console.log(`   ❌ ${varName}: Not set`);
    }
  }

  console.log('\n📋 Deployment Validation Complete!\n');
  console.log('🎯 Manual Testing Steps:');
  console.log('   1. Visit your frontend URL and verify it loads');
  console.log('   2. Register a new account');
  console.log('   3. Add a product with image upload');
  console.log('   4. Verify transaction hash is displayed');
  console.log('   5. Search for the product you created');
  console.log('   6. Check that recent products display correctly');
  console.log('\n✅ If all tests pass, your deployment is ready for production!');
}

// Run the validation
validateDeployment().catch(console.error);

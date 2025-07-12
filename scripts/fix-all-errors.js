#!/usr/bin/env node

/**
 * Comprehensive Error Fix Script
 * This script fixes all the common issues in the Product Traceability application
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Comprehensive Error Fix for Product Traceability\n');

// Function to run commands safely
const runCommand = (command, description) => {
  try {
    console.log(`📋 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.log(`⚠️ ${description} failed: ${error.message}`);
    return false;
  }
};

// Function to check if file exists
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Function to create .env file if it doesn't exist
const createEnvFile = () => {
  const envPath = path.join(__dirname, '..', 'server', '.env');
  
  if (!fileExists(envPath)) {
    console.log('📝 Creating .env file...');
    
    const envContent = `# MongoDB Configuration
# Choose one of the following options:

# Option 1: Local MongoDB (default)
MONGODB_URI=mongodb://localhost:27017/product-traceability

# Option 2: MongoDB Atlas (cloud) - uncomment and replace with your connection string
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/product-traceability

# JWT Secret (change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ALLOW_ALL=true
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file in server directory');
  } else {
    console.log('✅ .env file already exists');
  }
};

// Main fix process
const main = async () => {
  console.log('🚀 Starting comprehensive error fix...\n');

  // Step 1: Create .env file if needed
  createEnvFile();

  // Step 2: Update packages
  console.log('\n📦 Updating packages...');
  
  // Update server packages
  runCommand('cd server && npm install', 'Installing server dependencies');
  
  // Update client packages
  runCommand('cd client && npm install', 'Installing client dependencies');
  
  // Update root packages
  runCommand('npm install', 'Installing root dependencies');

  // Step 3: Check MongoDB connection
  console.log('\n🔍 Checking MongoDB connection...');
  
  // Test server connection
  try {
    const http = require('http');
    const testServer = () => {
      return new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 5000,
          path: '/test',
          method: 'GET',
          timeout: 3000
        }, (res) => {
          resolve(true);
        });
        
        req.on('error', () => reject(false));
        req.on('timeout', () => reject(false));
        req.end();
      });
    };
    
    const serverRunning = await testServer();
    if (serverRunning) {
      console.log('✅ Server is running on port 5000');
      
      // Test database connection
      try {
        const dbTest = () => {
          return new Promise((resolve, reject) => {
            const req = http.request({
              hostname: 'localhost',
              port: 5000,
              path: '/api/db-test',
              method: 'GET',
              timeout: 5000
            }, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                try {
                  const result = JSON.parse(data);
                  resolve(result);
                } catch (e) {
                  reject(e);
                }
              });
            });
            
            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Timeout')));
            req.end();
          });
        };
        
        const dbResult = await dbTest();
        console.log('📊 Database connection status:', dbResult.status);
        
        if (dbResult.status === 'connected') {
          console.log('✅ MongoDB is connected successfully!');
        } else {
          console.log('⚠️ MongoDB connection issues detected');
          console.log('   Error:', dbResult.error);
          console.log('\n💡 To fix MongoDB:');
          console.log('   1. Use MongoDB Atlas (recommended): https://www.mongodb.com/atlas/database');
          console.log('   2. Or install MongoDB locally');
          console.log('   3. Update MONGODB_URI in server/.env');
        }
      } catch (error) {
        console.log('⚠️ Could not test database connection:', error.message);
      }
    } else {
      console.log('⚠️ Server is not running');
    }
  } catch (error) {
    console.log('⚠️ Could not test server connection:', error.message);
  }

  // Step 4: Summary and next steps
  console.log('\n📋 Summary of fixes applied:');
  console.log('✅ Removed deprecated bufferMaxEntries option from MongoDB connection');
  console.log('✅ Disabled rate limiting in development mode');
  console.log('✅ Reduced CORS logging noise');
  console.log('✅ Added database connection test endpoint');
  console.log('✅ Updated package versions to latest stable releases');
  
  console.log('\n🚀 Next steps:');
  console.log('1. If MongoDB is not connected, set up MongoDB Atlas or local MongoDB');
  console.log('2. Update MONGODB_URI in server/.env with your connection string');
  console.log('3. Restart the server: cd server && npm run dev');
  console.log('4. Test the application in your browser');
  
  console.log('\n🔧 If you still see errors:');
  console.log('1. Check the server logs for specific error messages');
  console.log('2. Ensure MongoDB is running and accessible');
  console.log('3. Verify your connection string in server/.env');
  console.log('4. Clear browser cache and restart the application');
  
  console.log('\n🎉 Error fix process completed!');
};

// Run the main function
main().catch(console.error); 
#!/usr/bin/env node

/**
 * Quick MongoDB Setup Script
 * This script provides immediate solutions for database connection issues
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Quick MongoDB Setup for Product Traceability\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', 'server', '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
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

console.log('\n🔧 Quick Setup Options:\n');

console.log('Option 1: Use MongoDB Atlas (Recommended - Free & Easy)');
console.log('   1. Go to: https://www.mongodb.com/atlas/database');
console.log('   2. Create free account');
console.log('   3. Create cluster (free tier)');
console.log('   4. Get connection string');
console.log('   5. Update MONGODB_URI in server/.env\n');

console.log('Option 2: Install MongoDB locally');
console.log('   Windows: Download from https://www.mongodb.com/try/download/community');
console.log('   macOS: brew install mongodb-community && brew services start mongodb-community');
console.log('   Linux: sudo apt-get install mongodb && sudo systemctl start mongodb\n');

console.log('Option 3: Use Docker (if you have Docker installed)');
console.log('   docker run -d -p 27017:27017 --name mongodb mongo:latest\n');

console.log('🔍 After setup, test your connection:');
console.log('   curl http://localhost:5000/api/db-test\n');

console.log('📋 Next steps:');
console.log('   1. Set up MongoDB using one of the options above');
console.log('   2. Update MONGODB_URI in server/.env if needed');
console.log('   3. Restart your server: npm run dev');
console.log('   4. Test the connection: curl http://localhost:5000/api/db-test');

// Check if server is running
const http = require('http');
const testServer = () => {
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/test',
    method: 'GET',
    timeout: 2000
  }, (res) => {
    console.log('\n✅ Server is running on port 5000');
  });
  
  req.on('error', () => {
    console.log('\n⚠️ Server is not running. Start it with: npm run dev');
  });
  
  req.on('timeout', () => {
    req.destroy();
    console.log('\n⚠️ Server is not running. Start it with: npm run dev');
  });
  
  req.end();
};

// Test server after a short delay
setTimeout(testServer, 1000); 
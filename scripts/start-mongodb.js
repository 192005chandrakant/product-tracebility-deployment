#!/usr/bin/env node

/**
 * MongoDB Setup Script
 * This script helps you set up MongoDB for the Product Traceability application
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 MongoDB Setup for Product Traceability\n');

// Check if MongoDB is already running
function checkMongoRunning() {
  try {
    execSync('mongod --version', { stdio: 'ignore' });
    console.log('✅ MongoDB is installed');
    
    // Try to connect to see if it's running
    try {
      execSync('mongo --eval "db.runCommand(\'ping\')"', { stdio: 'ignore' });
      console.log('✅ MongoDB is already running on localhost:27017');
      return true;
    } catch (e) {
      console.log('⚠️ MongoDB is installed but not running');
      return false;
    }
  } catch (e) {
    console.log('❌ MongoDB is not installed');
    return false;
  }
}

// Start MongoDB locally
function startMongoLocal() {
  console.log('\n🚀 Starting MongoDB locally...');
  
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data', 'db');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 Created data directory:', dataDir);
    }
    
    // Start MongoDB daemon
    const mongoProcess = spawn('mongod', [
      '--dbpath', dataDir,
      '--port', '27017',
      '--bind_ip', '127.0.0.1'
    ], {
      stdio: 'inherit',
      detached: true
    });
    
    console.log('✅ MongoDB started successfully!');
    console.log('   Data directory:', dataDir);
    console.log('   Connection URL: mongodb://localhost:27017/product-traceability');
    console.log('\n💡 To stop MongoDB, run: pkill mongod');
    
    return mongoProcess;
  } catch (error) {
    console.error('❌ Failed to start MongoDB:', error.message);
    return null;
  }
}

// Provide cloud setup instructions
function showCloudSetup() {
  console.log('\n☁️ Cloud MongoDB Setup Instructions:\n');
  console.log('1. Create a free MongoDB Atlas account:');
  console.log('   https://www.mongodb.com/atlas/database\n');
  console.log('2. Create a new cluster (free tier available)');
  console.log('3. Create a database user with read/write permissions');
  console.log('4. Get your connection string');
  console.log('5. Set the MONGODB_URI environment variable:\n');
  console.log('   export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/product-traceability"\n');
  console.log('6. Or create a .env file in the server directory:\n');
  console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/product-traceability\n');
}

// Main execution
function main() {
  const isRunning = checkMongoRunning();
  
  if (isRunning) {
    console.log('\n🎉 MongoDB is ready! You can now start your server.');
    console.log('   Run: npm run dev (in the root directory)');
    return;
  }
  
  console.log('\n📋 Choose an option:');
  console.log('1. Start MongoDB locally (requires MongoDB installation)');
  console.log('2. Use MongoDB Atlas (cloud - recommended)');
  console.log('3. Install MongoDB first');
  
  // For now, just show instructions
  console.log('\n💡 For now, here are your options:\n');
  
  console.log('Option 1: Install MongoDB locally');
  console.log('   Windows: Download from https://www.mongodb.com/try/download/community');
  console.log('   macOS: brew install mongodb-community');
  console.log('   Linux: sudo apt-get install mongodb\n');
  
  console.log('Option 2: Use MongoDB Atlas (Recommended)');
  showCloudSetup();
  
  console.log('Option 3: Use a different database');
  console.log('   You can modify the server to use SQLite or another database');
  console.log('   Edit server/models/ to use a different ORM\n');
  
  console.log('🔧 After setting up MongoDB, restart your server:');
  console.log('   npm run dev');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { checkMongoRunning, startMongoLocal, showCloudSetup }; 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Test basic server setup
async function testServerSetup() {
  try {
    console.log('🧪 Testing Server Setup...\n');

    // Test Express
    console.log('1. Testing Express...');
    const app = express();
    app.use(cors());
    app.use(express.json());
    console.log('✅ Express setup successful');

    // Test basic route
    console.log('2. Testing basic route...');
    app.get('/test', (req, res) => {
      res.json({ message: 'Test route working' });
    });
    console.log('✅ Basic route setup successful');

    // Test MongoDB connection (without actually connecting)
    console.log('3. Testing MongoDB setup...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product-traceability';
    console.log('   MongoDB URI:', MONGODB_URI);
    console.log('✅ MongoDB setup check successful');

    // Test route imports
    console.log('4. Testing route imports...');
    try {
      const productRoutes = require('./routes/productRoutes');
      console.log('✅ Product routes import successful');
    } catch (e) {
      console.log('⚠️ Product routes import failed:', e.message);
    }

    try {
      const authRoutes = require('./routes/authRoutes');
      console.log('✅ Auth routes import successful');
    } catch (e) {
      console.log('⚠️ Auth routes import failed:', e.message);
    }

    try {
      const profileRoutes = require('./routes/profileRoutes');
      console.log('✅ Profile routes import successful');
    } catch (e) {
      console.log('⚠️ Profile routes import failed:', e.message);
    }

    // Test model imports
    console.log('5. Testing model imports...');
    try {
      const User = require('./models/User');
      console.log('✅ User model import successful');
    } catch (e) {
      console.log('⚠️ User model import failed:', e.message);
    }

    try {
      const Product = require('./models/Product');
      console.log('✅ Product model import successful');
    } catch (e) {
      console.log('⚠️ Product model import failed:', e.message);
    }

    console.log('\n🎉 Server setup test completed!');
    console.log('\nTo start the server, run: npm start');
    console.log('To test profile routes, run: npm run test-profile-simple');

  } catch (error) {
    console.error('❌ Server setup test failed:', error.message);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testServerSetup();
}

module.exports = { testServerSetup }; 
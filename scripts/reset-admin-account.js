/**
 * Reset Admin Account Script
 * Creates or updates admin account in database directly
 */

const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

// Import models
const User = require('../server/models/User');
const mongoose = User.db;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product-traceability';
const ADMIN_EMAIL = String(process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@producttraceability.local').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'bBToQ6h80HKyVwG710h4s0xx';

async function resetAdminAccount() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log(`📍 URI: ${MONGODB_URI.substring(0, 50)}...`);

    await mongoose.openUri(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected');

    // Check for existing admin
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log(`\n🔄 Existing admin found: ${ADMIN_EMAIL}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Created: ${existingAdmin.createdAt}`);
      console.log(`   Last Login: ${existingAdmin.lastLogin || 'Never'}`);

      // Update password
      console.log('\n🔐 Updating admin password...');
      existingAdmin.password = await bcrypt.hash(ADMIN_PASSWORD, 12);
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      await existingAdmin.save();

      console.log('✅ Admin password updated successfully');
    } else {
      console.log(`\n✨ Creating new admin account: ${ADMIN_EMAIL}`);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

      const adminUser = new User({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        firstName: 'System',
        lastName: 'Administrator'
      });

      await adminUser.save();
      console.log('✅ Admin account created successfully');
    }

    console.log('\n📋 Admin Account Details:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role: admin`);
    console.log(`   Status: Active`);

    console.log('\n🔑 Login Instructions:');
    console.log(`   1. Visit http://localhost:3000/auth/login`);
    console.log(`   2. Enter email: ${ADMIN_EMAIL}`);
    console.log(`   3. Enter password: ${ADMIN_PASSWORD}`);
    console.log(`   4. Click "Sign In"`);

    await mongoose.close();
    console.log('\n✅ Done! Admin account is ready to use.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminAccount();

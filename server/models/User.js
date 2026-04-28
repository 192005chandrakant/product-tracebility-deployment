const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Optional for OAuth users
  role: { type: String, enum: ['admin', 'producer', 'consumer'], default: 'consumer' },
  
  // Profile fields
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  company: { type: String, trim: true },
  phone: { type: String, trim: true },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true }
  },
  
  // OAuth fields (for Google and other providers)
  oauth: {
    provider: { type: String, enum: ['google', 'email'], default: 'email' }, // Auth provider
    uid: { type: String, sparse: true }, // Provider-specific user ID
    profilePicture: { type: String }, // Avatar/profile picture URL
    verifiedAt: { type: Date }, // When email was verified by provider
  },
  
  // Additional fields
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Query performance indexes for auth and admin-facing lookups.
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ lastLogin: -1 });
UserSchema.index({ 'oauth.uid': 1, 'oauth.provider': 1 }); // For OAuth lookups

module.exports = mongoose.model('User', UserSchema); 
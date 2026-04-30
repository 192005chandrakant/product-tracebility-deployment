const User = require('../User'); // ✅ Fixed path
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { verifyFirebaseToken, extractUserFromClaims } = require('../../utils/firebaseVerification');

// Helper function to check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

exports.register = async (req, res) => {
  try {
    const normalizedEmail = String(req.body && req.body.email ? req.body.email : '').trim().toLowerCase();
    console.log('📝 Registration attempt:', { email: normalizedEmail, role: req.body.role });
    
    // Check MongoDB connection
    if (!isMongoConnected()) {
      console.error('❌ MongoDB not connected for registration');
      return res.status(503).json({ 
        error: 'Database service unavailable. Please try again later.',
        details: 'MongoDB connection is not established'
      });
    }
    
    const { password, role } = req.body;
    const requestedRole = String(role || 'producer').toLowerCase();
    const allowAdminRegistration = String(process.env.ALLOW_ADMIN_REGISTRATION || '').toLowerCase() === 'true';

    if (requestedRole === 'admin' && !allowAdminRegistration) {
      return res.status(403).json({
        error: 'Admin registration is restricted',
        message: 'Admin accounts must be provisioned by bootstrap or an existing administrator.'
      });
    }

    if (!['producer', 'consumer', 'admin'].includes(requestedRole)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be producer, consumer, or admin.'
      });
    }
    
    // Validate input
    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email: normalizedEmail, password: hashed, role: requestedRole || 'producer' });
    await user.save();
    
    console.log('✅ User registered successfully:', normalizedEmail);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    
    // Handle specific MongoDB errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      return res.status(503).json({ 
        error: 'Database service unavailable. Please try again later.',
        details: err.message
      });
    }
    
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const normalizedEmail = String(req.body && req.body.email ? req.body.email : '').trim().toLowerCase();
    console.log('🔐 Login attempt:', { email: normalizedEmail });
    
    // Check MongoDB connection
    if (!isMongoConnected()) {
      console.error('❌ MongoDB not connected for login');
      return res.status(503).json({ 
        error: 'Database service unavailable. Please try again later.',
        details: 'MongoDB connection is not established'
      });
    }
    
    const { password } = req.body;
    
    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'Your account has been deactivated'
      });
    }
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Server auth configuration error',
        message: 'JWT_SECRET is not configured.'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    console.log('✅ Login successful:', normalizedEmail);
    res.json({ token, role: user.role, email: user.email });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    
    // Handle specific MongoDB errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      return res.status(503).json({ 
        error: 'Database service unavailable. Please try again later.',
        details: err.message
      });
    }
    
    res.status(500).json({ error: err.message });
  }
};

/**
 * Google Login Endpoint
 * 
 * SECURITY CRITICAL:
 * 1. Verifies Firebase ID token on backend (server-side validation)
 * 2. Extracts user info from verified token
 * 3. Checks/creates user in MongoDB
 * 4. Generates JWT token
 * 5. Returns token for further authentication
 * 
 * Never trust tokens from frontend - always verify server-side!
 */
exports.googleLogin = async (req, res) => {
  try {
    const { firebaseToken, googleUser } = req.body;

    console.log('🔐 Google login attempt:', { email: googleUser?.email });

    // Validate input
    if (!firebaseToken) {
      return res.status(400).json({ 
        error: 'Firebase token required',
        message: 'Missing authentication token'
      });
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({ 
        error: 'Invalid user data',
        message: 'Email is required'
      });
    }

    // Check MongoDB connection
    if (!isMongoConnected()) {
      console.error('❌ MongoDB not connected for Google login');
      return res.status(503).json({
        error: 'Database service unavailable. Please try again later.',
        details: 'MongoDB connection is not established'
      });
    }

    // SECURITY: Step 1 - Verify Firebase token on backend
    // This is critical - never trust tokens from the frontend alone
    const tokenVerification = await verifyFirebaseToken(firebaseToken);
    
    if (!tokenVerification.verified) {
      console.error('❌ Firebase token verification failed:', tokenVerification.error);
      return res.status(401).json({
        error: 'Authentication failed',
        message: tokenVerification.error || 'Invalid authentication token'
      });
    }

    // Step 2 - Extract and validate claims
    const claims = tokenVerification.claims;
    const normalizedEmail = String(googleUser.email).trim().toLowerCase();
    const claimsUser = extractUserFromClaims(claims);
    
    // Verify email matches in token and request
    if (claims.email && claims.email.toLowerCase() !== normalizedEmail) {
      console.error('❌ Email mismatch between token and request');
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Email verification failed'
      });
    }

    const requestedRole = String(req.body.role || 'consumer').toLowerCase();
    const allowAdminRegistration = String(process.env.ALLOW_ADMIN_REGISTRATION || '').toLowerCase() === 'true';

    if (requestedRole === 'admin' && !allowAdminRegistration) {
      return res.status(403).json({
        error: 'Admin registration is restricted',
        message: 'Admin accounts must be provisioned by bootstrap or an existing administrator.'
      });
    }

    if (!['producer', 'consumer', 'admin'].includes(requestedRole)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be producer, consumer, or admin.'
      });
    }

    // Step 3 - Check if user exists, create if not
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // New user - create with OAuth data
      console.log('📝 Creating new user from Google OAuth:', normalizedEmail);
      
      user = new User({
        email: normalizedEmail,
        firstName: googleUser.firstName || claimsUser.firstName || '',
        lastName: googleUser.lastName || claimsUser.lastName || '',
        role: requestedRole || 'consumer',
        oauth: {
          provider: 'google',
          uid: googleUser.googleUID || claimsUser.googleUID || claims.uid || '',
          profilePicture: googleUser.profilePicture || claimsUser.profilePicture || claims.picture || '',
          verifiedAt: new Date()
        },
        isActive: true,
        lastLogin: new Date()
      });

      await user.save();
      console.log('✅ New user created from Google OAuth');
    } else {
      // Existing user - update OAuth info if not already set
      if (!user.oauth || user.oauth.provider !== 'google') {
        user.oauth = {
          provider: 'google',
          uid: googleUser.googleUID || claimsUser.googleUID || claims.uid || user.oauth?.uid || '',
          profilePicture: googleUser.profilePicture || claimsUser.profilePicture || claims.picture || user.oauth?.profilePicture || '',
          verifiedAt: new Date()
        };
      }

      if (!user.firstName && (googleUser.firstName || claimsUser.firstName)) {
        user.firstName = googleUser.firstName || claimsUser.firstName;
      }

      if (!user.lastName && (googleUser.lastName || claimsUser.lastName)) {
        user.lastName = googleUser.lastName || claimsUser.lastName;
      }
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      console.log('✅ User updated from Google OAuth');
    }

    // Step 4 - Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'Your account has been deactivated'
      });
    }

    // Step 5 - Generate JWT token (same format as email/password login)
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'JWT_SECRET is not configured'
      });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('✅ Google login successful, JWT generated for:', normalizedEmail);

    // Return same response format as email/password login
    res.json({
      token,
      role: user.role,
      email: user.email,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (err) {
    console.error('❌ Google login error:', err.message);

    // Handle specific MongoDB errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      return res.status(503).json({
        error: 'Database service unavailable. Please try again later.',
        details: err.message
      });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Invalid user data',
        message: Object.values(err.errors).map(e => e.message).join(', ')
      });
    }

    // Generic error
    res.status(500).json({
      error: 'Login failed',
      message: err.message
    });
  }
};

const User = require('../User'); // ✅ Fixed path
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Helper function to check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

exports.register = async (req, res) => {
  try {
    console.log('📝 Registration attempt:', { email: req.body.email, role: req.body.role });
    
    // Check MongoDB connection
    if (!isMongoConnected()) {
      console.error('❌ MongoDB not connected for registration');
      return res.status(503).json({ 
        error: 'Database service unavailable. Please try again later.',
        details: 'MongoDB connection is not established'
      });
    }
    
    const { email, password, role } = req.body;
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
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed, role: requestedRole || 'producer' });
    await user.save();
    
    console.log('✅ User registered successfully:', email);
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

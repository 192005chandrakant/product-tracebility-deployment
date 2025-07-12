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
    const user = new User({ email, password: hashed, role: role || 'producer' });
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
    console.log('🔐 Login attempt:', { email: req.body.email });
    
    // Check MongoDB connection
    if (!isMongoConnected()) {
      console.error('❌ MongoDB not connected for login');
      return res.status(503).json({ 
        error: 'Database service unavailable. Please try again later.',
        details: 'MongoDB connection is not established'
      });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });
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
    
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    console.log('✅ Login successful:', email);
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

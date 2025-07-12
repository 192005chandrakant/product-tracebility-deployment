const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');

const app = express();

// Enhanced CORS setup for both development and production
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, proxy)
    if (!origin) {
      console.log('CORS allowing no origin (proxy/mobile)');
      return callback(null, true);
    }
    
    // Define allowed origins
    const allowedOrigins = [
      // Development origins
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      
      // Production origins - Netlify domains
      'https://blockchain-product-traceability.netlify.app',
      'https://blockchain-product-traceability.netlify.app/',
      'https://walmart-sparkthon.netlify.app',
      'https://walmart-sparkthon-product-traceability.netlify.app',
      'https://main--walmart-sparkthon.netlify.app',
      'https://deploy-preview--walmart-sparkthon.netlify.app',
      'https://main--blockchain-product-traceability.netlify.app',
      'https://deploy-preview--blockchain-product-traceability.netlify.app',
    ];
    
    // In development mode, be more permissive
    if (process.env.NODE_ENV === 'development' || process.env.CORS_ALLOW_ALL === 'true') {
      console.log('CORS allowing origin (dev mode):', origin);
      return callback(null, true);
    }
    
    // Check localhost patterns for development
    if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      console.log('CORS allowing localhost origin:', origin);
      return callback(null, true);
    }
    
    // Check Netlify preview patterns
    if (origin && (origin.includes('netlify.app') || origin.includes('deploy-preview'))) {
      console.log('CORS allowing Netlify deployment:', origin);
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('CORS allowing listed origin:', origin);
      return callback(null, true);
    }
    
    // Default fallback - deny access
    console.log('CORS blocking origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With', 
    'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
  maxAge: 86400
}));

// Add OPTIONS pre-flight response for all routes
app.options('*', cors());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// Compression middleware for better performance
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (1-9)
  threshold: 1024 // Only compress responses > 1KB
}));

// Trust first proxy for rate limiting
app.set('trust proxy', 1);

// Rate limiting - disabled for development
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true
  });
  app.use('/api/', limiter);
}

// Body parsers with optimized limits
app.use(express.json({ 
  limit: '10mb',
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000
}));

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product-traceability';

// Test Routes
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'API is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.send('Product Traceability API');
});

// MongoDB Connection
mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('⚠️ Server will continue without database connection');
});

// Register Routes
app.use('/api', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Add statistics routes manually for testing
app.get('/api/statistics/test', (req, res) => {
  res.json({ message: 'Statistics working!', timestamp: new Date().toISOString() });
});

// Simple statistics endpoint for debugging
app.get('/api/statistics/stats', async (req, res) => {
  try {
    const Product = require('./models/Product');
    
    // Get real product count
    let productCount = 0;
    try {
      productCount = await Product.countDocuments();
    } catch (err) {
      console.log('Using mock product count due to DB error');
      productCount = 15; // fallback
    }
    
    // Mock some realistic statistics
    const totalScans = Math.floor(productCount * 2.3 + Math.random() * 20);
    const totalUpdates = Math.floor(productCount * 1.8 + Math.random() * 15);
    
    const stats = {
      totalProducts: productCount,
      totalScans: totalScans,
      totalUpdates: totalUpdates,
      // Remove dummy products - these should come from the database
      recentProducts: []
    };
    
    res.json({ 
      success: true, 
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

try {
  app.use('/api/statistics', statisticsRoutes);
  console.log('✅ Statistics routes mounted successfully');
} catch (error) {
  console.error('❌ Error mounting statistics routes:', error.message);
}

// Debug: Log all routes
console.log('\n=== REGISTERED ROUTES ===');
app._router.stack.forEach(function(r){
  if(r.route && r.route.path){
    console.log(r.route.path)
  } else if (r.name === 'router') {
    r.handle.stack.forEach(function(nestedR) {
      if (nestedR.route && nestedR.route.path) {
        console.log('Nested route:', nestedR.route.path);
      }
    });
  }
});
console.log('=== END ROUTES ===\n');

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 Not Found Handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Start Server with error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  // Dynamically log allowed CORS origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'https://blockchain-product-traceability.netlify.app',
    'https://walmart-sparkthon.netlify.app',
    'https://walmart-sparkthon-product-traceability.netlify.app',
    'https://main--walmart-sparkthon.netlify.app',
    'https://deploy-preview--walmart-sparkthon.netlify.app',
    'https://main--blockchain-product-traceability.netlify.app',
    'https://deploy-preview--blockchain-product-traceability.netlify.app',
    'Any *.netlify.app deployment preview'
  ];
  console.log('🌐 CORS enabled for:', allowedOrigins);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please:\n1. Use a different port, or\n2. Run 'npx kill-port ${PORT}' to free it up`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

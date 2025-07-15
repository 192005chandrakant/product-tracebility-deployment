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
      // Reduce logging - only log once per session
      if (!global.corsLogged) {
        console.log('CORS allowing no origin (proxy/mobile)');
        global.corsLogged = true;
      }
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
      'https://product-tracebility-deployment.vercel.app',
      'https://product-tracebility-deployment.vercel.app/',
      'https://product-tracebility-deployment.vercel.app/api',
      'https://product-tracebility-deployment.vercel.app/api/auth',
      'https://product-tracebility-deployment.vercel.app/api/profile',
      'https://product-tracebility-deployment.vercel.app/api/statistics',
      'https://product-tracebility-deployment.vercel.app/api/statistics/test',
      'https://product-tracebility-deployment.vercel.app/product/2025100704'
    ];
    
    // In development mode, be more permissive
    if (process.env.NODE_ENV === 'development' || process.env.CORS_ALLOW_ALL === 'true') {
      // Reduce logging - only log once per origin
      if (!global.allowedOrigins) global.allowedOrigins = new Set();
      if (!global.allowedOrigins.has(origin)) {
        console.log('CORS allowing origin (dev mode):', origin);
        global.allowedOrigins.add(origin);
      }
      return callback(null, true);
    }
    
    // Check localhost patterns for development
    if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      if (!global.allowedOrigins) global.allowedOrigins = new Set();
      if (!global.allowedOrigins.has(origin)) {
        console.log('CORS allowing localhost origin:', origin);
        global.allowedOrigins.add(origin);
      }
      return callback(null, true);
    }
    
    // Check Netlify preview patterns
    if (origin && (origin.includes('netlify.app') || origin.includes('deploy-preview'))) {
      if (!global.allowedOrigins) global.allowedOrigins = new Set();
      if (!global.allowedOrigins.has(origin)) {
        console.log('CORS allowing Netlify deployment:', origin);
        global.allowedOrigins.add(origin);
      }
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      if (!global.allowedOrigins) global.allowedOrigins = new Set();
      if (!global.allowedOrigins.has(origin)) {
        console.log('CORS allowing listed origin:', origin);
        global.allowedOrigins.add(origin);
      }
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

// Disable compression in development to fix content decoding errors
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode - compression disabled to fix proxy issues');
} else {
  // Compression middleware for better performance (production only)
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
}

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
} else {
  console.log('🔧 Development mode - rate limiting disabled');
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

// Function to find available port
const findAvailablePort = async (startPort) => {
  const net = require('net');
  
  const isPortAvailable = (port) => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      server.on('error', () => resolve(false));
    });
  };
  
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
    if (port > startPort + 10) {
      throw new Error(`No available ports found between ${startPort} and ${startPort + 10}`);
    }
  }
  return port;
};



app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'API is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// MongoDB connection test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const connectionStatus = {
      mongooseReadyState: mongoose.connection.readyState,
      globalMongoConnected: global.mongoConnected,
      connectionString: MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Hide credentials
      timestamp: new Date().toISOString()
    };
    
    // Test database connection
    if (global.mongoConnected && mongoose.connection.readyState === 1) {
      try {
        const User = require('./models/User');
        const userCount = await User.countDocuments();
        connectionStatus.testQuery = 'success';
        connectionStatus.userCount = userCount;
        connectionStatus.status = 'connected';
      } catch (err) {
        connectionStatus.testQuery = 'failed';
        connectionStatus.error = err.message;
        connectionStatus.status = 'error';
      }
    } else {
      connectionStatus.status = 'disconnected';
      connectionStatus.error = 'MongoDB not connected';
    }
    
    res.json(connectionStatus);
  } catch (error) {
    res.status(500).json({ 
      error: 'Database test failed', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/', (req, res) => {
  res.send('Product Traceability API');
});

// MongoDB Connection with proper options and error handling
let mongoConnected = false;

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // 5 seconds timeout
  socketTimeoutMS: 45000, // 45 seconds socket timeout
  maxPoolSize: 10, // Maximum number of connections in the pool
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  }
})
.then(() => {
  mongoConnected = true;
  console.log('✅ MongoDB connected successfully');
  console.log(`   Database: ${MONGODB_URI.split('/').pop()}`);
})
.catch((err) => {
  mongoConnected = false;
  console.error('❌ MongoDB connection error:', err.message);
  console.log('⚠️ Server will continue without database connection');
  console.log('💡 To fix this:');
  console.log('   1. Make sure MongoDB is running locally: mongod');
  console.log('   2. Or set MONGODB_URI environment variable to a valid MongoDB connection string');
  console.log('   3. For development, you can use MongoDB Atlas (cloud)');
});

// Monitor MongoDB connection status
mongoose.connection.on('connected', () => {
  mongoConnected = true;
  console.log('✅ MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  mongoConnected = false;
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  mongoConnected = false;
  console.log('⚠️ MongoDB connection disconnected');
});

// Export connection status for use in other modules
global.mongoConnected = mongoConnected;

// Disable compression in development to fix content decoding errors
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode - compression disabled to fix proxy issues');
} else {
  // Compression middleware for better performance (production only)
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
}

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
    let dbError = false;
    
    // Check if MongoDB is connected
    if (global.mongoConnected && mongoose.connection.readyState === 1) {
      try {
        productCount = await Product.countDocuments();
      } catch (err) {
        dbError = true;
        // Only log once per session to reduce noise
        if (!global.dbErrorLogged) {
          console.log('Using mock product count due to DB error:', err.message);
          global.dbErrorLogged = true;
        }
        productCount = 15; // fallback
      }
    } else {
      dbError = true;
      // Only log once per session to reduce noise
      if (!global.dbErrorLogged) {
        console.log('Using mock product count - MongoDB not connected');
        global.dbErrorLogged = true;
      }
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
      recentProducts: [],
      dbConnected: !dbError
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
const startServer = async () => {
  try {
    const availablePort = await findAvailablePort(PORT);
    
    const server = app.listen(availablePort, () => {
      console.log(`🚀 Server running on port ${availablePort}`);
      console.log(`📡 API available at http://localhost:${availablePort}`);
      console.log(`🧪 Test endpoint: http://localhost:${availablePort}/test`);
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
      
      // If port changed, log it
      if (availablePort !== PORT) {
        console.log(`⚠️ Port ${PORT} was in use, using port ${availablePort} instead`);
      }
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${availablePort} is already in use. Please:\n1. Use a different port, or\n2. Run 'npx kill-port ${availablePort}' to free it up`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

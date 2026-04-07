const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { bootstrapAdminAccount } = require('./utils/adminBootstrap');

const app = express();

const normalizeOrigin = (value) => {
  if (!value) return null;
  try {
    const parsed = new URL(String(value).trim());
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
};

const buildAllowedOrigins = () => {
  const defaults = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'https://blockchain-product-traceability.netlify.app',
    'https://walmart-sparkthon.netlify.app',
    'https://walmart-sparkthon-product-traceability.netlify.app',
    'https://main--walmart-sparkthon.netlify.app',
    'https://deploy-preview--walmart-sparkthon.netlify.app',
    'https://main--blockchain-product-traceability.netlify.app',
    'https://deploy-preview--blockchain-product-traceability.netlify.app',
    'https://product-tracebility-deployment.vercel.app'
  ];

  const fromEnv = String(process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const fromClientApp = [process.env.CLIENT_APP_URL, process.env.REACT_APP_API_URL].filter(Boolean);

  return new Set(
    [...defaults, ...fromEnv, ...fromClientApp]
      .map(normalizeOrigin)
      .filter(Boolean)
  );
};

const isPrivateDevHost = (origin) => {
  try {
    const { hostname } = new URL(origin);
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    return false;
  } catch {
    return false;
  }
};

const allowedOrigins = buildAllowedOrigins();
const loggedCorsOrigins = new Set();

const corsOptions = {
  origin(origin, callback) {
    // Non-browser requests (curl, server-to-server) do not send Origin.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);
    const isDev = process.env.NODE_ENV !== 'production';
    const allowAll = String(process.env.CORS_ALLOW_ALL || '').toLowerCase() === 'true';
    const isAllowed = Boolean(
      allowAll ||
      (normalizedOrigin && allowedOrigins.has(normalizedOrigin)) ||
      (isDev && normalizedOrigin && isPrivateDevHost(normalizedOrigin))
    );

    if (isAllowed) {
      if (!loggedCorsOrigins.has(origin)) {
        console.log('CORS allowing origin:', origin);
        loggedCorsOrigins.add(origin);
      }
      return callback(null, true);
    }

    console.log('CORS blocking origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// Disable compression in development to fix content decoding errors
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode - compression disabled to simplify local cross-origin debugging');
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

// Trust proxy only when explicitly enabled or in production deployments.
const trustProxyEnabled = process.env.NODE_ENV === 'production' || String(process.env.TRUST_PROXY || '').toLowerCase() === 'true';
app.set('trust proxy', trustProxyEnabled ? 1 : false);

// Rate limiting - disabled for development
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: trustProxyEnabled
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
const CLIENT_BUILD_PATH = path.resolve(__dirname, '..', 'client', 'build');
const CLIENT_INDEX_PATH = path.join(CLIENT_BUILD_PATH, 'index.html');
const HAS_CLIENT_BUILD = fs.existsSync(CLIENT_BUILD_PATH);
const HAS_CLIENT_INDEX = fs.existsSync(CLIENT_INDEX_PATH);
const PRODUCT_ID_PATTERN = /^[A-Za-z0-9._-]{3,120}$/;

function getClientAppBaseURL() {
  const raw = String(process.env.CLIENT_APP_URL || 'http://localhost:3000').trim();

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Unsupported protocol');
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch (error) {
    console.warn('Invalid CLIENT_APP_URL, using default http://localhost:3000');
    return 'http://localhost:3000';
  }
}

if (HAS_CLIENT_BUILD) {
  app.use(express.static(CLIENT_BUILD_PATH));
}

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
  global.mongoConnected = true;
  console.log('✅ MongoDB connected successfully');
  console.log(`   Database: ${MONGODB_URI.split('/').pop()}`);

  bootstrapAdminAccount().catch((error) => {
    console.error(`❌ Admin bootstrap failed: ${error.message}`);
  });
})
.catch((err) => {
  mongoConnected = false;
  global.mongoConnected = false;
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
  global.mongoConnected = true;
  console.log('✅ MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  mongoConnected = false;
  global.mongoConnected = false;
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  mongoConnected = false;
  global.mongoConnected = false;
  console.log('⚠️ MongoDB connection disconnected');
});

// Export connection status for use in other modules
global.mongoConnected = mongoConnected;

// Register Routes
app.use('/api', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Add statistics routes manually for testing
app.get('/api/statistics/test', (req, res) => {
  res.json({ message: 'Statistics working!', timestamp: new Date().toISOString() });
});

// Simple statistics endpoint for debugging
app.get('/api/statistics/stats', async (req, res) => {
  try {
    const Product = require('./models/Product');

    if (!global.mongoConnected || mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB is not connected',
        message: 'Statistics require a live database connection'
      });
    }

    const [totalProducts, recentProducts, stageAgg, stageEventAgg] = await Promise.all([
      Product.countDocuments(),
      Product.find()
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(8)
        .select('productId name origin manufacturer createdAt updatedAt stages blockchainEvents stageEvents')
        .lean(),
      Product.aggregate([
        { $unwind: { path: '$stages', preserveNullAndEmptyArrays: false } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]),
      Product.aggregate([
        {
          $project: {
            stageEventCount: { $size: { $ifNull: ['$stageEvents', []] } }
          }
        },
        { $group: { _id: null, count: { $sum: '$stageEventCount' } } }
      ])
    ]);

    const totalUpdates = stageAgg[0]?.count || 0;
    const totalScans = stageEventAgg[0]?.count || 0;

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalScans,
        totalUpdates,
        recentProducts,
        dbConnected: true
      },
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

// Anonymous deep-link fallback for QR targets.
app.get('/product/:id', (req, res) => {
  const productId = String(req.params.id || '');
  if (!PRODUCT_ID_PATTERN.test(productId)) {
    return res.status(400).json({ error: 'Invalid product id format' });
  }

  if (HAS_CLIENT_INDEX) {
    return res.sendFile(CLIENT_INDEX_PATH);
  }

  const frontendBase = getClientAppBaseURL();
  const target = `${frontendBase}/product/${encodeURIComponent(productId)}`;
  return res.redirect(302, target);
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
      console.log(`🧪 Health endpoint: http://localhost:${availablePort}/api/health`);
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

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product-traceability';

// Serve uploads directory as static files
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// Test Routes
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Product Traceability API');
});

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('⚠️ Server will continue without database connection');
});

// Register Routes
app.use('/api', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Debug: Log all registered routes (simplified for compatibility)
console.log('\n=== REGISTERED ROUTES ===');
console.log('GET  /test');
console.log('GET  /');
console.log('POST /api/add-product');
console.log('POST /api/add-product-test');
console.log('POST /api/update-product/:id');
console.log('GET  /api/product/:id');
console.log('GET  /api/products');
console.log('POST /api/auth/register');
console.log('POST /api/auth/login');
console.log('GET  /api/profile');
console.log('PUT  /api/profile');
console.log('GET  /api/profile/stats');
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

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🌐 CORS enabled for: http://localhost:3000`);
});

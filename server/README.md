# Server - Node.js Backend API

The backend API server for the Product Traceability System built with Node.js, Express, MongoDB, and Cloudinary integration.

## 🏗️ Architecture

```
server/
├── controllers/            # Business logic controllers
│   ├── authController.js   # Authentication logic
│   ├── productController.js # Product management
│   ├── profileController.js # User profile management
│   └── statisticsController.js # Dashboard statistics
├── middleware/             # Express middleware
│   ├── auth.js            # Basic JWT authentication
│   └── enhancedAuth.js    # Role-based authentication
├── models/                # MongoDB data models
│   ├── Product.js         # Product schema
│   └── User.js           # User schema
├── routes/                # API route definitions
│   ├── authRoutes.js      # Authentication routes
│   ├── productRoutes.js   # Product management routes
│   ├── profileRoutes.js   # User profile routes
│   ├── statisticsRoutes.js # Statistics routes
│   └── storageRoutes.js   # File storage routes
├── services/              # External service integrations
│   ├── cloudinaryService.js # Cloudinary file storage
│   ├── localStorageService.js # Local file fallback
│   └── storageFactory.js  # Storage service selection
├── qr/                    # QR code generation
│   └── generateQR.js      # QR code utilities
├── utils/                 # Utility functions
│   ├── blockchain.js      # Blockchain integration
│   ├── hash.js           # Hashing utilities
│   └── role.js           # Role management
├── .env                   # Environment variables
├── .env.example          # Environment template
├── index.js              # Server entry point
└── package.json          # Dependencies and scripts
```

## 🛠️ Technologies Used

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **Cloudinary** - Cloud file storage
- **QR Code** - QR code generation
- **Multer** - File upload handling
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Cloudinary account
- npm or yarn

### Installation

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:5000`

## 🔧 Environment Configuration

Create a `.env` file in the server directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/product-traceability
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/product-traceability

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Server Configuration
PORT=5000
NODE_ENV=development

# Optional: Additional security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## 📋 Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run test           # Run test suite
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues automatically
```

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

```javascript
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/verify      # Verify JWT token
POST /api/auth/refresh     # Refresh JWT token
```

### Product Routes (`/api`)

```javascript
GET    /api/products           # Get all products
POST   /api/products           # Create new product (Admin/Manufacturer)
GET    /api/product/:id        # Get product by ID
PUT    /api/product/:id        # Update product (Admin/Manufacturer)
DELETE /api/product/:id        # Delete product (Admin only)
PUT    /status # Update product status
GET    /api/product/:id/qr     # Generate/get QR code
```

### Profile Routes (`/api/profile`)

```javascript
GET    /api/profile        # Get user profile
PUT    /api/profile        # Update user profile
DELETE /api/profile        # Delete user account
```

### Statistics Routes (`/api/statistics`)

```javascript
GET /api/statistics/stats     # Get dashboard statistics
GET /api/statistics/products  # Get product statistics
GET /api/statistics/users     # Get user statistics
```

### Storage Routes (`/storage`)

```javascript
POST /storage/upload          # Upload file to Cloudinary
GET  /storage/file/:id        # Get file information
DELETE /storage/file/:id      # Delete file
```

## 🔐 Authentication & Authorization

### JWT Authentication
- Access tokens with configurable expiration
- Refresh token mechanism
- Secure password hashing with bcrypt
- Protected route middleware

### Role-Based Access Control

#### Roles
- **Admin**: Full system access
- **Manufacturer**: Can create/manage own products
- **Consumer**: Read-only access

#### Enhanced Authentication
- Secondary password confirmation for sensitive actions
- Role-based route protection
- Permission validation middleware

### Security Middleware
```javascript
// Basic authentication
const { protect } = require('./middleware/auth');

// Enhanced authentication with role checking
const { enhancedAuth } = require('./middleware/enhancedAuth');

// Usage
router.post('/products', enhancedAuth(['admin', 'manufacturer']), createProduct);
```

## 💾 Database Models

### User Model
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  role: String (admin|manufacturer|consumer),
  profile: {
    firstName: String,
    lastName: String,
    company: String,
    phone: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model
```javascript
{
  _id: ObjectId,
  productId: String (unique),
  name: String,
  description: String,
  manufacturer: String,
  origin: String,
  status: String,
  blockchainRefHash: String,
  imageFile: {
    fileId: String,
    fileName: String,
    publicUrl: String,
    downloadUrl: String
  },
  certFile: {
    fileId: String,
    fileName: String,
    publicUrl: String,
    downloadUrl: String
  },
  qrCode: {
    fileId: String,
    fileName: String,
    publicUrl: String,
    downloadUrl: String
  },
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## ☁️ File Storage

### Cloudinary Integration
- Primary storage service for files
- Automatic PDF optimization
- Image transformations
- Secure URL generation

### Local Storage Fallback
- Backup storage option
- Development environment support
- Network-independent operation

### Storage Factory Pattern
```javascript
const { getStorageService } = require('./services/storageFactory');

// Automatically selects Cloudinary or local storage
const storage = getStorageService();
const result = await storage.uploadFile(buffer, filename, mimeType, productId);
```

## 🔗 QR Code Generation

### Features
- Dynamic QR code generation
- Product URL encoding
- PNG format output
- Cloudinary storage integration

### Usage
```javascript
const { generateQRCode } = require('./qr/generateQR');

// Generate QR code buffer
const qrBuffer = await generateQRCode(productId);

// Upload to storage
const uploadResult = await storage.uploadFile(qrBuffer, filename, 'image/png', productId);
```

## 📊 Error Handling

### Global Error Handler
```javascript
// Centralized error handling
app.use((error, req, res, next) => {
  console.error(error.stack);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});
```

### Custom Error Classes
- ValidationError
- AuthenticationError
- AuthorizationError
- FileUploadError

## 🧪 Testing

### Test Structure
```bash
server/
├── __tests__/
│   ├── auth.test.js         # Authentication tests
│   ├── products.test.js     # Product management tests
│   ├── storage.test.js      # File storage tests
│   └── utils.test.js        # Utility function tests
```

### Running Tests
```bash
npm test                     # Run all tests
npm test -- --watch         # Run in watch mode
npm test -- --coverage      # Run with coverage report
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Start MongoDB
   sudo systemctl start mongod
   
   # For MongoDB Atlas, check network access and credentials
   ```

2. **Cloudinary Upload Issues**
   ```bash
   # Verify credentials in .env
   # Check file size limits
   # Verify network connectivity
   ```

3. **JWT Token Issues**
   ```bash
   # Check JWT_SECRET in .env
   # Verify token expiration settings
   # Clear client-side storage
   ```

4. **CORS Errors**
   ```bash
   # Verify CORS_ORIGIN in .env
   # Check frontend URL configuration
   # Review CORS middleware setup
   ```

### Debug Mode
```bash
# Enable debug logging
DEBUG=app:* npm start

# Or set environment variable
NODE_ENV=development npm start
```

## 📈 Performance Optimization

### Database Optimization
- MongoDB indexing on frequently queried fields
- Connection pooling
- Query optimization

### Caching Strategy
- Redis integration (optional)
- In-memory caching for frequently accessed data
- CDN for static assets

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 🔧 Configuration Management

### Environment-based Configuration
- Development, staging, production environments
- Database connection strings
- External service credentials
- Feature flags

### Security Best Practices
- Environment variable validation
- Secret rotation strategies
- HTTPS enforcement in production
- Input sanitization

## 📝 Logging

### Winston Logger Configuration
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

## 🚀 Deployment

### Production Setup
```bash
# Build application
npm run build

# Start with PM2
pm2 start index.js --name "product-traceability-api"

# Or use Docker
docker build -t product-api .
docker run -p 5000:5000 product-api
```

### Environment Variables for Production
- Set NODE_ENV=production
- Use strong JWT secrets
- Configure production database
- Set up proper CORS origins
- Enable HTTPS

## 🤝 Contributing

### Development Guidelines
1. Follow RESTful API conventions
2. Add input validation for all endpoints
3. Include appropriate error handling
4. Write tests for new features
5. Update API documentation

### Code Style
- Use ESLint configuration
- Follow Express.js best practices
- Maintain consistent error handling
- Document complex business logic

## 📞 Support

For backend-specific issues:
- Check server logs for errors
- Verify database connections
- Test API endpoints individually
- Review middleware configurations
- Check external service integrations

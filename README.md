# Product Traceability Blockchain System

A comprehensive blockchain-based product traceability system built with Node.js, React, MongoDB, and integrated with Cloudinary for file storage.

## 🚀 Features

- **Blockchain Integration**: Secure product registration on blockchain
- **Role-Based Authentication**: Admin, Manufacturer, Consumer roles with different permissions
- **File Management**: Upload and manage product images, certificates, and QR codes via Cloudinary
- **QR Code Generation**: Automatic QR code generation for product tracking
- **Real-time Dashboard**: Monitor product statistics and activities
- **Certificate Management**: Upload and view product certificates (PDF support)
- **Secure Operations**: Password confirmation for sensitive actions

## 🏗️ Architecture

```
product-tracibility/
├── client/                 # React frontend application
├── server/                 # Node.js/Express backend API
├── contracts/              # Blockchain smart contracts
├── scripts/               # Deployment scripts
├── artifacts/             # Compiled smart contracts
└── cache/                 # Hardhat cache files
```

## 🛠️ Tech Stack

### Frontend
- **React** 18+ with hooks
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hot Toast** for notifications
- **React Icons** for UI icons

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **QR Code** generation library
- **Cloudinary** for file storage

### Blockchain
- **Hardhat** for smart contract development
- **Solidity** for smart contracts
- **Ethereum** compatible networks

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **Cloudinary** account for file storage
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd product-tracibility
```

### 2. Install Dependencies
```bash
# Install root dependencies (for blockchain)
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Setup

Create `.env` files in both `server/` and root directory:

**server/.env:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/product-traceability
JWT_SECRET=your-super-secret-jwt-key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server Configuration
PORT=5000
NODE_ENV=development
```

**Root .env (for blockchain):**
```env
# Blockchain Configuration
PRIVATE_KEY=your-ethereum-private-key
INFURA_PROJECT_ID=your-infura-project-id
```

### 4. Start Development Servers

```bash
# Terminal 1: Start MongoDB (if local)
mongod

# Terminal 2: Start backend server
cd server
npm start

# Terminal 3: Start frontend development server
cd client
npm start

# Terminal 4: Deploy smart contracts (optional)
npx hardhat run scripts/deploy.js --network localhost
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017

## 🔧 Configuration

### Cloudinary Setup
1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add these credentials to your `server/.env` file

### MongoDB Setup
- **Local**: Install MongoDB locally and start the service
- **Cloud**: Use MongoDB Atlas and update the connection string

### Blockchain Setup (Optional)
- Install Hardhat: `npm install --save-dev hardhat`
- Configure network settings in `hardhat.config.js`
- Deploy contracts: `npx hardhat run scripts/deploy.js`

## 👥 User Roles

### Admin
- Create and manage products
- Update product status
- View all products and statistics
- Manage user accounts

### Manufacturer
- Create products for their company
- Update their product status
- View their products

### Consumer
- View product details
- Scan QR codes
- Access product certificates

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user types
- **Password Confirmation**: Required for sensitive operations
- **File Upload Security**: Validated file types and sizes
- **Blockchain Integration**: Immutable product records

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `GET /api/product/:id` - Get product details
- `PUT /api/product/:id/status` - Update product status
- `GET /api/product/:id/qr` - Get/generate QR code

### File Management
- `POST /storage/upload` - Upload files to Cloudinary
- `GET /storage/file/:id` - Get file information

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access for cloud databases

2. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper file formats

3. **Authentication Problems**
   - Check JWT secret configuration
   - Verify token expiration settings
   - Clear browser storage and retry

4. **Frontend Build Issues**
   - Clear node_modules and reinstall
   - Check for port conflicts
   - Verify environment variables

### Debugging

- Check browser console for frontend errors
- Review server logs for backend issues
- Use MongoDB Compass for database inspection
- Test API endpoints with Postman or similar tools

## 📚 Additional Resources

- [React Documentation](https://reactjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Hardhat Documentation](https://hardhat.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Check the documentation in `client/README.md` and `server/README.md`
- Review the troubleshooting section above
- Create an issue in the repository
npm install

# Install client dependencies
cd ../client
npm install

# Go back to root
cd ..
```

### 3. Environment Configuration

#### Server Environment (server/.env)
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your configuration:

```properties
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/product-traceability

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Blockchain Configuration
INFURA_API_KEY=your-infura-project-id
PRIVATE_KEY=your-ethereum-private-key
CONTRACT_ADDRESS=deployed-contract-address
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-infura-project-id

# Google Drive OAuth (Free 15GB Storage)
GOOGLE_DRIVE_ENABLED=true
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/auth/google/callback
GOOGLE_DRIVE_FOLDER_NAME=Product-Uploads
```

### 4. Start the Application

#### Terminal 1 - Backend Server
```bash
cd server
npm start
```
Server will run on: http://localhost:5000

#### Terminal 2 - Frontend Client
```bash
cd client
npm start
```
Client will run on: http://localhost:3000

## 🔧 Detailed Setup Guide

### MongoDB Setup

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free cluster
   - Create a database user
   - Whitelist your IP address
   - Get the connection string

2. **Configure Database**
   - Replace `MONGODB_URI` in `server/.env`
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/product-traceability`

### Blockchain Setup (Optional)

1. **Infura Configuration**
   - Sign up at [Infura](https://infura.io/)
   - Create a new project
   - Copy the Project ID
   - Update `INFURA_API_KEY` in `server/.env`

2. **Ethereum Wallet**
   - Create a MetaMask wallet
   - Get test ETH from Sepolia faucet
   - Export private key (keep it secure!)
   - Update `PRIVATE_KEY` in `server/.env`

3. **Deploy Smart Contract**
   ```bash
   cd server
   npx hardhat run scripts/deploy.js --network sepolia
   ```
   - Copy the deployed contract address
   - Update `CONTRACT_ADDRESS` in `server/.env`

## 🎯 Usage

### 1. User Registration & Authentication
- Visit: http://localhost:3000
- Click "Sign Up" to create an account
- Choose role: Producer, Distributor, or Consumer
- Login with your credentials

### 2. Product Management
- Go to Admin Dashboard
- Click "Add Product" to create new products
- Upload certificates and images
- Track products through different stages
- Generate and scan QR codes

### 4. Product Tracking
- Use QR code scanner to track products
- View complete product history
- Update product stages and locations
- Monitor analytics and statistics

## 📱 Available Scripts

### Server Scripts
```bash
cd server
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
```

### Client Scripts
```bash
cd client
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App
```

## 🚀 Production Deployment

### Environment Variables for Production
Update your production `.env` files with:
- Production MongoDB URI
- Production domain in OAuth redirect URI
- Mainnet RPC URLs (if using mainnet)
- Secure JWT secrets

### Build and Deploy
```bash
# Build client for production
cd client
npm run build

# The build folder contains the production-ready files
# Deploy the server and serve the built client files
```

## 🔧 Troubleshooting

### Common Issues

1. **Google Drive "File not found" Error**
   - Ensure OAuth is properly configured
   - Check redirect URI matches exactly
   - Verify Google Drive API is enabled

2. **Database Connection Error**
   - Check MongoDB URI format
   - Verify IP whitelist in MongoDB Atlas
   - Ensure database user has proper permissions

3. **Blockchain Connection Issues**
   - Verify Infura project ID
   - Check network configuration
   - Ensure sufficient ETH balance for transactions

4. **Frontend Won't Load**
   - Ensure backend server is running on port 5000
   - Check CORS configuration
   - Verify proxy setting in client package.json

### Development Mode Features

- **Mock Mode**: App works without Google Drive connection
- **Enhanced QR Codes**: Base64 encoded QR codes for offline viewing
- **Fallback Storage**: Local file storage when cloud storage unavailable

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section above
- Review server and client README files for specific setup instructions
- Ensure all environment variables are properly configured

## 🌟 Key Technologies

- **Frontend**: React.js, Framer Motion, Three.js, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Blockchain**: Ethereum, Hardhat, Ethers.js
- **Storage**: Google Drive API, OAuth 2.0
- **Authentication**: JWT, bcrypt
- **File Processing**: Multer, QR Code generation

---

**Happy Tracking! 🚀**

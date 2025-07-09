# Deployment Architecture Quick Reference

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION DEPLOYMENT                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐             │
│  │   Frontend      │    │    Backend      │    │   Blockchain    │             │
│  │   (Netlify)     │    │   (Render)      │    │   (Sepolia)     │             │
│  │                 │    │                 │    │                 │             │
│  │ your-app        │───▶│ your-app        │───▶│ Smart Contract  │             │
│  │ .netlify.app    │    │ .onrender.com   │    │ 0x1234...       │             │
│  │                 │    │                 │    │                 │             │
│  │ • Static Files  │    │ • API Endpoints │    │ • Product Data  │             │
│  │ • React App     │    │ • MongoDB       │    │ • Immutable     │             │
│  │ • UI/UX         │    │ • Blockchain    │    │ • Transparent   │             │
│  │                 │    │   Integration   │    │                 │             │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Deployment Steps

### 1. Smart Contract (ONE TIME)
```bash
# Deploy from local machine
npx hardhat run scripts/deploy.js --network sepolia
# Result: Contract address (0x1234...)
```

### 2. Backend (Render)
```properties
# Environment Variables
CONTRACT_ADDRESS=0x1234...  # From step 1
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
PRIVATE_KEY=your_wallet_private_key
MONGODB_URI=your_mongodb_connection
```

### 3. Frontend (Netlify)
```properties
# Environment Variables
GENERATE_SOURCEMAP=false
ESLINT_NO_DEV_ERRORS=true
```

## 🔄 Data Flow

### Adding a Product:
1. **User** → Frontend form
2. **Frontend** → Backend API (`POST /api/products`)
3. **Backend** → Smart Contract (`addProduct()`)
4. **Smart Contract** → Blockchain storage
5. **Backend** → MongoDB storage
6. **Frontend** → Display success + transaction hash

### Searching Products:
1. **User** → Search form
2. **Frontend** → Backend API (`GET /api/products/search`)
3. **Backend** → MongoDB query
4. **Backend** → Smart Contract verification
5. **Frontend** → Display results

## 📋 Environment Variables Summary

| Component  | Critical Variables | Purpose |
|------------|-------------------|---------|
| Blockchain | `CONTRACT_ADDRESS` | Connect to deployed contract |
| Backend    | `SEPOLIA_RPC_URL`, `PRIVATE_KEY` | Blockchain interaction |
| Backend    | `MONGODB_URI`, `JWT_SECRET` | Database & auth |
| Backend    | `CLOUDINARY_*` | File storage |
| Frontend   | `GENERATE_SOURCEMAP=false` | Build optimization |

## ✅ Production Ready Features

- **Blockchain Integration**: All products stored on Sepolia network
- **File Storage**: Cloudinary for images and certificates
- **Authentication**: JWT-based secure auth
- **Search**: By product ID, name, or certification hash
- **Responsive Design**: Works on all devices
- **Error Handling**: Comprehensive error messages
- **Performance**: Optimized builds and lazy loading

## 🔧 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Contract not found | Check `CONTRACT_ADDRESS` in backend env |
| CORS errors | Update allowed origins in backend |
| Build fails | Check all environment variables |
| Blockchain timeout | Verify `SEPOLIA_RPC_URL` and network |

## 📞 Support Resources

- **DEPLOYMENT_GUIDE.md**: Complete deployment instructions
- **BLOCKCHAIN_DEPLOYMENT_GUIDE.md**: Blockchain-specific guide
- **ERROR_RESOLUTION_GUIDE.md**: Common error solutions
- **NETLIFY_RENDER_QUICK_GUIDE.md**: Platform-specific tips

## 🎯 Success Indicators

- ✅ Frontend loads without errors
- ✅ Backend API responds to requests
- ✅ Products can be added successfully
- ✅ Transaction hashes are displayed
- ✅ Search functionality works
- ✅ Recent products show real data

---

**Remember**: Deploy blockchain → backend → frontend in that order for smoothest experience!

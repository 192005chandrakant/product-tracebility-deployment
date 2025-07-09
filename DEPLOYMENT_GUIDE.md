# Deployment Guide for Product Traceability Application

This guide provides detailed instructions for deploying the Product Traceability application to production environments. The application consists of three main components that need to be deployed:

1. Smart Contract (Blockchain)
2. Backend API Server
3. Frontend Client Application

> **📋 For detailed blockchain deployment information, see [BLOCKCHAIN_DEPLOYMENT_GUIDE.md](BLOCKCHAIN_DEPLOYMENT_GUIDE.md)**

## Prerequisites

Before deploying, ensure you have the following:

- Node.js (v16 or later)
- npm (v8 or later)
- Git
- MongoDB Atlas account (or alternative MongoDB host)
- Infura account (for Ethereum interaction)
- Cloudinary account (for image and file storage)
- Access to an Ethereum network (Sepolia testnet or Ethereum mainnet)
- Ethereum wallet with private key and some ETH for gas fees

## Environment Configuration

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/product-tracibility.git
cd product-tracibility
```

### 2. Set Up Environment Variables

Create the following `.env` files:

#### Root Directory `.env` (for blockchain deployment)

```properties
INFURA_API_KEY=your_infura_api_key
PRIVATE_KEY=your_ethereum_wallet_private_key
INFURA_API_URL=https://sepolia.infura.io/v3/your_infura_api_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_api_key
MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/your_infura_api_key
```

#### Server Directory `.env`

```properties
# Server Configuration
PORT=5000
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_at_least_64_chars_long

# Blockchain Configuration
INFURA_API_KEY=your_infura_api_key
PRIVATE_KEY=your_ethereum_wallet_private_key
CONTRACT_ADDRESS=deployed_contract_address
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_api_key

# Storage Configuration
STORAGE_TYPE=cloudinary
GOOGLE_DRIVE_ENABLED=false

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Client Directory `.env`

```properties
# Disable source maps for production
GENERATE_SOURCEMAP=false
ESLINT_NO_DEV_ERRORS=true
TSC_COMPILE_ON_ERROR=true

# Suppress webpack deprecation warnings
DISABLE_ESLINT_PLUGIN=true
WDS_SOCKET_PORT=0

# Production API URL (if different from development)
# REACT_APP_API_URL=https://your-api-domain.com
```

## Part 1: Deploy Smart Contract

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile Smart Contract

```bash
npx hardhat compile
```

### 3. Deploy to Testnet/Mainnet

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

This will output a contract address. Save this address for the next steps.

### 4. Update Contract Address

Update the CONTRACT_ADDRESS in the server's `.env` file with the newly deployed contract address.

## Part 2: Deploy Backend Server

### 1. Navigate to Server Directory

```bash
cd server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Server (Optional)

```bash
npm run build
```

### 4. Choose a Deployment Method

#### Option A: Traditional VPS/Dedicated Server

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start the server with PM2:
   ```bash
   pm2 start index.js --name "product-traceability-api"
   ```

3. Set up PM2 to restart on server reboot:
   ```bash
   pm2 startup
   pm2 save
   ```

4. Set up Nginx as a reverse proxy (recommended):
   ```
   server {
       listen 80;
       server_name your-api-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. Secure with SSL using Let's Encrypt:
   ```bash
   sudo certbot --nginx -d your-api-domain.com
   ```

#### Option B: Containerized Deployment (Docker)

1. Create a Dockerfile in the server directory:
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   EXPOSE 5000
   CMD ["node", "index.js"]
   ```

2. Build and push the Docker image:
   ```bash
   docker build -t product-traceability-api .
   docker tag product-traceability-api your-registry/product-traceability-api:latest
   docker push your-registry/product-traceability-api:latest
   ```

3. Deploy using Docker Compose or Kubernetes.

#### Option C: Serverless Deployment

1. Adapt the server code for serverless functions
2. Deploy to platforms like AWS Lambda, Vercel, or Netlify Functions

## Part 3: Deploy Frontend Client

### 1. Navigate to Client Directory

```bash
cd ../client
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Update API Endpoint (if necessary)

If your backend API is hosted on a different domain, update the `.env` file with:
```
REACT_APP_API_URL=https://your-api-domain.com
```

### 4. Build the Production Version

```bash
npm run build
```

This will create a `build` directory with optimized production files.

### 5. Choose a Deployment Method

#### Option A: Netlify + Render (Recommended for Quick Deployment)

**For a quick deployment with modern platforms:**

1. **Backend to Render:**
   - Create account at [render.com](https://render.com)
   - Connect GitHub repository
   - Configure as Web Service with Node environment
   - Set root directory to `server`
   - Build command: `npm install`
   - Start command: `node index.js`
   - Add environment variables from your `.env` file

2. **Frontend to Netlify:**
   - Create account at [netlify.com](https://netlify.com)
   - Connect GitHub repository
   - Set base directory to `client`
   - Build command: `npm run build`
   - Publish directory: `build`
   - Add `REACT_APP_API_URL` environment variable with your Render URL

**See `NETLIFY_RENDER_QUICK_GUIDE.md` for detailed step-by-step instructions.**

#### Option B: Static Hosting

1. Upload the contents of the `build` directory to your static hosting provider:
   - AWS S3 + CloudFront
   - Netlify
   - Vercel
   - GitHub Pages

2. For AWS S3 example:
   ```bash
   aws s3 sync build/ s3://your-bucket-name/ --delete
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

#### Option C: Traditional Web Server (Nginx)

1. Copy the build files to your server:
   ```bash
   scp -r build/* user@your-server:/var/www/html/product-traceability/
   ```

2. Configure Nginx:
   ```
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/html/product-traceability;
       index index.html;

       location / {
           try_files $uri /index.html;
       }
   }
   ```

3. Secure with SSL using Let's Encrypt:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## Continuous Integration/Deployment (CI/CD)

For automated deployments, consider setting up CI/CD pipelines:

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Product Traceability

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install Dependencies
        run: |
          npm install
          cd server && npm install
          cd ../client && npm install
          
      - name: Build Frontend
        run: |
          cd client
          npm run build
          
      - name: Deploy Frontend to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: 'client/build'
          
      - name: Deploy Backend to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/product-traceability
            git pull
            cd server
            npm install
            pm2 restart product-traceability-api
```

## Key Features and APIs

The Product Traceability application provides several key features and APIs:

### Backend APIs

1. **Authentication APIs** - User registration, login, and profile management
2. **Product Management APIs** - Add, update, and retrieve product information
3. **Recent Products API** - Get a list of recently added products (`/api/recent-products`)
4. **QR Code Generation API** - Generate QR codes for product verification
5. **Blockchain Integration API** - Interact with the smart contract for product verification

### Frontend Features

1. **Responsive Dashboard** - User-friendly interface for all device sizes
2. **Real-time Statistics** - Display of key metrics and usage statistics
3. **Recent Products Display** - Home page showing the latest added products
4. **QR Code Scanner** - For quick product verification
5. **Product Management** - Add and update product information with status tracking

## Monitoring and Maintenance

### 1. Server Monitoring

- Set up monitoring using tools like:
  - PM2 monitoring (`pm2 monit`)
  - Prometheus + Grafana
  - DataDog
  - New Relic

### 2. Error Tracking

- Implement error tracking with:
  - Sentry.io
  - LogRocket
  - Rollbar

### 3. Regular Maintenance

- Database backups:
  ```bash
  mongodump --uri="your_mongodb_uri" --out=backup/$(date +"%Y-%m-%d")
  ```

- Log rotation:
  ```bash
  sudo logrotate -f /etc/logrotate.d/nginx
  ```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to your repository
2. **API Security**:
   - Implement rate limiting
   - Use CORS properly
   - Validate all inputs
3. **Database Security**:
   - Use strong MongoDB user password
   - Restrict network access to database
4. **Blockchain Security**:
   - Never share your private key
   - Consider using a hardware wallet for mainnet deployments

## Troubleshooting

### Common Issues and Solutions

1. **Smart Contract Deployment Failures**
   - Ensure sufficient ETH for gas fees
   - Check network connectivity to Infura
   - Verify contract compilation success

2. **Server Connection Issues**
   - Check if MongoDB connection string is correct
   - Verify network security groups/firewall settings
   - Ensure correct port configurations

3. **Frontend API Connection Problems**
   - Verify CORS settings in backend
   - Check if API URL is correctly set in frontend
   - Inspect network requests in browser developer tools

4. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper content-type headers

## Contact and Support

For additional help or to report issues, please contact:
- Email: support@example.com
- GitHub Issues: https://github.com/your-username/product-tracibility/issues

---

Last Updated: July 9, 2025

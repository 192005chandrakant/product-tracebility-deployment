# 🚀 PRODUCTION DEPLOYMENT GUIDE

## Executive Summary

This guide provides step-by-step instructions for deploying the Product Traceability Platform to production. The application is a full-stack MERN (MongoDB, Express, React, Node.js) application with blockchain integration, suitable for deployment on AWS, Google Cloud, Azure, or any cloud platform with Docker support.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Security Hardening](#security-hardening)
3. [Environment Configuration](#environment-configuration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Monitoring & Logging](#monitoring--logging)
7. [Performance Tuning](#performance-tuning)
8. [Disaster Recovery](#disaster-recovery)
9. [Post-Deployment Validation](#post-deployment-validation)
10. [Troubleshooting](#troubleshooting)

---

## 1. Pre-Deployment Checklist

### Required Infrastructure
- [ ] Database: MongoDB Atlas (production) or self-managed MongoDB with replication
- [ ] Cloud Platform: AWS/GCP/Azure account with billing enabled
- [ ] Container Registry: Docker Hub, ECR, GCR, or ACR
- [ ] CDN: CloudFront, Cloud CDN, or similar for static assets
- [ ] SSL/TLS Certificates: Valid HTTPS certificates (not self-signed)
- [ ] Monitoring: CloudWatch, Stackdriver, or similar
- [ ] Backup Storage: S3, GCS, or similar for backups

### Credentials to Prepare
- [ ] MongoDB Atlas credentials and connection string
- [ ] JWT_SECRET (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] API Keys:
  - [ ] Gemini API Key (Google Cloud Console)
  - [ ] Cloudinary API credentials
  - [ ] Firebase project credentials
  - [ ] Infura API Key for blockchain
- [ ] Private Key for blockchain transactions (store in secret manager)
- [ ] Domain names and SSL certificates

### Code Quality Checks
- [ ] All tests passing: `npm run test` (server)
- [ ] Build succeeds: `npm run build:prod` (client)
- [ ] No critical vulnerabilities: `npm audit` (both directories)
- [ ] ESLint/code quality checks passed
- [ ] Documentation updated

---

## 2. Security Hardening

### 2.1 Environment Variables
✓ **DO**
- Use environment variables for all secrets
- Store secrets in a secret manager (Google Secret Manager, AWS Secrets Manager, HashiCorp Vault)
- Use `.env.production.example` as a template
- Rotate secrets quarterly
- Use different credentials for development, staging, and production

✗ **DON'T**
- Commit `.env` files with real credentials
- Use default passwords in production
- Share secrets via email or chat
- Log sensitive information in production
- Use the same secrets across environments

### 2.2 Database Security
```bash
# Enable MongoDB authentication and encryption
# Use IP whitelist for database access
# Enable MongoDB point-in-time recovery for backups
# Set up automated backups (daily)
# Use connection pooling: maxPoolSize=10, minPoolSize=5
```

### 2.3 API Security
- ✓ Enable CORS with specific domains only
- ✓ Use HTTPS/TLS everywhere
- ✓ Enable rate limiting (enforced when NODE_ENV=production)
- ✓ Use helmet.js for HTTP headers security
- ✓ Implement API key rotation for external services
- ✓ Add request logging and monitoring

### 2.4 Blockchain Security
```js
// Environment variables for blockchain
BLOCKCHAIN_PRIVATE_KEY=  // Use Secret Manager, NEVER in code
SEPOLIA_RPC_URL=        // Use dedicated RPC endpoint
CONTRACT_ADDRESS=       // Verified on-chain address

// Best practices:
// - Use hardware wallet for signing in production
// - Monitor contract state changes
// - Implement transaction verification
// - Use multi-signature for admin actions
```

---

## 3. Environment Configuration

### 3.1 Create Production Environment File

```bash
# DO NOT use .env file in production
# Instead, use your cloud platform's secret manager

# For Google Cloud Run:
gcloud run deploy product-tracibility-backend \
  --set-env-vars NODE_ENV=production \
  --set-env-vars PORT=8080 \
  --update-secrets MONGODB_URI=mongodb-uri:latest \
  --update-secrets JWT_SECRET=jwt-secret:latest \
  --update-secrets GEMINI_API_KEY=gemini-api-key:latest
```

### 3.2 Environment Variables Reference

**Required for Production:**
```env
NODE_ENV=production
PORT=8080
MONGODB_URI=[From MongoDB Atlas]
JWT_SECRET=[Generated strong secret]
CONTRACT_ADDRESS=[Deployed contract address]
CORS_ALLOWED_ORIGINS=[Your domain(s)]
TRUST_PROXY=true
```

**Optional but Recommended:**
```env
GEMINI_API_KEY=[Google Cloud]
CLOUDINARY_CLOUD_NAME=[Your Cloudinary account]
CLOUDINARY_API_KEY=[Your Cloudinary key]
CLOUDINARY_API_SECRET=[Your Cloudinary secret]
```

**Admin Bootstrap (DISABLE AFTER SETUP):**
```env
ADMIN_BOOTSTRAP_ENABLED=false  # Set to false after first run
ADMIN_BOOTSTRAP_EMAIL=admin@yourdomain.com
ADMIN_BOOTSTRAP_PASSWORD=[Strong password]
```

---

## 4. Backend Deployment

### 4.1 Docker Build and Push

```bash
cd server

# Build Docker image
docker build -t youregistry/product-tracibility-backend:latest .
docker build -t youregistry/product-tracibility-backend:v1.0.0 .

# Push to registry
docker push youregistry/product-tracibility-backend:latest
docker push youregistry/product-tracibility-backend:v1.0.0

# Test image locally
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e MONGODB_URI=your-mongodb-uri \
  -e JWT_SECRET=your-jwt-secret \
  youregistry/product-tracibility-backend:latest
```

### 4.2 Deploy to Google Cloud Run

```bash
gcloud run deploy product-tracibility-backend \
  --image youregistry/product-tracibility-backend:latest \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 10 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=8080
```

### 4.3 Deploy to AWS App Runner / ECS Fargate

```bash
# Using AWS CLI
aws apprunner create-service \
  --service-name product-tracibility-backend \
  --source-configuration ImageRepository="{RepositoryArn=your-ecr-arn,ImageTag=latest}" \
  --cpu 1024 \
  --memory 2048 \
  --health-check-configuration Protocol=HTTP,Path=/api/health,Interval=10,Timeout=5,HealthyThreshold=1,UnhealthyThreshold=5
```

### 4.4 Post-Deployment Verification

```bash
# Check health endpoint
curl https://your-backend-domain/api/health

# Verify database connection
curl https://your-backend-domain/api/db-test

# Monitor logs
# Google Cloud: gcloud run logs read product-tracibility-backend
# AWS: aws logs tail /aws/apprunner/product-tracibility-backend --follow
```

---

## 5. Frontend Deployment

### 5.1 Build Production Bundle

```bash
cd client

# Build with production settings
npm run build:prod

# Analyze bundle size
npm run build:analyze

# Expected output:
# - build/ folder with optimized assets
# - Static assets should be gzipped
# - Main bundle: ~170KB gzipped
# - Total: ~1.8MB uncompressed
```

### 5.2 Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
cd client
npm run build:prod
netlify deploy --prod --dir=build

# Configure in Netlify UI:
# - Build command: npm run build:prod
# - Publish directory: build
# - Environment variables: REACT_APP_API_URL, REACT_APP_FIREBASE_*
```

### 5.3 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Or push to GitHub and connect repository to Vercel
```

### 5.4 Deploy to Cloud Storage + CDN

```bash
# Build app
npm run build:prod

# Upload to Google Cloud Storage
gsutil -m cp -r build/* gs://your-bucket/

# Or upload to AWS S3
aws s3 sync build/ s3://your-bucket/ --delete

# Configure CloudFront / Cloud CDN:
# - Origin: Your storage bucket
# - Cache TTL: 86400s (24 hours) for static assets
# - Compression: gzip, brotli enabled
# - HTTP/2 Push enabled
```

### 5.5 Environment Configuration for Frontend

Create `.env.production` in client directory:

```env
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_FIREBASE_API_KEY=your-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

---

## 6. Monitoring & Logging

### 6.1 Set Up Application Monitoring

```javascript
// Application Performance Monitoring (APM)
// Google Cloud: Cloud Trace, Cloud Profiler
// AWS: X-Ray, CloudWatch
// DataDog, New Relic, or Sentry

// Example with Google Cloud:
const cloudTrace = require('@google-cloud/trace-agent');
cloudTrace.start();
```

### 6.2 Configure Logging

The application uses a production-safe logger (`server/utils/logger.js`):

```bash
# Enable debug logging (development only)
DEBUG_LOGS=true npm start

# Production logs are JSON formatted for easy parsing
# Example:
{"timestamp":"2026-05-09 10:30:45","level":"info","message":"User logged in"}

# Aggregate logs with:
# - Google Cloud Logging (stackdriver)
# - AWS CloudWatch Logs
# - ELK Stack (Elasticsearch, Logstash, Kibana)
# - Datadog, Splunk, or similar
```

### 6.3 Set Up Alerts

```yaml
# Example alert rules:
- High error rate: > 1% errors in 5 min
- Database connection failures: > 0 in 1 min
- Response time: > 2 seconds (p95)
- Memory usage: > 80%
- Disk usage: > 90%
- Failed authentication attempts: > 10 in 5 min
```

### 6.4 Enable Security Monitoring

```bash
# Monitor:
# - Failed login attempts
# - Unusual API access patterns
# - Large data exports
# - Admin account changes
# - Rate limiting violations
```

---

## 7. Performance Tuning

### 7.1 Database Optimization

```javascript
// MongoDB optimization
// - Enable indexing on frequently queried fields
// - Use connection pooling
// - Set appropriate batch sizes
// - Monitor query performance with slow query log

// Example indexes:
db.products.createIndex({ "productId": 1 })
db.products.createIndex({ "stage": 1 })
db.products.createIndex({ "createdAt": -1 })
db.users.createIndex({ "email": 1 }, { unique: true })
```

### 7.2 Caching Strategy

```javascript
// Implement Redis or Memcached for:
// - Session storage
// - API response caching
// - Database query caching
// - Rate limit counters

// Example (Redis):
const redis = require('redis');
const client = redis.createClient({
  host: 'your-redis-host',
  port: 6379,
  password: 'your-password',
  tls: true
});
```

### 7.3 Frontend Performance

```bash
# Production bundle already optimized with:
# - Code splitting
# - Lazy loading
# - Tree shaking
# - Gzip/Brotli compression
# - Image optimization

# Additional optimizations:
# - Enable service workers
# - Implement HTTP/2 Server Push
# - Use WebP for images
# - Minify CSS/JS
# - Remove source maps from production
```

### 7.4 API Rate Limiting

```javascript
// Already enabled in production (see server/index.js):
// - 100 requests per 15 minutes per IP
// - Can be adjusted based on load testing

// For high-traffic scenarios:
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  // Use Redis for distributed rate limiting
  store: new RedisStore({
    client: redis,
    prefix: 'rl:'
  })
});
```

---

## 8. Disaster Recovery

### 8.1 Backup Strategy

```bash
# MongoDB Backups (automated daily)
# - Full backup: Daily, retained for 30 days
# - Incremental: Every 6 hours
# - Test restore procedure weekly

# Backup command:
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/database" \
  --out ./backup-$(date +%Y%m%d)

# Restore command:
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net" \
  ./backup-20260509
```

### 8.2 Version Control & Rollback

```bash
# Use semantic versioning for releases
# Tag releases in git
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0

# Roll back to previous version
git checkout v0.9.9
docker build -t youregistry/app:v0.9.9 .
# Redeploy with previous image
```

### 8.3 Data Recovery Plan

```plaintext
Recovery Time Objective (RTO): 4 hours
Recovery Point Objective (RPO): 1 hour

Procedures:
1. Database failure: Restore from latest backup (< 1 hour old)
2. Storage failure: Restore from cloud storage backups
3. Full site outage: Deploy to backup region
4. Data corruption: Restore from point-in-time backup
```

---

## 9. Post-Deployment Validation

### 9.1 Health Checks

```bash
# Check backend health
curl https://your-api-domain/api/health

# Check database
curl https://your-api-domain/api/db-test

# Check frontend
curl https://your-app-domain/ | head -20
```

### 9.2 Functional Testing

```bash
# Test critical user flows:
# 1. User registration and login
# 2. Product creation
# 3. QR code generation and scanning
# 4. Admin dashboard access
# 5. AI chat functionality
# 6. Document upload and storage
```

### 9.3 Performance Testing

```bash
# Run load tests
npm install -g artillery

# Create load test file: load-test.yml
artillery quick --count 50 --num 100 https://your-api-domain/api/products

# Expected results:
# - p95 latency < 2 seconds
# - Error rate < 1%
# - Throughput > 100 req/sec
```

### 9.4 Security Testing

```bash
# Run security audit
npm audit
npm audit --production

# Test CORS configuration
curl -H "Origin: https://untrusted-domain.com" \
  -v https://your-api-domain/api/products

# Test authentication
curl -H "Authorization: Bearer invalid-token" \
  https://your-api-domain/api/admin/dashboard
```

---

## 10. Troubleshooting

### Common Issues and Solutions

**Issue: "Database connection timeout"**
```
Solution:
1. Check MongoDB URI in environment variables
2. Verify IP whitelist in MongoDB Atlas
3. Check VPC/security group settings
4. Increase connection timeout: MONGODB_CONNECT_TIMEOUT_MS=10000
```

**Issue: "Blank/500 error on frontend"**
```
Solution:
1. Check REACT_APP_API_URL environment variable
2. Verify CORS configuration
3. Check browser console for errors
4. Verify API is responding: curl /api/health
```

**Issue: "Rate limiting blocking valid requests"**
```
Solution:
1. Check IP trust proxy settings (TRUST_PROXY)
2. Adjust rate limits based on actual traffic
3. Use Redis-based rate limiting for distributed systems
4. Add IP whitelist for trusted services
```

**Issue: "Out of memory errors"**
```
Solution:
1. Increase Node.js heap: NODE_OPTIONS=--max-old-space-size=2048
2. Check for memory leaks with profiler
3. Optimize database queries
4. Enable clustering for multi-core usage
```

**Issue: "Bundle size warnings"**
```
Solution:
1. These are warnings, not errors - app will work fine
2. Lazy load heavy libraries (Three.js is already lazy-loaded)
3. Use dynamic imports: const lib = await import('library')
4. Monitor with: npm run build:analyze
```

---

## 11. Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Security updates | Weekly | DevOps |
| Dependency updates | Monthly | Engineering |
| Database backup verification | Weekly | DBA |
| Load testing | Quarterly | QA |
| Security audit | Quarterly | Security |
| Disaster recovery drill | Semi-annually | DevOps |
| Certificate renewal | As needed (60 days before expiry) | DevOps |

---

## 12. Contacts & Escalation

- **DevOps Lead**: [Contact info]
- **Database Admin**: [Contact info]
- **Security Team**: [Contact info]
- **On-Call Engineer**: [Escalation procedure]

---

## Quick Reference Commands

```bash
# Backend deployment (Google Cloud Run)
cd server
docker build -t product-tracibility-backend:v1.0.0 .
docker tag product-tracibility-backend:v1.0.0 gcr.io/PROJECT_ID/product-tracibility-backend:v1.0.0
docker push gcr.io/PROJECT_ID/product-tracibility-backend:v1.0.0
gcloud run deploy product-tracibility-backend --image gcr.io/PROJECT_ID/product-tracibility-backend:v1.0.0

# Frontend deployment (Netlify)
cd client
npm run build:prod
netlify deploy --prod --dir=build

# Check logs
gcloud run logs read product-tracibility-backend --limit=50 --follow

# Rollback deployment
gcloud run deploy product-tracibility-backend --image gcr.io/PROJECT_ID/product-tracibility-backend:previous-version
```

---

**Last Updated**: 2026-05-09
**Document Version**: 1.0.0
**Status**: Production Ready

#!/bin/bash
# Quick deployment script for Product Traceability System to GCP

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Product Traceability - GCP Deployment Script${NC}"
echo "=================================================="

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Install from https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Install from https://docker.com${NC}"
    exit 1
fi

if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found. Run: npm install -g firebase-tools${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites installed${NC}"

# Get GCP Project ID
read -p "Enter your GCP Project ID: " PROJECT_ID
read -p "Enter your GCP Region (default: asia-south1): " REGION
REGION=${REGION:-asia-south1}

echo -e "\n${YELLOW}Setting up GCP project...${NC}"
gcloud config set project $PROJECT_ID
gcloud auth configure-docker gcr.io

# Deploy Backend
echo -e "\n${YELLOW}📦 Building and deploying backend...${NC}"
cd server

# Build Docker image
SERVICE_NAME="product-tracibility-backend"
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .

# Push to GCR
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Deploy to Cloud Run
echo -e "\n${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --no-gen2

# Get the backend URL
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')
echo -e "\n${GREEN}✅ Backend deployed!${NC}"
echo -e "Backend URL: ${YELLOW}$BACKEND_URL${NC}"

cd ..

# Deploy Frontend
echo -e "\n${YELLOW}🎨 Building frontend...${NC}"
cd client
npm run build

cd ..

echo -e "\n${YELLOW}Deploying frontend to Firebase...${NC}"
# Update firebase.json with project ID
sed -i.bak "s/YOUR_FIREBASE_PROJECT_ID/$PROJECT_ID/g" firebase.json

firebase deploy --only hosting

echo -e "\n${GREEN}✅ Frontend deployed!${NC}"

# Get Firebase URL
FIREBASE_URL=$(firebase hosting:sites:list | grep -o 'https://[^[:space:]]*')
echo -e "Frontend URL: ${YELLOW}$FIREBASE_URL${NC}"

# Summary
echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================================="
echo -e "Backend:  ${YELLOW}$BACKEND_URL${NC}"
echo -e "Frontend: ${YELLOW}$FIREBASE_URL${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update environment variables in Cloud Run console"
echo "2. Add CORS_ALLOWED_ORIGINS=$FIREBASE_URL to backend"
echo "3. Test API connectivity"
echo "4. Check browser console for any errors"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "View backend logs: gcloud run logs read $SERVICE_NAME --limit 50"
echo "Update backend env: gcloud run services update $SERVICE_NAME --update-env-vars KEY=VALUE"
echo "Redeploy frontend: firebase deploy --only hosting"
echo ""

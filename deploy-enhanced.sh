#!/bin/bash

# Enhanced Netlify Deployment Script
# This script ensures a clean, consistent build for deployment

echo "🚀 Starting enhanced deployment process..."

# Clean up any previous builds and caches
echo "🧹 Cleaning previous builds and caches..."
rm -rf node_modules
rm -rf build
rm -rf .cache
rm -rf package-lock.json

# Clear npm cache
echo "🗑️ Clearing npm cache..."
npm cache clean --force

# Install dependencies with legacy peer deps for compatibility
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Verify environment variables
echo "🔍 Verifying environment variables..."
echo "NODE_ENV: $NODE_ENV"
echo "REACT_APP_API_URL: $REACT_APP_API_URL"
echo "PUBLIC_URL: $PUBLIC_URL"

# Build the application
echo "🔨 Building application..."
npm run build

# Verify build output
echo "✅ Build verification..."
if [ -f "build/index.html" ]; then
    echo "✅ index.html exists"
else
    echo "❌ index.html missing"
    exit 1
fi

if [ -d "build/static/js" ]; then
    echo "✅ JavaScript files exist"
    ls -la build/static/js/ | grep main
else
    echo "❌ JavaScript files missing"
    exit 1
fi

if [ -d "build/static/css" ]; then
    echo "✅ CSS files exist"
    ls -la build/static/css/ | grep main
else
    echo "❌ CSS files missing"
    exit 1
fi

echo "🎉 Deployment build completed successfully!"

#!/bin/bash

# Enhanced build script for fixing chunk loading issues
echo "🚀 Starting enhanced build process..."

# Navigate to client directory
cd client

# Clean up previous builds and dependencies
echo "🧹 Cleaning up previous builds..."
rm -rf node_modules
rm -rf build
rm -rf .next
rm -f package-lock.json

# Install dependencies with legacy peer deps to avoid conflicts
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Set environment variables for stable build
export GENERATE_SOURCEMAP=false
export CI=false
export NODE_OPTIONS="--max-old-space-size=4096"

# Build the application
echo "🔨 Building application..."
npm run build

# Verify build output
echo "✅ Build completed. Verifying output..."

if [ -d "build" ]; then
    echo "✅ Build directory exists"
    
    if [ -f "build/index.html" ]; then
        echo "✅ index.html exists"
    else
        echo "❌ index.html missing"
        exit 1
    fi
    
    if [ -d "build/static" ]; then
        echo "✅ Static assets directory exists"
        
        # Count JS chunks
        js_count=$(find build/static/js -name "*.js" | wc -l)
        echo "📊 Found $js_count JavaScript files"
        
        # List all chunk files for verification
        echo "📋 JavaScript chunks:"
        ls -la build/static/js/*.js | head -10
        
        if [ $js_count -gt 0 ]; then
            echo "✅ JavaScript chunks generated successfully"
        else
            echo "❌ No JavaScript chunks found"
            exit 1
        fi
    else
        echo "❌ Static assets directory missing"
        exit 1
    fi
    
    # Check _redirects file
    if [ -f "build/_redirects" ]; then
        echo "✅ _redirects file exists"
    else
        echo "⚠️ _redirects file missing - copying from public/"
        cp public/_redirects build/
    fi
    
    echo "🎉 Build verification completed successfully!"
    echo "📁 Build size:"
    du -sh build/
    
else
    echo "❌ Build failed - build directory not found"
    exit 1
fi

echo "✅ Enhanced build process completed successfully!"

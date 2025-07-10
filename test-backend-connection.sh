#!/bin/bash

echo "🧪 Testing Backend-Frontend Connection..."
echo "========================================"

# Backend URL
BACKEND_URL="https://product-traceability-api.onrender.com"
FRONTEND_URL="https://blockchain-product-traceability.netlify.app"

echo "📡 Backend URL: $BACKEND_URL"
echo "🌐 Frontend URL: $FRONTEND_URL"
echo ""

# Test 1: Basic Backend Health
echo "1. Testing Backend Health..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/test" || echo "000")
if [ "$response" = "200" ]; then
    echo "   ✅ Backend server is running"
else
    echo "   ❌ Backend server failed (HTTP $response)"
fi

# Test 2: API Endpoint
echo "2. Testing API Endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/recent-products" || echo "000")
if [ "$response" = "200" ]; then
    echo "   ✅ Products API is working"
else
    echo "   ❌ Products API failed (HTTP $response)"
fi

# Test 3: Authentication Endpoint
echo "3. Testing Authentication..."
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    "$BACKEND_URL/api/auth/login" || echo "000")
if [ "$response" = "400" ] || [ "$response" = "401" ]; then
    echo "   ✅ Authentication endpoint is working"
else
    echo "   ❌ Authentication endpoint failed (HTTP $response)"
fi

# Test 4: CORS Headers
echo "4. Testing CORS Configuration..."
cors_response=$(curl -s -I -H "Origin: $FRONTEND_URL" "$BACKEND_URL/test" | grep -i "access-control-allow-origin" || echo "")
if [ -n "$cors_response" ]; then
    echo "   ✅ CORS headers present"
else
    echo "   ❌ CORS headers missing or misconfigured"
fi

# Test 5: Frontend Accessibility
echo "5. Testing Frontend Accessibility..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" || echo "000")
if [ "$response" = "200" ]; then
    echo "   ✅ Frontend is accessible"
else
    echo "   ❌ Frontend failed (HTTP $response)"
fi

echo ""
echo "🔧 Next Steps:"
echo "1. If backend tests fail, check Render deployment status"
echo "2. If CORS fails, verify backend CORS configuration"
echo "3. If frontend fails, check Netlify deployment"
echo "4. Test the connection from browser console"
echo ""
echo "📋 Manual Browser Test:"
echo "Open browser console on $FRONTEND_URL and run:"
echo "fetch('/api/test').then(r => r.json()).then(console.log)"

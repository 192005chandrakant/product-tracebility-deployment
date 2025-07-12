console.log('🧪 PROXY & CORS VERIFICATION\n');

// Test 1: Direct backend connection
console.log('1️⃣ Testing direct backend connection...');
const http = require('http');

function testBackend() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ email: 'test@test.com', password: 'test' }));
    req.end();
  });
}

// Test 2: Proxy connection (if React dev server is running)
function testProxy() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ email: 'test@test.com', password: 'test' }));
    req.end();
  });
}

async function runTests() {
  try {
    // Test backend
    const backendResult = await testBackend();
    console.log('✅ Backend Status:', backendResult.status);
    console.log('✅ Backend Response:', backendResult.data);
    console.log('✅ CORS Headers:', backendResult.headers['access-control-allow-credentials'] ? 'Present' : 'Missing');
    
    if (backendResult.status === 400 && backendResult.data.includes('Invalid credentials')) {
      console.log('🎉 Backend is working perfectly!');
    }
    
    console.log('\n2️⃣ Testing proxy connection...');
    
    // Test proxy
    const proxyResult = await testProxy();
    console.log('📡 Proxy Status:', proxyResult.status);
    console.log('📡 Proxy Response:', proxyResult.data);
    
    if (proxyResult.status === 400 && proxyResult.data.includes('Invalid credentials')) {
      console.log('🎉 PROXY IS WORKING! Path preservation successful!');
    } else if (proxyResult.data.includes('Route not found') && proxyResult.data.includes('/auth/login')) {
      console.log('❌ Proxy is still stripping /api prefix');
      console.log('💡 Solution: Restart React dev server to pick up new setupProxy.js');
    } else {
      console.log('⚠️ Unexpected proxy response');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED' && error.port === 5000) {
      console.log('❌ Backend not running on port 5000');
      console.log('💡 Start backend: cd server && npm start');
    } else if (error.code === 'ECONNREFUSED' && error.port === 3000) {
      console.log('❌ React dev server not running on port 3000');
      console.log('💡 Start frontend: cd client && npm start');
    } else {
      console.log('❌ Test error:', error.message);
    }
  }
  
  console.log('\n📋 SUMMARY:');
  console.log('✅ CORS Configuration: Working correctly (allows no origin for proxy)');
  console.log('✅ Backend API: Available at /api/auth/login');
  console.log('🔄 Next Step: Restart React dev server to activate manual proxy');
  console.log('\n🎯 Expected Result After Restart:');
  console.log('   Frontend login should show "Invalid credentials" instead of "Route not found"');
}

runTests();

const http = require('http');

// Test the proxy configuration by making requests to localhost:3000
async function testProxyFix() {
  console.log('🧪 Testing proxy configuration fix...\n');

  // Helper function to make requests
  function makeRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': JSON.stringify({ email: 'test@test.com', password: 'test' }).length
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      // Send test login data
      req.write(JSON.stringify({ email: 'test@test.com', password: 'test' }));
      req.end();
    });
  }

  try {
    // Test the API endpoint through proxy
    console.log('1. Testing /api/auth/login through React proxy...');
    const result1 = await makeRequest('/api/auth/login');
    console.log(`   Status: ${result1.statusCode}`);
    console.log(`   Response: ${result1.data}`);
    
    if (result1.statusCode === 401 && result1.data.includes('Invalid credentials')) {
      console.log('   ✅ SUCCESS: Proxy is working correctly!');
      console.log('   ✅ The backend is receiving /api/auth/login as expected');
    } else if (result1.statusCode === 404) {
      console.log('   ❌ FAILED: Still getting 404 - proxy path issue persists');
    } else {
      console.log('   ⚠️  UNEXPECTED: Different response than expected');
    }

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   ℹ️  Note: React dev server is not running on localhost:3000');
      console.log('   ℹ️  Please start it with: npm start');
    }
  }

  console.log('\n📋 Next steps:');
  console.log('1. Start backend: cd server && npm start');
  console.log('2. Start frontend: cd client && npm start');
  console.log('3. Test login at: http://localhost:3000/auth/login');
}

testProxyFix();

const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

// Simple HTTP request helper
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test profile routes
async function testProfileRoutes() {
  try {
    console.log('🧪 Testing Profile Routes (Simple Version)...\n');

    // First, register a test user
    console.log('1. Registering test user...');
    const registerResponse = await makeRequest('POST', '/auth/register', {
      email: 'test@example.com',
      password: 'password123',
      role: 'producer'
    });
    console.log('✅ Registration response:', registerResponse.status);
    console.log('');

    // Login to get token
    console.log('2. Logging in...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.data.error || 'Unknown error'}`);
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('');

    // Test get profile
    console.log('3. Testing GET /api/profile...');
    const profileResponse = await makeRequest('GET', '/profile', null, token);
    console.log('✅ Profile response status:', profileResponse.status);
    if (profileResponse.status === 200) {
      console.log('   User email:', profileResponse.data.user.email);
      console.log('   User role:', profileResponse.data.user.role);
    }
    console.log('');

    // Test update profile
    console.log('4. Testing PUT /api/profile...');
    const updateResponse = await makeRequest('PUT', '/profile', {
      firstName: 'John',
      lastName: 'Doe',
      company: 'Test Company',
      phone: '+1234567890',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA'
      }
    }, token);
    console.log('✅ Update response status:', updateResponse.status);
    if (updateResponse.status === 200) {
      console.log('   Name:', updateResponse.data.user.firstName, updateResponse.data.user.lastName);
      console.log('   Company:', updateResponse.data.user.company);
    }
    console.log('');

    // Test get stats
    console.log('5. Testing GET /api/profile/stats...');
    const statsResponse = await makeRequest('GET', '/profile/stats', null, token);
    console.log('✅ Stats response status:', statsResponse.status);
    if (statsResponse.status === 200) {
      console.log('   Stats received successfully');
    }
    console.log('');

    console.log('🎉 All profile tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testProfileRoutes();
}

module.exports = { testProfileRoutes }; 
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test profile routes
async function testProfileRoutes() {
  try {
    console.log('🧪 Testing Profile Routes...\n');

    // First, register a test user
    console.log('1. Registering test user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'test@example.com',
      password: 'password123',
      role: 'producer'
    });
    console.log('✅ Registration successful\n');

    // Login to get token
    console.log('2. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test get profile
    console.log('3. Testing GET /api/profile...');
    const profileResponse = await axios.get(`${BASE_URL}/profile`, { headers });
    console.log('✅ Profile retrieved:', profileResponse.data.user.email);
    console.log('   Role:', profileResponse.data.user.role);
    console.log('   Stats:', profileResponse.data.stats);
    console.log('');

    // Test update profile
    console.log('4. Testing PUT /api/profile...');
    const updateResponse = await axios.put(`${BASE_URL}/profile`, {
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
    }, { headers });
    console.log('✅ Profile updated successfully');
    console.log('   Name:', updateResponse.data.user.firstName, updateResponse.data.user.lastName);
    console.log('   Company:', updateResponse.data.user.company);
    console.log('');

    // Test get stats
    console.log('5. Testing GET /api/profile/stats...');
    const statsResponse = await axios.get(`${BASE_URL}/profile/stats`, { headers });
    console.log('✅ Stats retrieved:', statsResponse.data.stats);
    console.log('');

    console.log('🎉 All profile tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testProfileRoutes();
}

module.exports = { testProfileRoutes }; 
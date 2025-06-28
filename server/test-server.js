const fetch = require('node-fetch');

async function testServer() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🧪 Testing server endpoints...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1. Testing server status...');
    const statusResponse = await fetch(`${baseUrl}/test`);
    const statusData = await statusResponse.json();
    console.log('✅ Server status:', statusData);
    
    // Test 2: Test registration endpoint
    console.log('\n2. Testing registration endpoint...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        role: 'producer'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('📝 Registration response:', registerData);
    console.log('📊 Status:', registerResponse.status);
    
    // Test 3: Test login endpoint
    console.log('\n3. Testing login endpoint...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('🔐 Login response:', loginData);
    console.log('📊 Status:', loginResponse.status);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testServer(); 
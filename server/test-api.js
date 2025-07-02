// Test script for API endpoints
import fetch from 'node-fetch';

const baseURL = 'http://localhost:5000';

const testAPI = async () => {
  try {
    console.log('🔍 Testing API endpoints...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);

    // Test user registration
    console.log('\n2. Testing user registration...');
    const registerData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      full_name: 'Test User',
      role: 'smoker'
    };

    const registerResponse = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    });
    
    const registerResult = await registerResponse.json();
    console.log('📝 Register:', registerResult);

    // Test packages endpoint
    console.log('\n3. Testing packages endpoint...');
    const packagesResponse = await fetch(`${baseURL}/api/packages`);
    const packagesData = await packagesResponse.json();
    console.log('📦 Packages:', packagesData);

  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
};

testAPI();

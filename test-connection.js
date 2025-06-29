// const axios = require('axios');

async function testBackend() {
  try {
    console.log('Testing backend connection...');
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    console.log('✅ Backend is running!');
    console.log('Response:', data);
    return true;
  } catch (error) {
    console.log('❌ Backend is not running:');
    console.log('Error:', error.message);
    return false;
  }
}

async function testFrontend() {
  try {
    console.log('Testing frontend connection...');
    const response = await fetch('http://localhost:5176');
    console.log('✅ Frontend is running!');
    return true;
  } catch (error) {
    try {
      // Try port 5175 as fallback
      const response = await fetch('http://localhost:5175');
      console.log('✅ Frontend is running on port 5175!');
      return true;
    } catch (error2) {
      console.log('❌ Frontend is not running on either port 5175 or 5176:');
      console.log('Error:', error.message);
      return false;
    }
  }
}

async function testFullConnection() {
  console.log('🔍 Testing fullstack application connection...\n');
  
  const backendOk = await testBackend();
  console.log('');
  const frontendOk = await testFrontend();
  
  console.log('\n📋 Connection Summary:');
  console.log(`Backend (port 5000): ${backendOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Frontend (port 5175/5176): ${frontendOk ? '✅ OK' : '❌ FAILED'}`);
  
  if (backendOk && frontendOk) {
    console.log('\n🎉 Both services are running! You can now test the connection.');
    console.log('Frontend URL: http://localhost:5176 or http://localhost:5175');
    console.log('Backend API: http://localhost:5000/api');
  } else {
    console.log('\n⚠️  Some services are not running. Please start them manually.');
  }
}

testFullConnection();

/**
 * Test script để kiểm tra coach appointments API
 */

// Test với coach credentials
const TEST_COACH = {
  username: 'CoachGiaMan', // Từ test trước, coach ID 4
  password: 'password123' // Thử password phổ biến
};

async function testCoachLogin() {
  try {
    console.log('🔐 Testing coach login...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_COACH)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Login failed:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    console.log('✅ Coach login successful');
    console.log('👤 User:', result.data?.user || result.user);
    console.log('🔑 Token:', result.data?.token ? 'Received' : 'Missing');
    
    return result.data?.token || result.token;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

async function testCoachAppointmentsAPI(token) {
  try {
    console.log('\n🔍 Testing coach appointments API...');
    
    const response = await fetch('http://localhost:5000/api/appointments/coach', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API call failed:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Coach appointments API response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.data && Array.isArray(data.data)) {
      console.log(`📋 Found ${data.data.length} appointments`);
      if (data.data.length > 0) {
        console.log('📅 Sample appointment:', data.data[0]);
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ API test error:', error.message);
  }
}

async function runTest() {
  console.log('🚀 Starting coach appointments API test...');
  
  // Step 1: Login as coach
  const token = await testCoachLogin();
  if (!token) {
    console.log('❌ Cannot proceed without valid token');
    console.log(`
💡 To fix login issues:
1. Make sure coach account exists: username="${TEST_COACH.username}"
2. Update password in this script
3. Check server is running on http://localhost:5000
    `);
    return;
  }
  
  // Step 2: Test appointments API
  await testCoachAppointmentsAPI(token);
  
  console.log(`
📋 Next steps:
1. If API works but frontend doesn't, check frontend auth token storage
2. If API returns empty array, create test appointments
3. Update frontend to use correct response structure
  `);
}

runTest().catch(console.error);

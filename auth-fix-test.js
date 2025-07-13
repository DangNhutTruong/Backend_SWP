/**
 * Authentication Fix Test Script
 * Run this script to debug and fix authentication issues
 */

console.log('🔧 Starting Authentication Fix Test...');

// Test 1: Check all token storage locations
console.log('\n📍 Test 1: Checking token storage locations...');
const tokenLocations = [
  { name: 'localStorage.nosmoke_token', value: localStorage.getItem('nosmoke_token') },
  { name: 'localStorage.token', value: localStorage.getItem('token') },
  { name: 'sessionStorage.nosmoke_token', value: sessionStorage.getItem('nosmoke_token') },
  { name: 'sessionStorage.token', value: sessionStorage.getItem('token') }
];

let hasValidToken = false;
tokenLocations.forEach(location => {
  if (location.value) {
    console.log(`✅ ${location.name}: ${location.value.substring(0, 20)}...`);
    hasValidToken = true;
  } else {
    console.log(`❌ ${location.name}: null`);
  }
});

if (!hasValidToken) {
  console.error('🚨 PROBLEM: No authentication tokens found!');
  console.log('💡 SOLUTION: User needs to login');
} else {
  console.log('✅ Authentication tokens found');
}

// Test 2: Check user data
console.log('\n📍 Test 2: Checking user data...');
const userLocations = [
  { name: 'localStorage.nosmoke_user', value: localStorage.getItem('nosmoke_user') },
  { name: 'sessionStorage.nosmoke_user', value: sessionStorage.getItem('nosmoke_user') }
];

let hasValidUser = false;
userLocations.forEach(location => {
  if (location.value) {
    try {
      const userData = JSON.parse(location.value);
      console.log(`✅ ${location.name}:`, userData);
      hasValidUser = true;
    } catch (e) {
      console.error(`❌ ${location.name}: Invalid JSON`);
    }
  } else {
    console.log(`❌ ${location.name}: null`);
  }
});

if (!hasValidUser) {
  console.error('🚨 PROBLEM: No user data found!');
  console.log('💡 SOLUTION: User needs to login');
} else {
  console.log('✅ User data found');
}

// Test 3: Test API authentication
console.log('\n📍 Test 3: Testing API authentication...');
async function testApiAuth() {
  try {
    const token = localStorage.getItem('nosmoke_token') || 
                  sessionStorage.getItem('nosmoke_token') ||
                  localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ Cannot test API - no token available');
      return false;
    }
    
    console.log('🔑 Testing with token:', token.substring(0, 20) + '...');
    
    const response = await fetch('http://localhost:5000/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API authentication successful:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ API authentication failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ API test error:', error);
    return false;
  }
}

// Test 4: Test appointment API specifically
console.log('\n📍 Test 4: Testing appointment API...');
async function testAppointmentApi() {
  try {
    const token = localStorage.getItem('nosmoke_token') || 
                  sessionStorage.getItem('nosmoke_token') ||
                  localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ Cannot test appointment API - no token available');
      return false;
    }
    
    console.log('📅 Testing appointment API with token:', token.substring(0, 20) + '...');
    
    const response = await fetch('http://localhost:5000/api/appointments/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Appointment API test successful:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Appointment API test failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Appointment API test error:', error);
    return false;
  }
}

// Run tests
(async () => {
  const apiAuthResult = await testApiAuth();
  const appointmentApiResult = await testAppointmentApi();
  
  console.log('\n📊 === TEST RESULTS ===');
  console.log(`Token Storage: ${hasValidToken ? '✅' : '❌'}`);
  console.log(`User Data: ${hasValidUser ? '✅' : '❌'}`);
  console.log(`API Auth: ${apiAuthResult ? '✅' : '❌'}`);
  console.log(`Appointment API: ${appointmentApiResult ? '✅' : '❌'}`);
  
  if (!hasValidToken || !hasValidUser || !apiAuthResult) {
    console.log('\n🚨 === PROBLEMS DETECTED ===');
    console.log('💡 RECOMMENDED SOLUTIONS:');
    console.log('1. User should logout and login again');
    console.log('2. Check if backend server is running on http://localhost:5000');
    console.log('3. Verify token expiration');
    console.log('4. Clear browser cache and try again');
    
    console.log('\n🔧 === QUICK FIXES ===');
    console.log('Run in console:');
    console.log('window.debugAuthNew.clearAllAuth() // Clear all auth data');
    console.log('// Then navigate to login page');
  } else {
    console.log('\n✅ === ALL TESTS PASSED ===');
    console.log('Authentication is working correctly!');
  }
})();

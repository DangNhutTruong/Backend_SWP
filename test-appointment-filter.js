/**
 * Script để test tính năng filter slot đã đặt
 * Sẽ tạo appointment qua API để demo filter
 */

// Test data - thay đổi theo dữ liệu thực tế của bạn
const TEST_CONFIG = {
  baseURL: 'http://localhost:5000/api',
  // Thay đổi các giá trị này theo dữ liệu thực tế
  userId: 1,  // ID của user để test
  coachId: 5, // ID của coach để test 
  token: 'your_auth_token_here' // Token authentication
};

async function createTestAppointment(date, time) {
  try {
    const response = await fetch(`${TEST_CONFIG.baseURL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.token}`
      },
      body: JSON.stringify({
        coach_id: TEST_CONFIG.coachId,
        appointment_date: date,
        appointment_time: time,
        duration_minutes: 120,
        notes: `Test appointment created for filtering demo - ${time}`
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Created test appointment: ${date} ${time}`);
      return result;
    } else {
      const error = await response.text();
      console.log(`❌ Failed to create appointment ${date} ${time}:`, error);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error creating appointment ${date} ${time}:`, error.message);
    return null;
  }
}

async function testCoachAvailabilityAPI() {
  try {
    console.log('🔍 Testing coach availability API...');
    
    const response = await fetch(`${TEST_CONFIG.baseURL}/coaches/${TEST_CONFIG.coachId}/availability`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.token}`
      }
    });

    if (response.ok) {
      const availability = await response.json();
      console.log('📅 Coach availability data:');
      console.log(JSON.stringify(availability, null, 2));
      
      // Check if booked_appointments are included
      if (availability.length > 0 && availability[0].booked_appointments) {
        console.log('✅ Booked appointments are included in response');
        console.log('📋 Booked appointments:', availability[0].booked_appointments);
      } else {
        console.log('⚠️ Booked appointments not found in response');
      }
      
      return availability;
    } else {
      console.log('❌ Failed to fetch availability:', response.status);
      return null;
    }
  } catch (error) {
    console.log('❌ Error testing availability API:', error.message);
    return null;
  }
}

async function runTest() {
  console.log('🚀 Starting appointment filter test...');
  
  // Get today and tomorrow dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  console.log(`📅 Testing dates: ${todayStr}, ${tomorrowStr}`);
  
  // Test availability API first
  await testCoachAvailabilityAPI();
  
  // Create test appointments (comment out if not needed)
  /*
  console.log('📝 Creating test appointments...');
  
  await createTestAppointment(todayStr, '10:00');
  await createTestAppointment(todayStr, '14:00');  
  await createTestAppointment(tomorrowStr, '16:00');
  
  console.log('✅ Test appointments created!');
  
  // Test availability again to see booked appointments
  console.log('🔍 Testing availability after creating appointments...');
  await testCoachAvailabilityAPI();
  */
  
  console.log(`
📋 Test Instructions:
1. Make sure you have valid auth token in TEST_CONFIG
2. Update userId and coachId in TEST_CONFIG with real values
3. Uncomment the appointment creation part if needed
4. Go to http://localhost:5175 and test booking with coach ID ${TEST_CONFIG.coachId}
5. Check that time slots 10:00-12:00, 14:00-16:00 are hidden on ${todayStr}
6. Check that time slot 16:00-18:00 is hidden on ${tomorrowStr}
  `);
}

// To get auth token and user data, first login via API
async function getAuthToken(username, password) {
  try {
    const response = await fetch(`${TEST_CONFIG.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Login successful');
      console.log('🔑 Token:', result.token);
      console.log('👤 User:', result.user);
      return result;
    } else {
      console.log('❌ Login failed:', response.status);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return null;
  }
}

// Example usage:
// getAuthToken('your_username', 'your_password').then(result => {
//   if (result) {
//     TEST_CONFIG.token = result.token;
//     TEST_CONFIG.userId = result.user.id;
//     runTest();
//   }
// });

runTest();

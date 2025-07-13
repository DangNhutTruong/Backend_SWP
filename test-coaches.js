/**
 * Test để lấy danh sách coaches
 */

async function testGetCoaches() {
  try {
    console.log('🔍 Getting all coaches...');
    
    const response = await fetch('http://localhost:5000/api/coaches');
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Coaches API Response:', JSON.stringify(data, null, 2));
    
    if (data && data.data && Array.isArray(data.data)) {
      console.log(`📋 Found ${data.data.length} coaches:`);
      
      data.data.forEach(coach => {
        console.log(`- ID: ${coach.id}, Name: ${coach.full_name || coach.username}, Role: ${coach.role}`);
      });
      
      // Test availability với coach đầu tiên
      if (data.data.length > 0) {
        const firstCoach = data.data[0];
        console.log(`\n🔍 Testing availability for coach ${firstCoach.id}...`);
        await testCoachAvailability(firstCoach.id);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing coaches API:', error);
  }
}

async function testCoachAvailability(coachId) {
  try {
    const response = await fetch(`http://localhost:5000/api/coaches/${coachId}/availability`);
    
    if (!response.ok) {
      console.error(`❌ Availability API failed for coach ${coachId}:`, response.status);
      return;
    }
    
    const data = await response.json();
    console.log(`✅ Availability for coach ${coachId}:`, JSON.stringify(data, null, 2));
    
    if (data && data.data) {
      const availabilityData = data.data;
      console.log('📋 Structure check:');
      console.log('- working_hours:', availabilityData.working_hours);
      console.log('- available_slots count:', availabilityData.available_slots?.length || 0);
      console.log('- booked_appointments count:', availabilityData.booked_appointments?.length || 0);
    }
    
  } catch (error) {
    console.error(`❌ Error testing availability for coach ${coachId}:`, error);
  }
}

testGetCoaches();

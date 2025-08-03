import { pool } from './src/config/database.js';

async function testAnalyticsAPI() {
  try {
    console.log('=== TESTING ANALYTICS API ===');
    
    // Test analytics endpoint functionality
    const { getAnalytics } = await import('./src/controllers/adminController.js');
    
    // Create mock request/response
    const mockReq = {};
    const mockRes = {
      json: (data) => {
        console.log('Analytics API Response:');
        console.log(JSON.stringify(data, null, 2));
      },
      status: (code) => ({
        json: (data) => {
          console.log(`Error ${code}:`, data);
        }
      })
    };

    await getAnalytics(mockReq, mockRes);
    
  } catch (error) {
    console.error('Error testing analytics API:', error);
  } finally {
    process.exit(0);
  }
}

testAnalyticsAPI();

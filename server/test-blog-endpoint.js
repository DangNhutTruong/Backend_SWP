// Test blog endpoint after server restart
import axios from 'axios';

async function testBlogEndpoint() {
  try {
    console.log('Testing blog endpoint...');
    
    const response = await axios.get('http://localhost:5000/api/admin/blog/posts', {
      headers: { 
        'Authorization': 'Bearer dummy_token' 
      },
      timeout: 5000
    });

    console.log('✅ SUCCESS: Blog endpoint is working!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ HTTP Error:', error.response.status);
      console.log('Error data:', error.response.data);
      if (error.response.status === 401) {
        console.log('✅ Endpoint exists but requires valid auth token');
      }
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

testBlogEndpoint();

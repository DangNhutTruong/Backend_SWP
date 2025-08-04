import axios from 'axios';

async function testBlogEndpoint() {
  try {
    console.log('Testing blog endpoint with detailed error...');
    
    const response = await axios.get('http://localhost:5000/api/admin/blog/posts', {
      headers: { 
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyLCJlbWFpbCI6Imh1eWxxc2UxODIwODJAZnB0LmVkdS52biIsInJvbGUiOiJhZG1pbiIsImlzQWRtaW4iOnRydWUsImlhdCI6MTc1NDI5NzkxMywiZXhwIjoxNzU0Mzg0MzEzfQ.yE64cQcSToyI7O1qGSSNIlFbZVZvkNThPHpJiYOZSFI' 
      },
      timeout: 10000
    });

    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ HTTP Error:', error.response.status);
      console.log('Error data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else {
      console.log('❌ Network/Other Error:', error.message);
    }
  }
}

testBlogEndpoint();

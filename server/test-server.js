// Test if server is running
console.log('Testing server on port 5000...');

fetch('http://localhost:5000/api/health')
.then(response => {
  console.log('Health check status:', response.status);
  if (response.ok) {
    console.log('✅ Server is running on port 5000');
    
    // Test admin blog endpoint
    return fetch('http://localhost:5000/api/admin/blog/posts');
  } else {
    throw new Error('Health check failed');
  }
})
.then(response => {
  console.log('Admin blog endpoint status:', response.status);
  if (response.status === 401) {
    console.log('🔐 Admin endpoint requires authentication (correct)');
  } else if (response.status === 404) {
    console.log('❌ Admin blog endpoint not found');
  } else {
    console.log('Admin endpoint working, status:', response.status);
  }
})
.catch(error => {
  console.error('❌ Server connection failed:', error.message);
  console.log('Please start server with: node server.js');
});

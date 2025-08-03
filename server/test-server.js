// Test if server is running
fetch('http://localhost:3000/api/admin/analytics', {
  headers: {
    'Authorization': 'Bearer test-token'
  }
})
.then(response => {
  console.log('Server status:', response.status);
  return response.text();
})
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.error('Server not running or error:', error);
});

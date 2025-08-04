// Quick test to verify server endpoints
console.log('🔍 Testing admin blog endpoints...');

const testEndpoints = async () => {
  try {
    // Test without auth (should return 401)
    const response = await fetch('http://localhost:5000/api/admin/blog/posts');
    console.log('📊 Blog endpoint status:', response.status);
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists and requires authentication');
    } else if (response.status === 404) {
      console.log('❌ Endpoint not found - server needs restart or routes not loaded');
    } else {
      console.log('🔄 Unexpected status:', response.status);
    }
    
    const text = await response.text();
    console.log('📝 Response:', text);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('💡 Make sure server is running on port 5000');
  }
};

testEndpoints();

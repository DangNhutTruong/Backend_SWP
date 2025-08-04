import { getBlogPosts } from './src/controllers/blogController.js';

console.log('Testing import and execution of getBlogPosts...');

// Mock request and response
const mockReq = {
  query: {
    page: 1,
    limit: 10,
    search: '',
    smoker_id: ''
  }
};

const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log('Response status:', code);
      console.log('Response data:', data);
      return data;
    }
  })
};

// Test function
try {
  await getBlogPosts(mockReq, mockRes);
  console.log('✅ getBlogPosts executed successfully');
} catch (error) {
  console.log('❌ getBlogPosts execution failed:', error.message);
  console.log('Stack trace:', error.stack);
}

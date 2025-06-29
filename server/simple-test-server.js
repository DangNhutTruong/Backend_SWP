import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

console.log('Starting server setup...');

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working!', 
    timestamp: new Date().toISOString()
  });
});

// Test route để kiểm tra database connection sẽ hoạt động
app.get('/api/users', (req, res) => {
  res.json({ 
    message: 'Users API would connect to database here',
    users: [
      { id: 1, username: 'test_user', email: 'test@example.com' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`✅ Simple test server running on port ${PORT}`);
  console.log(`✅ Test URL: http://localhost:${PORT}/api/test`);
  console.log(`✅ Users API: http://localhost:${PORT}/api/users`);
});

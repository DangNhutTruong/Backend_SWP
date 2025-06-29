import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

console.log('🚀 Starting Express server...');

// Middleware
app.use(cors());
app.use(express.json());

console.log('✅ Middleware configured');

// Test routes
app.get('/api/test', (req, res) => {
  console.log('📍 GET /api/test');
  res.json({ 
    message: 'Express server is working!', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/users', (req, res) => {
  console.log('👥 GET /api/users');
  res.json({ 
    message: 'Users API ready (without database for now)',
    users: [
      { id: 1, username: 'test_user', email: 'test@example.com' }
    ]
  });
});

// Database simulation routes để test flow
app.post('/api/auth/register', (req, res) => {
  console.log('📝 POST /api/auth/register', req.body);
  res.json({
    success: true,
    message: 'User registered successfully (simulated)',
    user: {
      id: Date.now(),
      username: req.body.username,
      email: req.body.email
    }
  });
});

app.post('/api/quit-plans', (req, res) => {
  console.log('📅 POST /api/quit-plans', req.body);
  res.json({
    success: true,
    message: 'Plan created successfully (simulated)',
    plan: {
      id: Date.now(),
      userId: req.body.userId,
      targetDate: req.body.targetDate,
      motivation: req.body.motivation
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Express Server running on port ${PORT}`);
  console.log(`📍 Test: http://localhost:${PORT}/api/test`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`📝 Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`📅 Plans: POST http://localhost:${PORT}/api/quit-plans`);
});

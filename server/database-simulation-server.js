// HTTP TEST SERVER - Test Database Integration
const http = require('http');
const url = require('url');

// Simulation of database operations
const simulateDatabase = {
  users: [],
  plans: [],
  progress: [],
  
  // Simulate save user to database
  saveUser: (userData) => {
    const user = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    simulateDatabase.users.push(user);
    console.log('📝 SIMULATED: User saved to database:', user);
    return user;
  },
  
  // Simulate save plan to database
  savePlan: (planData) => {
    const plan = {
      id: Date.now(),
      ...planData,
      createdAt: new Date().toISOString()
    };
    simulateDatabase.plans.push(plan);
    console.log('📝 SIMULATED: Plan saved to database:', plan);
    return plan;
  },
  
  // Simulate save progress to database
  saveProgress: (progressData) => {
    const progress = {
      id: Date.now(),
      ...progressData,
      createdAt: new Date().toISOString()
    };
    simulateDatabase.progress.push(progress);
    console.log('📝 SIMULATED: Progress saved to database:', progress);
    return progress;
  }
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  try {
    if (path === '/api/test') {
      // Test endpoint
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Database Test Server Working!',
        timestamp: new Date().toISOString(),
        database: 'Simulated MySQL (SmokingCessationSupportPlatform)',
        stats: {
          users: simulateDatabase.users.length,
          plans: simulateDatabase.plans.length,
          progress: simulateDatabase.progress.length
        }
      }));
      
    } else if (path === '/api/auth/register' && req.method === 'POST') {
      // Register user - SIMULATE DATABASE SAVE
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const userData = JSON.parse(body);
          console.log('📥 Registration request:', userData);
          
          // SIMULATE: Save to MySQL database
          const savedUser = simulateDatabase.saveUser({
            name: userData.name,
            email: userData.email,
            password: 'hashed_' + userData.password,
            age: userData.age,
            gender: userData.gender
          });
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'User registered and SAVED TO DATABASE!',
            userId: savedUser.id,
            user: savedUser,
            database_action: 'INSERT INTO user (Name, Email, Password, Age, Gender, CreatedAt, UpdatedAt) VALUES (...)'
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
      
    } else if (path === '/api/quit-plans' && req.method === 'POST') {
      // Create quit plan - SIMULATE DATABASE SAVE
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const planData = JSON.parse(body);
          console.log('📥 Create plan request:', planData);
          
          // SIMULATE: Save to MySQL database
          const savedPlan = simulateDatabase.savePlan({
            userId: planData.userId,
            quitDate: planData.quitDate,
            motivation: planData.motivation,
            targetDays: planData.targetDays || 30
          });
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Quit plan created and SAVED TO DATABASE!',
            planId: savedPlan.id,
            plan: savedPlan,
            database_action: 'INSERT INTO quitplan (UserID, QuitDate, Motivation, TargetDays, CreatedAt, UpdatedAt) VALUES (...)'
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
      
    } else if (path === '/api/progress/checkin' && req.method === 'POST') {
      // Record progress - SIMULATE DATABASE SAVE
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const progressData = JSON.parse(body);
          console.log('📥 Progress checkin request:', progressData);
          
          // SIMULATE: Save to MySQL database
          const savedProgress = simulateDatabase.saveProgress({
            userId: progressData.userId,
            date: progressData.date || new Date().toISOString().split('T')[0],
            status: progressData.status || 'success',
            note: progressData.note || ''
          });
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Daily progress recorded and SAVED TO DATABASE!',
            progressId: savedProgress.id,
            progress: savedProgress,
            database_action: 'INSERT INTO progress (UserID, Date, Status, Note, CreatedAt) VALUES (...)'
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
      
    } else if (path === '/api/users' && req.method === 'GET') {
      // Get all users
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Users retrieved from database',
        count: simulateDatabase.users.length,
        users: simulateDatabase.users,
        database_action: 'SELECT * FROM user ORDER BY CreatedAt DESC'
      }));
      
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Endpoint not found',
        available_endpoints: [
          'GET /api/test',
          'GET /api/users', 
          'POST /api/auth/register',
          'POST /api/quit-plans',
          'POST /api/progress/checkin'
        ]
      }));
    }
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log('🚀 Database Test Server running on port', PORT);
  console.log('📊 This server SIMULATES database operations');
  console.log('✅ When the real MySQL server works, these operations will save to actual database');
  console.log('');
  console.log('📋 Available endpoints:');
  console.log(`   GET  http://localhost:${PORT}/api/test`);
  console.log(`   GET  http://localhost:${PORT}/api/users`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/quit-plans`);
  console.log(`   POST http://localhost:${PORT}/api/progress/checkin`);
  console.log('');
  console.log('🎯 Test with frontend or curl to see simulated database operations!');
});

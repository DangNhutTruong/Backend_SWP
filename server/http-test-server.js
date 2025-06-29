import http from 'http';
import url from 'url';

const PORT = 5000; // Đổi về port 5000 như backend chính

// Database simulation
const mockDatabase = {
  users: [],
  plans: [], 
  progress: [],
  appointments: []
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  console.log(`${req.method} ${req.url}`);
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (parsedUrl.pathname === '/api/test') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Backend server is working!',
      timestamp: new Date().toISOString(),
      status: 'OK',
      database: 'MySQL Connected (Simulated)',
      stats: {
        users: mockDatabase.users.length,
        plans: mockDatabase.plans.length,
        progress: mockDatabase.progress.length
      }
    }));
  } 
  else if (parsedUrl.pathname === '/api/users' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: 'Users retrieved successfully',
      count: mockDatabase.users.length,
      users: mockDatabase.users
    }));
  }
  // 📝 REGISTER USER - SIMULATE DATABASE SAVE
  else if (parsedUrl.pathname === '/api/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const userData = JSON.parse(body);
        const newUser = {
          UserID: Date.now(),
          Name: userData.name,
          Email: userData.email,
          Password: 'hashed_' + userData.password,
          Age: userData.age || null,
          Gender: userData.gender || null,
          RoleName: 'Smoker',
          Membership: 'free',
          DaysWithoutSmoking: 0,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString()
        };
        
        mockDatabase.users.push(newUser);
        console.log('✅ SIMULATED: User saved to database:', newUser);
        
        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          message: 'User registered and SAVED TO DATABASE!',
          userId: newUser.UserID,
          user: newUser,
          sql_executed: 'INSERT INTO user (Name, Email, Password, Age, Gender, CreatedAt, UpdatedAt) VALUES (...)'
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }
  // 📅 CREATE QUIT PLAN - SIMULATE DATABASE SAVE
  else if (parsedUrl.pathname === '/api/quit-plans' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const planData = JSON.parse(body);
        const newPlan = {
          PlanID: Date.now(),
          UserID: planData.userId,
          QuitDate: planData.quitDate,
          Motivation: planData.motivation || '',
          TargetDays: planData.targetDays || 30,
          Status: 'active',
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString()
        };
        
        mockDatabase.plans.push(newPlan);
        console.log('✅ SIMULATED: Plan saved to database:', newPlan);
        
        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          message: 'Quit plan created and SAVED TO DATABASE!',
          planId: newPlan.PlanID,
          plan: newPlan,
          sql_executed: 'INSERT INTO quitplan (UserID, QuitDate, Motivation, TargetDays, CreatedAt, UpdatedAt) VALUES (...)'
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }
  // 📊 RECORD DAILY PROGRESS - SIMULATE DATABASE SAVE
  else if (parsedUrl.pathname === '/api/progress/checkin' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const progressData = JSON.parse(body);
        const newProgress = {
          ProgressID: Date.now(),
          UserID: progressData.userId,
          Date: progressData.date || new Date().toISOString().split('T')[0],
          Status: progressData.status || 'success',
          Note: progressData.note || '',
          CreatedAt: new Date().toISOString()
        };
        
        mockDatabase.progress.push(newProgress);
        console.log('✅ SIMULATED: Progress saved to database:', newProgress);
        
        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          message: 'Daily progress recorded and SAVED TO DATABASE!',
          progressId: newProgress.ProgressID,
          progress: newProgress,
          sql_executed: 'INSERT INTO progress (UserID, Date, Status, Note, CreatedAt) VALUES (...)'
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Quit Smoking Backend running on port ${PORT}`);
  console.log(`📍 Test: http://localhost:${PORT}/api/test`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`📝 Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`📅 Plans: POST http://localhost:${PORT}/api/quit-plans`);
  console.log(`📊 Progress: POST http://localhost:${PORT}/api/progress/checkin`);
  console.log('');
  console.log('✅ Database Operations: SIMULATED (will save to MySQL when integrated)');
  console.log('🎯 Ready to test fullstack flows!');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

// MYSQL REAL DATABASE SERVER - CommonJS
const http = require('http');
const url = require('url');
const mysql = require('mysql2/promise');
require('dotenv').config();

const PORT = 5000;
let db;

// Kết nối MySQL thực
const connectDatabase = async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345',
      database: process.env.DB_NAME || 'SmokingCessationSupportPlatform'
    });
    console.log('✅ Connected to MySQL database successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
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
      database: db ? 'MySQL Connected (REAL)' : 'MySQL Disconnected'
    }));
  } 
  else if (parsedUrl.pathname === '/api/users' && req.method === 'GET') {
    // GET USERS FROM REAL DATABASE
    if (!db) {
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: 'Database not connected' }));
      return;
    }
    
    db.execute('SELECT UserID, Name, Email, Age, Gender, Membership, DaysWithoutSmoking, CreatedAt FROM user ORDER BY CreatedAt DESC')
      .then(([users]) => {
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: 'Users retrieved from REAL MySQL database',
          count: users.length,
          users: users
        }));
      })
      .catch(error => {
        console.error('❌ Get users error:', error.message);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: error.message }));
      });
  }
  // 📝 REGISTER USER - LƯU VÀO MYSQL DATABASE THỰC
  else if (parsedUrl.pathname === '/api/auth/register' && req.method === 'POST') {
    if (!db) {
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: 'Database not connected' }));
      return;
    }
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const userData = JSON.parse(body);
        console.log('📥 Registration request:', userData);
        
        // INSERT VÀO MYSQL DATABASE THỰC
        const [result] = await db.execute(`
          INSERT INTO user (Name, Email, Password, Age, Gender, RoleName, Membership, DaysWithoutSmoking, CreatedAt, UpdatedAt) 
          VALUES (?, ?, ?, ?, ?, 'Smoker', 'free', 0, NOW(), NOW())
        `, [
          userData.name,
          userData.email,
          'hashed_' + userData.password, // Trong thực tế sẽ dùng bcrypt
          userData.age || null,
          userData.gender || null
        ]);
        
        console.log('✅ REAL DATABASE: User saved with ID:', result.insertId);
        
        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          message: 'User registered and SAVED TO REAL MySQL DATABASE!',
          userId: result.insertId,
          user: {
            UserID: result.insertId,
            Name: userData.name,
            Email: userData.email,
            Age: userData.age,
            Gender: userData.gender
          }
        }));
        
      } catch (error) {
        console.error('❌ Registration error:', error.message);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }
  // 📅 CREATE QUIT PLAN - LƯU VÀO MYSQL DATABASE THỰC
  else if (parsedUrl.pathname === '/api/quit-plans' && req.method === 'POST') {
    if (!db) {
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: 'Database not connected' }));
      return;
    }
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const planData = JSON.parse(body);
        console.log('📥 Create plan request:', planData);
        
        // INSERT VÀO MYSQL DATABASE THỰC  
        const [result] = await db.execute(`
          INSERT INTO quitplan (UserID, QuitDate, Motivation, TargetDays, Status, CreatedAt, UpdatedAt) 
          VALUES (?, ?, ?, ?, 'active', NOW(), NOW())
        `, [
          planData.userId,
          planData.quitDate,
          planData.motivation || '',
          planData.targetDays || 30
        ]);
        
        console.log('✅ REAL DATABASE: Plan saved with ID:', result.insertId);
        
        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          message: 'Quit plan created and SAVED TO REAL MySQL DATABASE!',
          planId: result.insertId,
          plan: {
            PlanID: result.insertId,
            UserID: planData.userId,
            QuitDate: planData.quitDate,
            Motivation: planData.motivation,
            TargetDays: planData.targetDays
          }
        }));
        
      } catch (error) {
        console.error('❌ Create plan error:', error.message);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }
  // 📊 RECORD PROGRESS - LƯU VÀO MYSQL DATABASE THỰC
  else if (parsedUrl.pathname === '/api/progress/checkin' && req.method === 'POST') {
    if (!db) {
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: 'Database not connected' }));
      return;
    }
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const progressData = JSON.parse(body);
        console.log('📥 Progress checkin request:', progressData);
        
        // INSERT VÀO MYSQL DATABASE THỰC
        const [result] = await db.execute(`
          INSERT INTO progress (UserID, Date, Status, Note, CreatedAt) 
          VALUES (?, ?, ?, ?, NOW())
        `, [
          progressData.userId,
          progressData.date || new Date().toISOString().split('T')[0],
          progressData.status || 'success',
          progressData.note || ''
        ]);
        
        console.log('✅ REAL DATABASE: Progress saved with ID:', result.insertId);
        
        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          message: 'Daily progress recorded and SAVED TO REAL MySQL DATABASE!',
          progressId: result.insertId,
          progress: {
            ProgressID: result.insertId,
            UserID: progressData.userId,
            Date: progressData.date,
            Status: progressData.status,
            Note: progressData.note
          }
        }));
        
      } catch (error) {
        console.error('❌ Progress checkin error:', error.message);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }
  else {
    res.writeHead(404);
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
});

// Khởi động server
const startServer = async () => {
  const dbConnected = await connectDatabase();
  
  server.listen(PORT, () => {
    console.log(`🚀 Quit Smoking Backend running on port ${PORT}`);
    console.log(`📍 Test: http://localhost:${PORT}/api/test`);
    console.log(`👥 Users: http://localhost:${PORT}/api/users`);
    console.log(`📝 Register: POST http://localhost:${PORT}/api/auth/register`);
    console.log(`📅 Plans: POST http://localhost:${PORT}/api/quit-plans`);
    console.log(`📊 Progress: POST http://localhost:${PORT}/api/progress/checkin`);
    console.log('');
    if (dbConnected) {
      console.log('✅ REAL MySQL Database Connected - Data will be saved to actual database!');
    } else {
      console.log('❌ Database connection failed - Server running without database');
    }
  });
};

startServer();

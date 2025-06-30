// REAL MYSQL DATABASE SERVER - Lưu thực tế vào MySQL
const http = require('http');
const url = require('url');
const mysql = require('mysql2/promise');
require('dotenv').config();

const PORT = 5000;
let db;

// Kết nối MySQL thật
const connectDatabase = async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345',
      database: process.env.DB_NAME || 'SmokingCessationSupportPlatform'
    });
    console.log('✅ Connected to REAL MySQL database!');
    console.log('📊 Database:', process.env.DB_NAME || 'SmokingCessationSupportPlatform');
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
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
  
  console.log(`🔥 ${req.method} ${req.url}`);
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (parsedUrl.pathname === '/api/test') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Backend server working with REAL MySQL!',
      timestamp: new Date().toISOString(),
      status: 'OK',
      database: db ? 'MySQL REAL DATABASE Connected ✅' : 'MySQL Disconnected ❌'
    }));
  } 
  else if (parsedUrl.pathname === '/api/users' && req.method === 'GET') {
    // GET USERS FROM REAL MYSQL
    if (!db) {
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: 'Database not connected' }));
      return;
    }
    
    db.execute('SELECT UserID, Name, Email, Age, Gender, Membership, DaysWithoutSmoking, CreatedAt FROM user ORDER BY CreatedAt DESC')
      .then(([users]) => {
        console.log(`✅ Retrieved ${users.length} users from REAL MySQL database`);
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: 'Users from REAL MySQL database',
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
  // 🔥 REGISTER USER - LƯU VÀO MYSQL THẬT
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
        console.log('🔥 REGISTRATION REQUEST:', userData);
        
        // THỰC SỰ LƯU VÀO MYSQL DATABASE
        const [result] = await db.execute(`
          INSERT INTO user (Name, Email, Password, Age, Gender, RoleName, Membership, DaysWithoutSmoking, CreatedAt, UpdatedAt) 
          VALUES (?, ?, ?, ?, ?, 'Smoker', 'free', 0, NOW(), NOW())
        `, [
          userData.name || userData.username,
          userData.email,
          'hashed_' + userData.password,
          userData.age || null,
          userData.gender || null
        ]);
        
        console.log('🎉 SUCCESS! User saved to REAL MySQL with ID:', result.insertId);
        console.log('💾 SQL: INSERT INTO user table completed');
        
        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          message: 'User SUCCESSFULLY saved to REAL MySQL database!',
          userId: result.insertId,
          database: 'REAL MySQL',
          table: 'user',
          user: {
            UserID: result.insertId,
            Name: userData.name || userData.username,
            Email: userData.email,
            Age: userData.age,
            Gender: userData.gender
          }
        }));
        
      } catch (error) {
        console.error('💥 REGISTRATION ERROR:', error.message);
        res.writeHead(500);
        res.end(JSON.stringify({ 
          success: false, 
          error: error.message,
          message: 'Failed to save to MySQL database'
        }));
      }
    });
  }
  // 🔐 LOGIN USER - KIỂM TRA MYSQL THẬT
  else if (parsedUrl.pathname === '/api/auth/login' && req.method === 'POST') {
    if (!db) {
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: 'Database not connected' }));
      return;
    }
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const loginData = JSON.parse(body);
        console.log('🔐 LOGIN REQUEST:', { email: loginData.email });
        
        // THỰC SỰ KIỂM TRA MYSQL DATABASE
        const [users] = await db.execute(`
          SELECT UserID, Name, Email, RoleName, Membership, DaysWithoutSmoking, CreatedAt 
          FROM user WHERE Email = ? AND Password = ?
        `, [
          loginData.email,
          'hashed_' + loginData.password
        ]);
        
        if (users.length > 0) {
          const user = users[0];
          console.log('🎉 LOGIN SUCCESS! User found:', user.UserID);
          
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            message: 'Login successful from REAL MySQL database!',
            userId: user.UserID,
            database: 'REAL MySQL',
            user: {
              id: user.UserID,
              name: user.Name,
              email: user.Email,
              role: user.RoleName,
              membership: user.Membership
            }
          }));
        } else {
          console.log('❌ LOGIN FAILED: Invalid credentials');
          res.writeHead(401);
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid email or password'
          }));
        }
        
      } catch (error) {
        console.error('💥 LOGIN ERROR:', error.message);
        res.writeHead(500);
        res.end(JSON.stringify({ 
          success: false, 
          error: error.message,
          message: 'Failed to check MySQL database'
        }));
      }
    });
  }
  // 📅 CREATE QUIT PLAN - LƯU VÀO MYSQL THẬT
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
        console.log('📅 CREATE PLAN REQUEST:', planData);
        
        // THỰC SỰ LƯU VÀO MYSQL DATABASE
        const [result] = await db.execute(`
          INSERT INTO quitplan (UserID, QuitDate, Motivation, TargetDays, Status, CreatedAt, UpdatedAt) 
          VALUES (?, ?, ?, ?, 'active', NOW(), NOW())
        `, [
          planData.userId,
          planData.quitDate,
          planData.motivation || '',
          planData.targetDays || 30
        ]);
        
        console.log('🎉 SUCCESS! Plan saved to REAL MySQL with ID:', result.insertId);
        
        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          message: 'Quit plan SUCCESSFULLY saved to REAL MySQL database!',
          planId: result.insertId,
          database: 'REAL MySQL',
          table: 'quitplan'
        }));
        
      } catch (error) {
        console.error('💥 CREATE PLAN ERROR:', error.message);
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
        'POST /api/auth/login',
        'POST /api/quit-plans'
      ]
    }));
  }
});

// Khởi động server
const startServer = async () => {
  console.log('🚀 Starting REAL MySQL Database Server...');
  const dbConnected = await connectDatabase();
  
  server.listen(PORT, () => {
    console.log('');
    console.log('🎉 ================================');
    console.log('🔥 REAL MySQL Backend Server running!');
    console.log('🎯 Port:', PORT);
    console.log('📊 Database: REAL MySQL (not simulation)');
    console.log('💾 Data will be SAVED to actual database!');
    console.log('🎉 ================================');
    console.log('');
    console.log('📍 Test: http://localhost:' + PORT + '/api/test');
    console.log('👥 Users: http://localhost:' + PORT + '/api/users');
    console.log('📝 Register: POST http://localhost:' + PORT + '/api/auth/register');
    console.log('🔐 Login: POST http://localhost:' + PORT + '/api/auth/login');
    console.log('');
    if (dbConnected) {
      console.log('✅ READY: Registration & Login will use MySQL database!');
    } else {
      console.log('❌ WARNING: Database not connected!');
    }
  });
};

startServer();

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
const PORT = 5000;

// Database connection
let db;
const initDatabase = async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345',
      database: process.env.DB_NAME || 'SmokingCessationSupportPlatform'
    });
    console.log('✅ Database connected successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend server is working!',
    timestamp: new Date().toISOString(),
    database: db ? 'Connected' : 'Disconnected'
  });
});

// Register new user - THỰC TẾ LUU VÀO DATABASE
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, age, gender, phone } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert into database
    const [result] = await db.execute(`
      INSERT INTO user (Name, Email, Password, Age, Gender, Phone, CreatedAt, UpdatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [name, email, hashedPassword, age || null, gender || null, phone || null]);
    
    console.log('✅ New user registered:', result.insertId);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      userId: result.insertId,
      user: { name, email, age, gender, phone }
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const [users] = await db.execute('SELECT UserID, Name, Email, Age, Gender, Membership, DaysWithoutSmoking, CreatedAt FROM user ORDER BY CreatedAt DESC');
    
    res.json({
      success: true,
      count: users.length,
      users: users
    });
    
  } catch (error) {
    console.error('❌ Get users error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// Create quit plan - THỰC TẾ LUU VÀO DATABASE
app.post('/api/quit-plans', async (req, res) => {
  try {
    const { userId, quitDate, motivation, targetDays } = req.body;
    
    const [result] = await db.execute(`
      INSERT INTO quitplan (UserID, QuitDate, Motivation, TargetDays, CreatedAt, UpdatedAt) 
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [userId, quitDate, motivation || '', targetDays || 30]);
    
    console.log('✅ New quit plan created:', result.insertId);
    
    res.status(201).json({
      success: true,
      message: 'Quit plan created successfully!',
      planId: result.insertId,
      plan: { userId, quitDate, motivation, targetDays }
    });
    
  } catch (error) {
    console.error('❌ Create plan error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create quit plan',
      error: error.message
    });
  }
});

// Record daily progress - THỰC TẾ LUU VÀO DATABASE  
app.post('/api/progress/checkin', async (req, res) => {
  try {
    const { userId, date, status, note } = req.body;
    
    const [result] = await db.execute(`
      INSERT INTO progress (UserID, Date, Status, Note, CreatedAt) 
      VALUES (?, ?, ?, ?, NOW())
    `, [userId, date || new Date().toISOString().split('T')[0], status || 'success', note || '']);
    
    console.log('✅ Daily checkin recorded:', result.insertId);
    
    res.status(201).json({
      success: true,
      message: 'Daily checkin recorded successfully!',
      checkinId: result.insertId,
      checkin: { userId, date, status, note }
    });
    
  } catch (error) {
    console.error('❌ Checkin error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to record checkin',
      error: error.message
    });
  }
});

// Start server
const startServer = async () => {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/api/test`);
    console.log(`   GET  http://localhost:${PORT}/api/users`);
    console.log(`   POST http://localhost:${PORT}/api/auth/register`);
    console.log(`   POST http://localhost:${PORT}/api/quit-plans`);
    console.log(`   POST http://localhost:${PORT}/api/progress/checkin`);
    console.log(`✅ All APIs will save data to MySQL database!`);
  });
};

startServer();

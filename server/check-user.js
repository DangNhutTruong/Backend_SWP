import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkUser() {
  let connection;
  
  try {
    console.log('🔄 Connecting to Railway MySQL...');
    
    const databaseUrl = process.env.DATABASE_URL;
    const url = new URL(databaseUrl);
    const connectionConfig = {
      host: url.hostname,
      port: parseInt(url.port),
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1)
    };

    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to database');

    // Check user data
    console.log('🔍 Checking user data...');
    const [users] = await connection.execute('SELECT id, username, email, email_verified FROM users WHERE email = ?', ['helung4@gmail.com']);
    
    if (users.length > 0) {
      console.log('👤 User found:');
      console.log(users[0]);
    } else {
      console.log('❌ User not found');
    }

    // Check all users
    console.log('\n📋 All users in database:');
    const [allUsers] = await connection.execute('SELECT id, username, email, email_verified FROM users ORDER BY created_at DESC LIMIT 5');
    allUsers.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Verified: ${user.email_verified}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📝 Database connection closed');
    }
  }
}

checkUser();

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function updateUsername() {
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

    // Update username cho user helung4@gmail.com
    console.log('🔧 Updating username for helung4@gmail.com...');
    const [result] = await connection.execute(
      'UPDATE users SET username = ? WHERE email = ?', 
      ['Helung', 'helung4@gmail.com']
    );
    
    console.log(`✅ Updated ${result.affectedRows} user(s)`);

    // Verify update
    console.log('🔍 Verifying update...');
    const [users] = await connection.execute('SELECT id, username, email FROM users WHERE email = ?', ['helung4@gmail.com']);
    
    if (users.length > 0) {
      console.log('👤 Updated user:');
      console.log(users[0]);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📝 Database connection closed');
    }
  }
}

updateUsername();

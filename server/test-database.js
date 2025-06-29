import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const testDatabaseConnection = async () => {
  try {
    console.log('🔍 Testing MySQL connection...');
    console.log('Host:', process.env.DB_HOST || 'localhost');
    console.log('Port:', process.env.DB_PORT || 3306);
    console.log('User:', process.env.DB_USER || 'root');
    console.log('Database:', process.env.DB_NAME || 'SmokingCessationSupportPlatform');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345',
      database: process.env.DB_NAME || 'SmokingCessationSupportPlatform'
    });

    console.log('✅ Connected to MySQL successfully!');
    
    // Test some basic queries
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('📋 Available databases:', databases.map(db => db.Database));
    
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Tables in current database:', tables);
    
    // Test get table structure
    try {
      const [columns] = await connection.execute('DESCRIBE user');
      console.log('📋 User table structure:', columns);
      
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM user');
      console.log('👥 Current user count:', userCount[0].count);
      
      // Test select existing users
      const [users] = await connection.execute('SELECT * FROM user LIMIT 3');
      console.log('👥 Sample users:', users);
      
    } catch (error) {
      console.log('⚠️ User table query failed:', error.message);
    }
    
    await connection.end();
    console.log('🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('📋 Error details:', error);
  }
};

testDatabaseConnection();

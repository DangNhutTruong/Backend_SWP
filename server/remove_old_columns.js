import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function removeOldColumns() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('🗑️  Removing old birth columns...');
    
    try {
      await pool.execute('ALTER TABLE users DROP COLUMN birth_day');
      console.log('✅ Removed birth_day column');
    } catch (error) {
      console.log('⚠️  birth_day column may not exist:', error.message);
    }
    
    try {
      await pool.execute('ALTER TABLE users DROP COLUMN birth_month');
      console.log('✅ Removed birth_month column');
    } catch (error) {
      console.log('⚠️  birth_month column may not exist:', error.message);
    }
    
    try {
      await pool.execute('ALTER TABLE users DROP COLUMN birth_year');
      console.log('✅ Removed birth_year column');
    } catch (error) {
      console.log('⚠️  birth_year column may not exist:', error.message);
    }
    
    console.log('🎉 All old columns removal completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
}

removeOldColumns();

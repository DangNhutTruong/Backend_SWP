import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createDatabase = async () => {
  let connection;
  
  try {
    // Kết nối MySQL server (không specify database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345'
    });

    const databaseName = process.env.DB_NAME || 'SmokingCessationSupportPlatform';
    
    console.log(`🔄 Đang tạo database '${databaseName}' (nếu chưa có)...`);
    
    // Tạo database nếu chưa có
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
    
    console.log(`✅ Database '${databaseName}' đã sẵn sàng!`);
    
  } catch (error) {
    console.error('❌ Lỗi khi tạo database:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

export default createDatabase;

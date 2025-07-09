import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Tạo kết nối database
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME || 'railway', 
      process.env.DB_USER || 'root', 
      process.env.DB_PASSWORD || 'password', 
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
      }
    );

async function fixNameField() {
  try {
    console.log('🔄 Đang kết nối database...');
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công');

    // Xóa trường name của user id = 23 để họ có thể nhập lại họ tên thật
    const result = await sequelize.query(
      "UPDATE users SET name = NULL WHERE id = 23;",
      { type: sequelize.QueryTypes.UPDATE }
    );
    
    console.log('✅ Đã xóa trường name của user ID 23');
    console.log('📝 User này sẽ có thể nhập lại họ tên thật trong profile');
    console.log('🔄 Username vẫn giữ nguyên: "Trình Hoàng Trung Hiếu"');
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await sequelize.close();
    console.log('🔒 Đã đóng kết nối database');
  }
}

fixNameField();

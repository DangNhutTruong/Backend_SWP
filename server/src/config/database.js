import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

// Use Railway DATABASE_URL if available, otherwise fallback to individual configs
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      timezone: '+07:00',
      dialectOptions: {
        charset: 'utf8mb4'
      }
    })
  : new Sequelize(
      process.env.DB_NAME || 'smokingcessationsupportplatform',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '12345',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        timezone: '+07:00',
        dialectOptions: {
          charset: 'utf8mb4'
        }
      }
    );

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    
    if (process.env.DATABASE_URL) {
      console.log('✅ Railway MySQL Database connected successfully!');
      console.log('🌐 Using Railway Cloud Database');
      console.log('🔗 Host: yamanote.proxy.rlwy.net:30311');
      console.log('📊 Database: railway');
    } else {
      console.log('✅ Local MySQL Database connected successfully!');
      console.log(`📊 Database: ${process.env.DB_NAME || 'smokingcessationsupportplatform'}`);
      console.log(`🏠 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
      console.log(`👤 User: ${process.env.DB_USER || 'root'}`);
    }
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    
    if (process.env.DATABASE_URL) {
      console.log('🔄 Railway connection failed - check your internet connection');
      console.log('💡 Make sure Railway DATABASE_URL is correct in .env file');
    } else {
      console.log('🔄 Local MySQL connection failed - check MySQL server');
      console.log('💡 Please check your MySQL connection settings in .env file');
    }
    
    console.log('🔄 Server will continue running without database connection');
  }
};

// Initialize connection
testConnection();

export default sequelize;
export { testConnection };

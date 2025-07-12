import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

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
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
        charset: 'utf8mb4',
        timezone: '+00:00',
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false
    };
};

const dbConfig = createDbConfig();
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('\n🔗 ════════════════════════════════════════════════');
        console.log('✅  DATABASE CONNECTION SUCCESSFUL');
        console.log('🔗 ════════════════════════════════════════════════');

        // Log connection info based on config type
        if (process.env.DATABASE_URL || process.env.DB_URL) {
            console.log('�  Provider: Railway MySQL');
            console.log('🌐  Host:', process.env.DB_HOST || 'from connection string');
        } else {
            console.log('�  Provider: Local MySQL');
            console.log('🌐  Host:', process.env.DB_HOST);
            console.log('🗄️  Database:', process.env.DB_NAME);
            console.log('👤  User:', process.env.DB_USER);
        }
      }
    );

        // Test a simple query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('🔍  Test Query: PASSED');
        console.log('🔗 ════════════════════════════════════════════════\n');

        connection.release();
    } catch (error) {
        console.log('\n❌ ════════════════════════════════════════════════');
        console.log('💥  DATABASE CONNECTION FAILED');
        console.log('❌ ════════════════════════════════════════════════');
        console.error('🚨  Error:', error.message);
        console.error('💡  Hint: Check your Railway database credentials');
        console.log('❌ ════════════════════════════════════════════════\n');
        process.exit(1);
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

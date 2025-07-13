import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Debug env variables
console.log('🔍 DEBUG ENV VARIABLES:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME);

// Support both Railway connection string and individual parameters
const createDbConfig = () => {
    // Use individual parameters for better control
    return {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4',
        timezone: '+00:00',
        ssl: {
            rejectUnauthorized: false
        }
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
};

export { pool, testConnection };

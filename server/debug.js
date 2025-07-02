import dotenv from 'dotenv';
import { testConnection } from './src/config/database.js';

dotenv.config();

console.log('🔍 Environment Check:');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('PORT:', process.env.PORT);

console.log('\n🔍 Testing database connection...');
testConnection().then(() => {
    console.log('✅ Database test completed');
}).catch((error) => {
    console.error('❌ Database test failed:', error.message);
});

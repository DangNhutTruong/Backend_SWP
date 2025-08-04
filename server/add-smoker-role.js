import { pool } from './src/config/database.js';

async function addSmokerRole() {
    try {
        console.log('Adding smoker role to users table...');
        await pool.query("ALTER TABLE users MODIFY COLUMN role enum('user','admin','coach','smoker') DEFAULT 'user'");
        console.log('✅ Successfully added smoker role to users table');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding smoker role:', error);
        process.exit(1);
    }
}

addSmokerRole();

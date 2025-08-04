import { pool } from './src/config/database.js';

async function checkUsersTable() {
    try {
        const [rows] = await pool.query('DESCRIBE users');
        console.log('Users table structure:');
        rows.forEach(row => {
            console.log(`${row.Field} - ${row.Type} - Null: ${row.Null} - Key: ${row.Key} - Default: ${row.Default}`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsersTable();

import { pool } from './src/config/database.js';

async function checkSchema() {
    try {
        console.log('🔍 Checking appointment table schema...');
        
        // Check table structure
        const [columns] = await pool.execute('DESCRIBE appointment');
        console.log('\n📋 Appointment table columns:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'} ${col.Key ? `[${col.Key}]` : ''}`);
        });
        
        // Check sample data
        const [sample] = await pool.execute('SELECT * FROM appointment LIMIT 1');
        if (sample.length > 0) {
            console.log('\n📄 Sample record:');
            console.log(sample[0]);
        } else {
            console.log('\n📄 No records found in appointment table');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkSchema();

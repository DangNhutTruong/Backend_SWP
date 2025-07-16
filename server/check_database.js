import { pool } from './src/config/database.js';
import { ensureTablesExist } from './src/controllers/authController.js';

async function checkAndCreateDatabase() {
    console.log('🔍 Checking database connection and tables...');
    
    try {
        // Test database connection
        const connection = await pool.getConnection();
        console.log('✅ Database connection successful');
        
        // Check and create tables
        await ensureTablesExist();
        console.log('✅ Database tables checked and created if needed');
        
        // Check appointments table specifically
        const [appointmentsTable] = await connection.query(`
            SHOW TABLES LIKE 'appointments'
        `);
        
        if (appointmentsTable.length > 0) {
            console.log('✅ Appointments table exists');
            
            // Check appointments table structure
            const [appointmentsColumns] = await connection.query(`
                DESCRIBE appointments
            `);
            
            console.log('📋 Appointments table structure:');
            appointmentsColumns.forEach(column => {
                console.log(`   - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
            });
            
            // Check if there are any appointments
            const [appointments] = await connection.query(`
                SELECT COUNT(*) as count FROM appointments
            `);
            
            console.log(`📊 Total appointments in database: ${appointments[0].count}`);
        } else {
            console.log('❌ Appointments table does not exist, will be created');
        }
        
        connection.release();
        console.log('✅ Database check completed successfully');
        
    } catch (error) {
        console.error('❌ Database check failed:', error);
    } finally {
        process.exit();
    }
}

checkAndCreateDatabase();

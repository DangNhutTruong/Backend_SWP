import { pool } from './src/config/database.js';
import { ensureTablesExist } from './src/controllers/authController.js';
import { createQuitPlanTable } from './src/utils/createQuitPlanTable.js';
import { createProgressTable } from './src/utils/createProgressTable.js';

async function initializeDatabase() {
    try {
        console.log('🚀 Initializing database...');
        
        // Test database connection
        const connection = await pool.getConnection();
        console.log('✅ Database connection successful');
        connection.release();
        
        // Ensure all tables exist
        console.log('\n📋 Creating core tables...');
        await ensureTablesExist();
        
        // Create quit plan table
        console.log('\n📋 Creating quit plan table...');
        await createQuitPlanTable();
        
        // Create progress table
        console.log('\n📋 Creating progress table...');
        await createProgressTable();
        
        // Check appointments table specifically
        console.log('\n📋 Checking appointments table...');
        const [tables] = await pool.execute(`SHOW TABLES LIKE 'appointments'`);
        
        if (tables.length === 0) {
            console.log('❌ Appointments table does not exist. Creating it...');
            
            // Create the appointments table
            await pool.execute(`
                CREATE TABLE appointments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    coach_id INT NOT NULL,
                    date DATE NOT NULL,
                    time TIME NOT NULL,
                    duration_minutes INT DEFAULT 120,
                    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
                    notes TEXT,
                    rating INT,
                    review_text TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_user_id (user_id),
                    INDEX idx_coach_id (coach_id),
                    INDEX idx_date (date),
                    INDEX idx_status (status)
                )
            `);
            
            console.log('✅ Appointments table created successfully');
        } else {
            console.log('✅ Appointments table already exists');
            
            // Check table structure
            const [columns] = await pool.execute('DESCRIBE appointments');
            
            // Check if duration_minutes column exists
            const hasDurationMinutes = columns.some(col => col.Field === 'duration_minutes');
            if (!hasDurationMinutes) {
                console.log('❌ Missing duration_minutes column. Adding it...');
                await pool.execute(`ALTER TABLE appointments ADD COLUMN duration_minutes INT DEFAULT 120 AFTER time`);
                console.log('✅ Added duration_minutes column');
            }
        }
        
        console.log('\n✅ Database initialization completed successfully');
        
    } catch (error) {
        console.error('\n❌ Database initialization failed:', error);
    } finally {
        process.exit(0);
    }
}

// Run the initialization
initializeDatabase(); 
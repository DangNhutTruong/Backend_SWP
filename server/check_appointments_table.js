import { pool } from './src/config/database.js';

async function checkAndFixAppointmentsTable() {
    try {
        console.log('🔍 Checking appointments table...');
        
        // Check if the table exists
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
            console.log('✅ Appointments table exists');
            
            // Check table structure
            const [columns] = await pool.execute('DESCRIBE appointments');
            console.log('📋 Current table structure:');
            columns.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'} ${col.Key ? `[${col.Key}]` : ''}`);
            });
            
            // Check if duration_minutes column exists
            const hasDurationMinutes = columns.some(col => col.Field === 'duration_minutes');
            if (!hasDurationMinutes) {
                console.log('❌ Missing duration_minutes column. Adding it...');
                await pool.execute(`ALTER TABLE appointments ADD COLUMN duration_minutes INT DEFAULT 120 AFTER time`);
                console.log('✅ Added duration_minutes column');
            }
            
            // Check if status column has the correct ENUM values
            const statusColumn = columns.find(col => col.Field === 'status');
            if (statusColumn && !statusColumn.Type.includes("enum('pending','confirmed','completed','cancelled')")) {
                console.log('❌ Status column has incorrect ENUM values. Fixing...');
                await pool.execute(`ALTER TABLE appointments MODIFY COLUMN status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending'`);
                console.log('✅ Fixed status column');
            }
        }
        
        // Check if there are any appointments
        const [count] = await pool.execute('SELECT COUNT(*) as count FROM appointments');
        console.log(`📊 Total appointments: ${count[0].count}`);
        
        if (count[0].count === 0) {
            console.log('⚠️ No appointments found in the database');
        } else {
            // Show a sample of appointments
            const [sample] = await pool.execute('SELECT * FROM appointments LIMIT 5');
            console.log('📋 Sample appointments:');
            sample.forEach(apt => {
                console.log(`  - ID: ${apt.id}, User: ${apt.user_id}, Coach: ${apt.coach_id}, Date: ${apt.date}, Time: ${apt.time}, Status: ${apt.status}`);
            });
        }
        
        console.log('✅ Appointments table check completed');
        
    } catch (error) {
        console.error('❌ Error checking appointments table:', error);
    } finally {
        process.exit(0);
    }
}

// Run the function
checkAndFixAppointmentsTable(); 
import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create the messages table for the coach messaging system
 */
async function fixMessageTable() {
    try {
        console.log('📝 Creating messages table if it doesn\'t exist...');
        
        // Create table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                appointment_id INT NOT NULL,
                sender_type ENUM('user', 'coach') NOT NULL,
                text TEXT NOT NULL,
                read_by_coach BOOLEAN DEFAULT FALSE,
                read_by_user BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (appointment_id) REFERENCES appointment(id) ON DELETE CASCADE
            )
        `);
        
        console.log('✅ Table structure created');
        
        // Add indexes (ignore if already exists)
        try {
            await pool.query('ALTER TABLE messages ADD INDEX idx_messages_appointment_id (appointment_id)');
            console.log('✅ Index on appointment_id created');
        } catch (indexError) {
            if (indexError.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️ Index on appointment_id already exists');
            } else {
                throw indexError;
            }
        }
        
        try {
            await pool.query('ALTER TABLE messages ADD INDEX idx_messages_read_sender (sender_type, read_by_coach, read_by_user)');
            console.log('✅ Index on read status created');
        } catch (indexError) {
            if (indexError.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️ Index on read status already exists');
            } else {
                throw indexError;
            }
        }
        
        console.log('✅ Messages table setup complete!');
    } catch (error) {
        console.error('❌ Error creating messages table:', error);
        throw error;
    }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    fixMessageTable()
        .then(() => {
            console.log('✨ Message table script completed successfully');
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Failed to create message table:', err);
            process.exit(1);
        });
}

export default fixMessageTable;

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
async function createMessagesTable() {
    try {
        console.log('📝 Creating messages table if it doesn\'t exist...');
        
        // Read SQL file
        const sqlFile = path.join(__dirname, 'create-messages-table-fixed.sql');
        const sqlScript = fs.readFileSync(sqlFile, 'utf8');
        
        // Split by semicolon to get individual statements and clean them
        const statements = sqlScript.split(';')
            .map(statement => statement.trim())
            .filter(statement => statement && !statement.startsWith('--'));
        
        // Execute each statement
        for (const statement of statements) {
            if (statement) {
                try {
                    await pool.query(statement);
                    console.log(`✅ Executed SQL statement successfully`);
                } catch (error) {
                    // Handle duplicate key error
                    if (error.code === 'ER_DUP_KEYNAME') {
                        console.log('ℹ️ Index already exists, continuing...');
                    } else {
                        console.error(`❌ Error executing SQL: ${statement}`);
                        console.error(`Error details: ${error.message}`);
                        // Only throw for errors other than duplicate index
                        if (error.code !== 'ER_DUP_KEYNAME') {
                            throw error;
                        }
                    }
                }
            }
        }
        
        console.log('✅ Messages table created successfully');
    } catch (error) {
        console.error('❌ Error creating messages table:', error.message);
        throw error;
    }
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    createMessagesTable()
        .then(() => {
            console.log('✨ Messages table script completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Failed to create messages table:', error);
            process.exit(1);
        });
}

export default createMessagesTable;
